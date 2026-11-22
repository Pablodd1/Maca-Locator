import type { VercelRequest, VercelResponse } from "@vercel/node";
import { TypeSafeClient, choice } from "@typesafe-ai/sdk";

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

function describeCanned(reply: string): string {
  if (reply.startsWith("MACALOCATOR: Confirmed")) return "confirm";
  if (reply.includes("reschedule")) return "reschedule";
  if (reply.includes("no further automated")) return "stop";
  return "confirm";
}

// Jev System-1 triage for free-text inbound messages.
async function jevTriage(text: string): Promise<{ intent: string; severity: string; escalate: boolean } | null> {
  if (!process.env.TYPESAFE_API_KEY) return null;
  try {
    const client = new TypeSafeClient({ apiKey: process.env.TYPESAFE_API_KEY });
    const r = await client.systemOne({
      state: {
        service: "MACALOCATOR two-way SMS (luxury mobile auto service, Miami). Client messages may be English, Spanish, or Haitian Creole.",
        inbound_message: text,
      },
      questions: {
        intent: choice("What is the client's intent?", {
          emergency: "needs urgent roadside help now",
          complaint: "unhappy / service problem",
          reschedule: "wants to change an appointment",
          confirm: "confirming an appointment",
          question: "general question",
        }),
        severity: choice("How urgent is this message?", { low: "routine", normal: "today", high: "soon", urgent: "immediately" }),
        escalate: choice("Should staff be paged to respond personally right away?", { yes: "page staff now", no: "auto-reply is fine" }),
      },
    });
    const a = r.answers as any;
    return {
      intent: a.intent?.choice || "question",
      severity: a.severity?.choice || "normal",
      escalate: a.escalate?.choice === "yes",
    };
  } catch {
    return null;
  }
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

  // Free-text → Jev System-1 triage: emergency / complaint / reschedule /
  // question + severity + escalate. Emergencies page the staff channel
  // immediately; complaints ping for a human reply. Fallback: gentle
  // concierge acknowledge.
  let intent = canned ? describeCanned(canned) : "question";
  let severity = canned ? "normal" : "unknown";
  let escalate = false;

  let reply: string;
  if (canned) {
    reply = canned;
  } else {
    const triage = await jevTriage(body);
    if (triage) {
      intent = triage.intent;
      severity = triage.severity;
      escalate = triage.escalate;
    }
    if (intent === "emergency") {
      reply = "MACALOCATOR: Help is being arranged NOW — stay safe and with your vehicle if possible. Our response team is being paged this second. / Ayuda en camino AHORA — manténgase seguro.";
    } else if (intent === "complaint") {
      reply = "MACALOCATOR: Thank you for telling us — a senior concierge is reviewing your case personally and will reach out shortly. / Gracias — un conserje senior le contactará en breve.";
    } else if (intent === "reschedule") {
      reply = "MACALOCATOR: Of course — our concierge will call you shortly to reschedule. / Con gusto: le llamaremos para reprogramar.";
    } else {
      reply = "MACALOCATOR: Thank you — our concierge team has your message and will reply shortly. / Gracias: nuestro equipo le responderá pronto.";
    }
  }

  // Always brief the staff channel; emergencies page them
  await telegramAlert(
    escalate || intent === "emergency"
      ? `🚨 MACALOCATOR URGENT (${severity}) — ${from}: "${body}" → ${intent}. REPLY PERSONALLY NOW.`
      : `📲 MACALOCATOR — ${from} replied "${body}" → ${intent} (${severity}), auto-answer sent.`
  );

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
