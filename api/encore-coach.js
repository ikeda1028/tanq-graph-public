import { askOpenAi, buildEncorePrompt, readJsonBody, sendJson } from "./_openai-coaches.js";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") return sendJson(res, 204, {});
  if (req.method !== "POST") return sendJson(res, 405, { ok: false, error: "Method not allowed." });

  try {
    const input = await readJsonBody(req);
    const result = await askOpenAi({
      input,
      prompt: buildEncorePrompt(input),
      temperature: 0.55
    });
    return sendJson(res, 200, { ok: true, ...result });
  } catch (error) {
    return sendJson(res, error.status || 500, {
      ok: false,
      error: error.message || "Encore AI coach failed.",
      details: error.details
    });
  }
}
