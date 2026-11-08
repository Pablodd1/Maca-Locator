import type { VercelRequest, VercelResponse } from "@vercel/node";
import { buildTwiml } from "../../lib/notify-server";

// TwiML endpoint Twilio fetches when an outbound reminder call connects.
// Renders the reminder as speech with <Say> — no audio assets needed.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const msg = (req.query.msg as string) || "Your MACALOCATOR service is scheduled.";
  const lang = req.query.lang === "es" ? "es" : "en";
  res.setHeader("Content-Type", "text/xml; charset=utf-8");
  res.status(200).send(buildTwiml(msg, lang));
}
