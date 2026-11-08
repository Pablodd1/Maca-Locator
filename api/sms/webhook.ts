import type { VercelRequest, VercelResponse } from "@vercel/node";

// Two-way SMS webhook for Twilio (configure as the messaging webhook:
// https://maca-locator.vercel.app/api/sms/webhook — method POST).
// Clients reply to reminders: "1"/"confirm"/"si" confirms, "2"/"reschedule"
// asks for a callback. Bilingual EN/ES keywords, staff pinged via Telegram.
// Self-contained on purpose (Vercel builder + cross-directory imports).

function channelStatus() {
  return {
    sms: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER),
    telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN),
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

async function telegramAlert(text: string) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text }),
    });
  } catch {
    // staff alert is best-effort; never fail the webhook on it
  }
}

function replyFor(body: string): string | null {
  const t = body.trim().toLowerCase();
  if (/^(1|y|yes|confirm|c|si|sí|confirmo|ok)\b/.test(t)) {
    return "MACALOCATOR: Confirmed — your appointment stands. Our technician will come straight to you. / Confirmado: nuestro técnico irá hasta usted. ¡Gracias!";
  }
  if (/^(2|r|reschedule|change|cambio|cambiar|reprogramar)\b/.test(t)) {
    return "MACALOCATOR: Of course — our concierge will call you shortly to reschedule. / Con gusto: nuestro conserje le llamará para reprogramar.";
  }
  if (/(stop|cancel|unsubscribe|parar|detener)/.test(t)) {
    return "MACALOCATOR: You will receive no further automated messages. / No recibirá más mensajes automáticos.";
  }
  return null; // unknown → treat as free-text client message
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Twilio posts application/x-www-form-urlencoded
  const body = (req.body && req.body.Body) || (req.query.Body as string) || "";
  const from = (req.body && req.body.From) || (req.query.From as string) || "unknown";

  if (!body.trim()) {
    res.setHeader("Content-Type", "text/plain");
    return res.status(200).send("MACALOCATOR two-way SMS webhook online.");
  }

  const canned = replyFor(body);
  const live = channelStatus().sms;

  // Always brief the staff channel about inbound client activity
  await telegramAlert(
    canned
      ? `📲 MACALOCATOR — ${from} replied "${body}" → auto-answer sent.`
      : `📲 MACALOCATOR — client message from ${from}: "${body}" — needs a human reply.`
  );

  let reply: string;
  if (canned) {
    reply = canned;
  } else {
    reply = "MACALOCATOR: Thank you — our concierge team has your message and will reply shortly. / Gracias: nuestro equipo le responderá pronto.";
  }

  if (live) {
    try {
      await twilioSend("Messages.json", {
        To: from,
        From: process.env.TWILIO_FROM_NUMBER!,
        Body: reply,
      });
    } catch {
      // still return 204 so Twilio does not retry-storm
    }
  }

  // Twilio expects TwiML or empty 2xx; empty 204 keeps the pipeline quiet.
  return res.status(204).end();
}
