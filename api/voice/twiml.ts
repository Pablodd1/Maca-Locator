import type { VercelRequest, VercelResponse } from "@vercel/node";

// TwiML endpoint Twilio fetches when an outbound reminder call connects.
// Self-contained on purpose (Vercel builder + cross-directory imports).

function buildTwiml(message: string, lang: "en" | "es" = "en") {
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const msg = (req.query.msg as string) || "Your MACALOCATOR service is scheduled.";
  const lang = req.query.lang === "es" ? "es" : "en";
  res.setHeader("Content-Type", "text/xml; charset=utf-8");
  res.status(200).send(buildTwiml(msg, lang));
}
