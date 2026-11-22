import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

// Gemini chat concierge — deployed as a Vercel serverless function.
// Requires GEMINI_API_KEY env var. Falls back gracefully client-side when unset.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "GEMINI_API_KEY not configured" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const { messages, role, context } = req.body;

    // ── Jev System-1 pre-router (client role only) ──────────────────────
    // 10ms typed verdicts before the LLM: emergencies bypass Gemini with a
    // scripted SOS response + staff page; an upset VIP adds an empathy
    // instruction to the persona. Silent fallback on any failure.
    let jevMeta: { intent?: string; sentiment?: string } | null = null;
    let emergencyOverride: string | null = null;
    let moodInstruction = "";
    if (role === "client" && process.env.TYPESAFE_API_KEY) {
      try {
        const lastUser = [...(messages || [])].reverse().find((m: any) => m.role === "user")?.parts?.[0]?.text || "";
        if (lastUser) {
          const { TypeSafeClient, choice } = await import("@typesafe-ai/sdk");
          const jc = new TypeSafeClient({ apiKey: process.env.TYPESAFE_API_KEY });
          const jr = await jc.systemOne({
            state: {
              service: "MACALOCATOR VIP concierge chat (luxury mobile auto service, Miami). Messages may be EN/ES/Kreyòl.",
              inbound_message: String(lastUser).slice(0, 300),
            },
            questions: {
              intent: choice("What does the client need right now?", {
                emergency: "urgent roadside danger or breakdown now",
                booking: "book or schedule a service",
                status: "asking about their service/technician",
                general: "anything else",
              }),
              sentiment: choice("How does the client feel?", {
                calm: "fine",
                dissatisfied: "annoyed or unhappy",
                upset: "angry or very frustrated",
              }),
              escalate: choice("Should staff be pinged to contact the client personally right away?", { yes: "ping staff", no: "not needed" }),
            },
          });
          const ja: any = (jr as any).answers;
          jevMeta = { intent: ja.intent?.choice, sentiment: ja.sentiment?.choice };
          const pingStaff = ja.escalate?.choice === "yes" || jevMeta.sentiment === "upset";
          if (jevMeta.intent === "emergency") {
            emergencyOverride =
              "🚨 MACALOCATOR Emergency Protocol — help is being arranged NOW.\n\nStay safe: if there is smoke, fire, or you are in a traffic lane, move away from the vehicle first. Our response team has been paged this second and a unit is being dispatched to your location.\n\nOpen the Emergency tab for one-tap dispatch with your GPS.\n\n🚨 Protocolo de Emergencia — la ayuda va en camino AHORA. Si hay humo o fuego, aléjese del vehículo. Abra la pestaña Emergencia para enviar su ubicación con un toque.";
          } else if (pingStaff) {
            moodInstruction = "\n\nLIVE CLIENT MOOD (from triage): this client is unhappy. Lead with a sincere acknowledgment, take ownership, offer a concrete fix and a personal callback from a senior concierge.";
          } else if (jevMeta.sentiment === "dissatisfied") {
            moodInstruction = "\n\nLIVE CLIENT MOOD (from triage): slightly annoyed — be extra warm and efficient.";
          }
          if ((jevMeta.intent === "emergency" || pingStaff) && process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
            fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: process.env.TELEGRAM_CHAT_ID,
                text: jevMeta.intent === "emergency"
                  ? `🚨 MACALOCATOR CONCIERGE — EMERGENCY in chat: "${String(lastUser).slice(0, 120)}" — unit dispatch requested`
                  : `⚠️ MACALOCATOR CONCIERGE — unhappy VIP in chat (${jevMeta.sentiment}): "${String(lastUser).slice(0, 120)}" — personal outreach recommended`,
              }),
            }).catch(() => { /* best-effort */ });
          }
        }
      } catch { /* Jev optional — Gemini proceeds */ }
    }
    if (emergencyOverride) {
      return res.json({ text: emergencyOverride, jev: jevMeta });
    }
    const basePersona =
      "You are the MACALOCATOR VIP Concierge — a warm, human-sounding assistant for a luxury mobile auto service serving Miami and Miami Beach (Brickell, Coral Gables, South Beach, Wynwood). Upscale clientele: penthouse owners, executives, hotel guests. ALWAYS reply in the SAME language the client wrote in — English, Spanish, or Haitian Creole (Kreyòl). Match their language exactly; if they mix, follow their dominant language. Tone: polished but genuinely warm and conversational, like a five-star hotel concierge — never robotic, never over-formal. Keep answers concise and helpful; offer to book the at-your-door service when relevant.";
    const adminPersona =
      "You are the MACALOCATOR Mission Control AI — the operations assistant inside the administrator panel of a luxury mobile auto service in Miami & Miami Beach. You serve the dispatcher/owner: analyze live operations data provided in LIVE CONTEXT and answer with crisp, executive briefings (status, exceptions, staffing, inventory risks, what to do next). Reply in the administrator's language (default English; Spanish if they write Spanish). Be direct and numbers-first; cite the context you were given; if data is missing, say what to log or check.";
    const system = role === "mission_control" ? adminPersona : basePersona;
    const contextBlock = context ? `\n\nLIVE CONTEXT (authoritative, use it):\n${context}` : "";
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: messages,
      config: {
        systemInstruction: system + moodInstruction + contextBlock,
      },
    });
    return res.json({ text: response.text, jev: jevMeta });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: "Failed to generate content" });
  }
}
