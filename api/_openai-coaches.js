const openaiModel = process.env.OPENAI_MODEL || "gpt-4.1-mini";
const maxBodyBytes = Number(process.env.MAX_BODY_BYTES || 8 * 1024 * 1024);

export function applyCors(res) {
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "GET,POST,OPTIONS");
  res.setHeader("access-control-allow-headers", "content-type,authorization");
}

export function sendJson(res, status, payload) {
  applyCors(res);
  res.status(status).json(payload);
}

export async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");

  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBodyBytes) throw new Error("Request body is too large.");
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}");
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

export function buildKidsPrompt(input) {
  const learner = input.learner || {};
  const coach = input.coach || {};
  return [
    `あなたはTANQのAI探究ナビゲーター「${coach.name || "Mite Navigator"}」です。`,
    `ナビゲーターの役割: ${coach.role || "写真から発見を見つけ、年齢/月齢に合わせて問いを育てるAI探究ナビゲーター"}`,
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
      coach_name: "使ったナビゲーター名",
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

export function buildEncorePrompt(input) {
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

export function buildInquiryDiagnosisPrompt(input) {
  const theme = input.theme || {};
  const criteria = input.criteria || {};
  const similar = input.similar || [];
  const comments = input.comments || [];
  const supports = input.supports || [];
  const criteriaText = [
    `重視する観点: ${criteria.focus || "問いの明確さ、検証可能性、社会性、必要な支援の具体性、次の一手"}`,
    `高評価条件: ${criteria.high || "小さく試せる次の行動、協力者の入り口、観察できる成果があること"}`,
    `注意条件: ${criteria.risk || "課題が大きすぎる、対象者や検証方法が曖昧、法務・医療・金融など専門判断が必要な場合は慎重にする"}`,
    `コメント方針: ${criteria.tone || "短く、前向きに、ただし根拠なく成功を断定しない"}`
  ].join("\n");

  return [
    "あなたはTANQ公開探究ボードのAI診断員です。",
    "公開された探究テーマを、閲覧者と支援者が判断しやすいように診断します。",
    "診断は教育・探究支援の観点で行い、投資助言、法律助言、医療助言、合否判定のような断定は避けてください。",
    "類似課題数は入力されたsimilar_countを採用し、勝手に増減させないでください。",
    "実現可能性は、テーマがすぐ成功する確率ではなく、小さく検証を始められる度合いとして評価してください。",
    "",
    "管理者が設定した診断基準:",
    criteriaText,
    "",
    "必ず次のJSONだけを返してください。Markdownは使わないでください。",
    JSON.stringify({
      similar_count: 0,
      feasibility_score: 72,
      feasibility_level: "高い/中程度/要検討",
      diagnosis: "診断理由を80字程度で説明",
      strengths: ["強みを2つ"],
      risks: ["注意点を2つ"],
      next_actions: ["次に試すことを2つ"],
      recommended_supports: ["必要な支援種別を最大4つ"]
    }),
    "",
    `similar_count: ${Number(input.similar_count || similar.length || 0)}`,
    `探究テーマ: ${JSON.stringify(theme)}`,
    `類似テーマ: ${JSON.stringify(similar.slice(0, 8))}`,
    `評価コメント: ${JSON.stringify(comments.slice(0, 8))}`,
    `支援申し込み: ${JSON.stringify(supports.slice(0, 8))}`
  ].join("\n");
}

export async function askOpenAi({ input, prompt, imageDataUrl, temperature = 0.5 }) {
  const openaiApiKey = process.env.OPENAI_API_KEY || "";
  if (!openaiApiKey) {
    const error = new Error("OPENAI_API_KEY is not set on the server.");
    error.status = 500;
    throw error;
  }

  const content = [{ type: "input_text", text: prompt }];
  if (imageDataUrl) content.push({ type: "input_image", image_url: imageDataUrl });

  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${openaiApiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({
      model: openaiModel,
      input: [{ role: "user", content }],
      temperature,
      max_output_tokens: 900
    })
  });

  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error?.message || "OpenAI API request failed.");
    error.status = response.status;
    error.details = data.error || data;
    throw error;
  }

  return {
    ...parseJsonText(extractOutputText(data)),
    source: "openai",
    model: openaiModel,
    request_mode: input.mode || "coach"
  };
}

export function healthPayload() {
  return {
    ok: true,
    name: "tanq-graph-ai-api",
    model: openaiModel,
    openai_configured: Boolean(process.env.OPENAI_API_KEY)
  };
}
