import { createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = resolve(fileURLToPath(new URL(".", import.meta.url)));
const port = Number(process.env.PORT || 4191);
const host = process.env.HOST || (process.env.K_SERVICE ? "0.0.0.0" : "127.0.0.1");
const openaiApiKey = process.env.OPENAI_API_KEY || "";
const openaiModel = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const maxBodyBytes = Number(process.env.MAX_BODY_BYTES || 1024 * 1024);

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
  const draft = input.pending_draft || {};
  const notes = (input.personal_knowledge_notes || []).slice(0, 5);
  return [
    "あなたはProofolio EncoreのAIナレッジコーチです。",
    "役割は、ユーザーの思考、人格、価値観、判断軸、関心、違和感を対話で映し取り、まだキャリア資産化を急がず、有用なPersonal Knowledgeへ育てることです。",
    "キャリアコーチのように寄り添いますが、転職や応募に急がせないでください。",
    "記録や資産化を促すのは、対話が十分に熟してからにしてください。",
    "返答は自然な日本語で、受け止め、見立て、問い返し、次に話すとよさそうな方向を含めます。",
    "医療、法律、金融、雇用上の断定助言は避け、重要判断は専門家確認を促してください。",
    "",
    "必ず次のJSONだけを返してください。Markdownは使わないでください。",
    JSON.stringify({
      title: "今回の対話の短い見出し",
      intent: "knowledge/career/network/proof/entry/navigator のいずれか",
      summary: "ユーザーの話を短く整理",
      coach_view: "寄り添いながらの見立て。性格や判断軸を決めつけない",
      coach_question: "次に自然に話したくなる問い返しを1つ",
      next_action: "次の対話で深める方向。記録を急がせない",
      maturity: "1から4の数値。1-2は記録に誘導しない。3以上で記録候補",
      knowledge_tags: ["価値観や関心タグを3-5個"],
      should_offer_record: false
    }),
    "",
    `今回の入力: ${input.text || ""}`,
    `前回の下書き: ${draft.summary || "なし"}`,
    `前回の成熟度: ${draft.maturity || "なし"}`,
    `既存Personal Knowledge Notes: ${JSON.stringify(notes)}`
  ].join("\n");
}

async function handleEncoreCoach(req, res) {
  if (!openaiApiKey) {
    sendJson(res, 500, {
      ok: false,
      error: "OPENAI_API_KEY is not set on the server."
    });
    return;
  }

  try {
    const input = JSON.parse(await collectBody(req));
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
            content: [{ type: "input_text", text: buildPrompt(input) }]
          }
        ],
        temperature: 0.55,
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
      ok: true,
      ...parsed,
      source: "openai",
      model: openaiModel
    });
  } catch (error) {
    sendJson(res, 500, {
      ok: false,
      error: error.message || "Encore AI coach failed."
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
      name: "tanq-encore-ai-server",
      model: openaiModel,
      openai_configured: Boolean(openaiApiKey)
    });
    return;
  }
  if (req.method === "POST" && req.url?.startsWith("/api/encore-coach")) {
    await handleEncoreCoach(req, res);
    return;
  }
  await serveStatic(req, res);
});

server.listen(port, host, () => {
  const displayHost = host === "0.0.0.0" ? "127.0.0.1" : host;
  console.log(`Proofolio Encore AI server: http://${displayHost}:${port}/encore-tool/`);
  console.log(`Encore AI endpoint: http://${displayHost}:${port}/api/encore-coach`);
});
