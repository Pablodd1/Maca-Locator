// MACALOCATOR notification layer — SMS, voice calls (Twilio), Telegram.
// Real provider calls when env credentials exist; otherwise a clearly-labeled
// demo mode that composes and returns the exact payload that would be sent.

export type Channel = "sms" | "whatsapp" | "voice" | "telegram" | "email";

export type NotifyResult = {
  channel: Channel;
  mode: "live" | "demo";
  ok: boolean;
  to: string;
  detail: string;
};

export function channelStatus() {
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

// Base URL for TwiML voice callbacks — set PUBLIC_BASE_URL in production
// (e.g. https://maca-locator.vercel.app). Twilio must reach it publicly.
function twimlBaseUrl(reqUrlOrigin?: string) {
  return process.env.PUBLIC_BASE_URL || reqUrlOrigin || "http://localhost:3000";
}

export async function sendNotification(opts: {
  channel: Channel;
  to: string;
  message: string;
  lang?: "en" | "es";
  subject?: string;
  origin?: string;
}): Promise<NotifyResult> {
  const { channel, to, message, lang = "en", origin } = opts;
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
          subject: opts.subject || "MACALOCATOR",
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
    const twimlUrl = `${twimlBaseUrl(origin)}/api/voice/twiml?msg=${encodeURIComponent(message)}&lang=${lang}`;
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

// Reply to an inbound client SMS (used by the two-way webhook).
export async function twilioSmsReply(to: string, body: string): Promise<NotifyResult> {
  const live = channelStatus().sms;
  if (!live) {
    return { channel: "sms", mode: "demo", ok: true, to, detail: `Reply composed (demo): "${body}"` };
  }
  try {
    const data = await twilioSend("Messages.json", {
      To: to,
      From: process.env.TWILIO_FROM_NUMBER!,
      Body: body,
    });
    return { channel: "sms", mode: "live", ok: true, to, detail: `Reply sent (SID ${data.sid}).` };
  } catch (err: any) {
    return { channel: "sms", mode: "live", ok: false, to, detail: `Provider error: ${err?.message || err}` };
  }
}

export function buildTwiml(message: string, lang: "en" | "es" = "en") {
  const safe = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .slice(0, 800);
  const voice = "Polly.Joanna";
  const sayLang = lang === "es" ? "es-US" : "en-US";
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="${voice}" language="${sayLang}">This is the MACALOCATOR VIP concierge with a reminder for you.</Say>
  <Pause length="1"/>
  <Say voice="${voice}" language="${sayLang}">${safe}</Say>
  <Pause length="1"/>
  <Say voice="${voice}" language="${sayLang}">Thank you for choosing MACALOCATOR.</Say>
</Response>`;
}
