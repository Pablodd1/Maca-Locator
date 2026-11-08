import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sendNotification, channelStatus, type Channel } from "../lib/notify-server.ts";

// Dispatch hub for SMS / voice-call / Telegram notifications.
// GET  -> which channels are live vs demo
// POST -> send one notification { channel, to, message, lang }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    return res.status(200).json({ channels: channelStatus() });
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { channel, to, message, lang } = req.body || {};
  if (!channel || !message?.trim()) {
    return res.status(400).json({ error: "channel and message are required" });
  }
  const result = await sendNotification({
    channel: channel as Channel,
    to: to || "",
    message,
    lang: lang === "es" ? "es" : "en",
    origin: `https://${req.headers.host}`,
  });
  return res.status(result.ok ? 200 : 502).json(result);
}
