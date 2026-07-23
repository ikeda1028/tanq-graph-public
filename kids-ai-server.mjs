import { createReadStream, existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(fileURLToPath(new URL(".", import.meta.url)));
const port = Number(process.env.PORT || 4180);
const openaiApiKey = process.env.OPENAI_API_KEY || "";
const openaiModel = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const maxBodyBytes = Number(process.env.MAX_BODY_BYTES || 8 * 1024 * 1024);

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml"
};

function sendJson(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers": "content-type,authorization"
  });
  res.end(JSON.stringify(payload));
}

function collectBody(req) {
  return new Promise((resolveBody, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBodyBytes) {
        reject(new Error("Request body is too large."));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolveBody(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

function extractOutputText(response) {
  if (response.output_text) return response.output_text;
  const parts = [];
  for (const item of response.output || []) {
    for (const content of item.content || []) {
      if (content.text) parts.push(content.text);
    }
  }
  return parts.join("\n").trim();
}

function parseJsonText(text) {
  const trimmed = String(text || "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("AI response was not valid JSON.");
  }
}

function buildPrompt(input) {
  const learner = input.learner || {};
  const coach = input.coach || {};
  return [
    `あなたはTANQのAIコーチ「${coach.name || "Mite Coach"}」です。`,
    `コーチの役割: ${coach.role || "写真から発見を見つけ、年齢/月齢に合わせて問いを育てるコーチ"}`,
    `口調: ${coach.tone || "やさしい、短い、安心できる、断定しすぎない"}`,
    `構造的問いの方針: ${coach.structural || "色、形、数、場所、比較、原因、証拠を問いにする"}`,
    `生成的問いの方針: ${coach.generative || "遊び、想像、改善、作品、誰かに見せる行動へ広げる"}`,
    `安全境界: ${coach.safety || "危険な場所、知らない人、個人情報、医療判断は大人と確認する"}`,
    "目的は、子どもの写真と発話から答えを断定することではなく、観察と探究を育てることです。",
    "写真内の物体名は不確実性を含めて推定し、危険・個人情報・医療/法律/金融助言は避けてください。",
    "月齢・年齢に合わせ、短く、やさしい日本語で返してください。",
    "",
    "必ず次のJSONだけを返してください。Markdownは使わないでください。",
    JSON.stringify({
      title: "短い見出し",
      coach_name: "使ったコーチ名",
      object_guess: "写真に写っていそうなもの。不確実なら「...かもしれません」",
      learner_level: "乳幼児/幼児/小学生低学年/小学生高学年など",
      observation: "写真や入力から観察できること",
      encouragement: "子どもへの短い励まし",
      structural_questions: ["観察・比較・分類・原因・証拠を問う構造的問いを3つ"],
      generative_questions: ["想像・創造・改善・社会との接続を促す生成的問いを3つ"],
      questions: ["追加の問いを2つ"],
      actions: ["次に安全にできる行動を3つ"],
      safety_note: "安全上の注意を1つ"
    }),
    "",
    `年齢: ${learner.age || "未入力"}`,
    `月齢: ${learner.months || "未入力"}`,
    `レベル目安: ${learner.levelLabel || learner.level || "未入力"}`,
    `ふしぎ: ${input.wonder || "未入力"}`,
    `場所: ${input.place || input.location || "未入力"}`,
    `次にしたいこと: ${input.next_action || "未入力"}`,
    `写真メモ: ${input.photo_observation ? JSON.stringify(input.photo_observation) : "未入力"}`
  ].join("\n");
}

async function handleKidsCoach(req, res) {
  if (!openaiApiKey) {
    sendJson(res, 500, {
      ok: false,
      error: "OPENAI_API_KEY is not set on the server."
    });
    return;
  }

  try {
    const input = JSON.parse(await collectBody(req));
    const content = [{ type: "input_text", text: buildPrompt(input) }];
    if (input.image_data_url) {
      content.push({ type: "input_image", image_url: input.image_data_url });
    }

    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "authorization": `Bearer ${openaiApiKey}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({
        model: openaiModel,
        input: [
          {
            role: "user",
            content
          }
        ],
        temperature: 0.4,
        max_output_tokens: 900
      })
    });

    const data = await response.json();
    if (!response.ok) {
      sendJson(res, response.status, {
        ok: false,
        error: data.error?.message || "OpenAI API request failed.",
        details: data.error || data
      });
      return;
    }

    const parsed = parseJsonText(extractOutputText(data));
    sendJson(res, 200, {
      ...parsed,
      source: "openai",
      model: openaiModel
    });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: error.message || "Kids AI coach failed."
    });
  }
}

async function serveStatic(req, res) {
  const url = new URL(req.url || "/", `http://${req.headers.host || "127.0.0.1"}`);
  let pathname = decodeURIComponent(url.pathname);
  if (pathname === "/") pathname = "/index.html";
  if (pathname.endsWith("/")) pathname += "index.html";

  const filePath = normalize(join(rootDir, pathname));
  if (!filePath.startsWith(rootDir) || !existsSync(filePath)) {
    sendJson(res, 404, { ok: false, error: "Not found." });
    return;
  }

  const ext = extname(filePath);
  res.writeHead(200, {
    "content-type": mimeTypes[ext] || "application/octet-stream"
  });
  createReadStream(filePath).pipe(res);
}

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    sendJson(res, 204, {});
    return;
  }
  if (req.url?.startsWith("/health")) {
    sendJson(res, 200, {
      ok: true,
      name: "tanq-kids-ai-server",
      model: openaiModel,
      openai_configured: Boolean(openaiApiKey)
    });
    return;
  }
  if (req.method === "POST" && req.url?.startsWith("/api/kids-coach")) {
    await handleKidsCoach(req, res);
    return;
  }
  await serveStatic(req, res);
});

server.listen(port, "127.0.0.1", () => {
  console.log(`TANQ Kids AI server: http://127.0.0.1:${port}/kids-tool/`);
  console.log(`Kids AI endpoint: http://127.0.0.1:${port}/api/kids-coach`);
});
