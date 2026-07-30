import { sendJson, healthPayload } from "./_openai-coaches.js";

export default function handler(req, res) {
  if (req.method === "OPTIONS") return sendJson(res, 204, {});
  return sendJson(res, 200, healthPayload());
}
