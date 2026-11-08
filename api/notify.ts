import type { VercelRequest, VercelResponse } from "@vercel/node";

// MACALOCATOR notification hub — SMS, voice calls (Twilio), Telegram.
// Self-contained on purpose: the Vercel Node builder does not rewrite
// cross-directory relative imports, so this file inlines lib/notify-server.ts.
// Keep the two in sync when changing message logic.

type Channel = "sms" | "whatsapp" | "voice" | "telegram" | "email";

type NotifyResult = {
  channel: Channel;
  mode: "live" | "demo";
  ok: boolean;
  to: string;
  detail: string;
};

function channelStatus() {
  return {
    sms: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER),
    whatsapp: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM),
    voice: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER),
    telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    email: Boolean(process.env.RESEND_API_KEY && process.env.NOTIFICATION_EMAIL_FROM),
  };
}

async function twilioSend(endpoint: string, params: Record<string, string>) {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams(params),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Twilio HTTP ${res.status}`);
  return data;
}

async function sendNotification(opts: {
  channel: Channel;
  to: string;
  message: string;
  lang?: "en" | "es";
  subject?: string;
  origin?: string;
}): Promise<NotifyResult> {
  const { channel, to, message, lang = "en", subject, origin } = opts;
  if (!["sms", "whatsapp", "voice", "telegram", "email"].includes(channel)) {
    return { channel, mode: "demo", ok: false, to, detail: `Unknown channel "${channel}" — use sms, whatsapp, voice, telegram, or email.` };
  }
  const status = channelStatus();

  try {
    if (channel === "telegram") {
      if (!status.telegram) {
        return { channel, mode: "demo", ok: true, to, detail: "TELEGRAM_BOT_TOKEN not set — message composed, not delivered." };
      }
      const chatId = to || process.env.TELEGRAM_CHAT_ID || "";
      if (!chatId) return { channel, mode: "demo", ok: false, to, detail: "No Telegram chat ID provided." };
      const res = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message, parse_mode: "HTML" }),
      });
      const data: any = await res.json().catch(() => ({}));
      if (!res.ok || !data?.ok) throw new Error(data?.description || `Telegram HTTP ${res.status}`);
      return { channel, mode: "live", ok: true, to: chatId, detail: "Telegram message delivered." };
    }

    if (channel === "sms" || channel === "whatsapp") {
      const isWhatsApp = channel === "whatsapp";
      if (!status[channel]) {
        return { channel, mode: "demo", ok: true, to, detail: `Twilio credentials not set — ${isWhatsApp ? "WhatsApp message" : "SMS"} composed, not sent.` };
      }
      const data = await twilioSend("Messages.json", {
        To: isWhatsApp ? `whatsapp:${to}` : to,
        From: isWhatsApp ? `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}` : process.env.TWILIO_FROM_NUMBER!,
        Body: message,
      });
      return { channel, mode: "live", ok: true, to, detail: `${isWhatsApp ? "WhatsApp" : "SMS"} queued (SID ${data.sid}).` };
    }

    if (channel === "email") {
      if (!status.email) {
        return { channel, mode: "demo", ok: true, to, detail: "RESEND_API_KEY / NOTIFICATION_EMAIL_FROM not set — email composed, not sent." };
      }
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.NOTIFICATION_EMAIL_FROM,
          to: [to],
          subject: subject || "MACALOCATOR",
          text: message,
        }),
      });
      const data: any = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `Resend HTTP ${res.status}`);
      return { channel, mode: "live", ok: true, to, detail: `Email queued (ID ${data.id}).` };
    }

    // voice — Twilio outbound call reading the reminder with <Say>
    if (!status.voice) {
      return { channel, mode: "demo", ok: true, to, detail: "Twilio credentials not set — call script composed, not placed." };
    }
    const base = process.env.PUBLIC_BASE_URL || origin || "http://localhost:3000";
    const twimlUrl = `${base}/api/voice/twiml?msg=${encodeURIComponent(message)}&lang=${lang}`;
    const data = await twilioSend("Calls.json", {
      To: to,
      From: process.env.TWILIO_FROM_NUMBER!,
      Url: twimlUrl,
    });
    return { channel, mode: "live", ok: true, to, detail: `Voice call queued (SID ${data.sid}).` };
  } catch (err: any) {
    return { channel, mode: status[channel] ? "live" : "demo", ok: false, to, detail: `Provider error: ${err?.message || err}` };
  }
}

// GET  -> which channels are live vs demo
// POST -> send one notification { channel, to, message, lang }

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    return res.status(200).json({ channels: channelStatus() });
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { channel, to, message, lang, subject } = req.body || {};
  if (!channel || !message?.trim()) {
    return res.status(400).json({ error: "channel and message are required" });
  }
  const result = await sendNotification({
    channel: channel as Channel,
    to: to || "",
    message,
    lang: lang === "es" ? "es" : "en",
    subject,
    origin: `https://${req.headers.host}`,
  });
  return res.status(result.ok ? 200 : 502).json(result);
}
