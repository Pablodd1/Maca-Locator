import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { sendNotification, channelStatus, buildTwiml, type Channel } from "./lib/notify-server.ts";
import jevAssign from "./api/jev/assign.ts";
import jevInventory from "./api/jev/inventory.ts";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Check if Gemini API Key exists
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, role, context } = req.body;
      const basePersona =
        "You are the MACALOCATOR VIP Concierge — a warm, human-sounding assistant for a luxury mobile auto service serving Miami and Miami Beach (Brickell, Coral Gables, South Beach, Wynwood). Upscale clientele: penthouse owners, executives, hotel guests. ALWAYS reply in the SAME language the client wrote in — English, Spanish, or Haitian Creole (Kreyòl). Match their language exactly; if they mix, follow their dominant language. Tone: polished but genuinely warm and conversational, like a five-star hotel concierge — never robotic, never over-formal. Keep answers concise and helpful; offer to book the at-your-door service when relevant.";
      const adminPersona =
        "You are the MACALOCATOR Mission Control AI — the operations assistant inside the administrator panel of a luxury mobile auto service in Miami & Miami Beach. You serve the dispatcher/owner: analyze live operations data provided in LIVE CONTEXT and answer with crisp, executive briefings (status, exceptions, staffing, inventory risks, what to do next). Reply in the administrator's language (default English; Spanish if they write Spanish). Be direct and numbers-first; cite the context you were given; if data is missing, say what to log or check.";
      const system = role === "mission_control" ? adminPersona : basePersona;
      const contextBlock = context ? `\n\nLIVE CONTEXT (authoritative, use it):\n${context}` : "";

      // Jev System-1 pre-router (client role) — mirror of api/chat.ts
      let jevMeta: any = null;
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
              }).catch(() => {});
            }
          }
        } catch { /* Jev optional — Gemini proceeds */ }
      }
      if (emergencyOverride) {
        res.json({ text: emergencyOverride, jev: jevMeta });
        return;
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: messages,
        config: {
          systemInstruction: system + moodInstruction + contextBlock,
        },
      });
      res.json({ text: response.text, jev: jevMeta });
    } catch (error) {
      console.error("Gemini API Error:", error);
      res.status(500).json({ error: "Failed to generate content" });
    }
  });

  app.post("/api/generate-image", async (req, res) => {
    try {
      const { prompt, aspectRatio } = req.body;
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-image",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          responseModalities: ["IMAGE"],
          imageConfig: { aspectRatio: aspectRatio || "1:1" },
        },
      });
      const part = response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData);
      const b64 = part?.inlineData?.data;
      const mimeType = part?.inlineData?.mimeType || "image/png";
      if (b64) {
        res.json({ image: `data:${mimeType};base64,${b64}` });
      } else {
        throw new Error("No image generated");
      }
    } catch (error) {
      console.error("Image Gen Error:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });
  
  // Realtime Live API proxy endpoint would be complex, typically WebSockets,
  // but for now we'll just set up a basic text chat.

  // Notification dispatch: GET -> channel status, POST -> send one
  app.get("/api/notify", (_req, res) => {
    res.json({ channels: channelStatus() });
  });

  app.post("/api/notify", async (req, res) => {
    const { channel, to, message, lang, subject } = req.body || {};
    if (!channel || !message?.trim()) {
      res.status(400).json({ error: "channel and message are required" });
      return;
    }
    const result = await sendNotification({
      channel: channel as Channel,
      to: to || "",
      message,
      lang: lang === "es" ? "es" : "en",
      subject,
      origin: `http://localhost:${PORT}`,
    });
    res.status(result.ok ? 200 : 502).json(result);
  });

  // Jev System-1 dispatch scoring — dev mirror (prod = api/jev/assign.ts)
  app.post("/api/jev/assign", (req, res) => jevAssign(req as any, res as any));

  // Jev inventory judgment — dev mirror (prod = api/jev/inventory.ts)
  app.post("/api/jev/inventory", (req, res) => jevInventory(req as any, res as any));

  // Jev triage — dev mirror of api/sms/webhook.ts jevTriage()
  app.post("/api/jev/triage", async (req, res) => {
    const { text } = req.body || {};
    if (!text || !process.env.TYPESAFE_API_KEY) {
      res.json({ intent: null, mode: "fallback" });
      return;
    }
    try {
      const { TypeSafeClient, choice } = await import("@typesafe-ai/sdk");
      const client = new TypeSafeClient({ apiKey: process.env.TYPESAFE_API_KEY });
      const r = await client.systemOne({
        state: {
          service: "MACALOCATOR two-way SMS (luxury mobile auto service, Miami). Messages may be EN/ES/Kreyòl.",
          inbound_message: String(text).slice(0, 300),
        },
        questions: {
          intent: choice("What is the client's intent?", {
            emergency: "urgent roadside help now", complaint: "unhappy / service problem",
            reschedule: "change appointment", confirm: "confirming appointment", question: "general question",
          }),
          severity: choice("How urgent?", { low: "routine", normal: "today", high: "soon", urgent: "immediately" }),
          escalate: choice("Page staff to respond personally now?", { yes: "page staff", no: "auto-reply fine" }),
        },
      });
      const a = (r as any).answers;
      res.json({ intent: a.intent?.choice, severity: a.severity?.choice, escalate: a.escalate?.choice === "yes", mode: "jev-latest" });
    } catch (e: any) {
      res.json({ intent: null, error: e?.message, mode: "fallback" });
    }
  });

  // Two-way SMS webhook (Twilio) — dev mirror of api/sms/webhook.ts
  app.post("/api/sms/webhook", express.urlencoded({ extended: false }), async (req, res) => {
    const body = (req.body?.Body as string) || (req.query.Body as string) || "";
    const from = (req.body?.From as string) || (req.query.From as string) || "unknown";
    if (!body.trim()) {
      res.status(200).send("MACALOCATOR two-way SMS webhook online.");
      return;
    }
    const t = body.trim().toLowerCase();
    let reply: string;
    let intent: string;
    if (/^(1|y|yes|confirm|c|si|sí|confirmo|ok)\b/.test(t)) {
      reply = "MACALOCATOR: Confirmed — your appointment stands. / Confirmado: nuestro técnico irá hasta usted.";
      intent = "confirmed";
    } else if (/^(2|r|reschedule|change|cambio|cambiar|reprogramar)\b/.test(t)) {
      reply = "MACALOCATOR: Of course — our concierge will call you shortly to reschedule. / Con gusto: le llamaremos para reprogramar.";
      intent = "reschedule";
    } else {
      intent = "question";
      try {
        const r = await fetch(`http://localhost:${PORT}/api/jev/triage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: body }),
        }).then((x) => x.json());
        if (r && r.intent) intent = r.intent;
        if (intent === "emergency") {
          reply = "MACALOCATOR: Help is being arranged NOW — our response team is being paged this second. / Ayuda en camino AHORA.";
        } else if (intent === "complaint") {
          reply = "MACALOCATOR: Thank you for telling us — a senior concierge will reach out shortly. / Un conserje senior le contactará en breve.";
        } else {
          reply = "MACALOCATOR: Thank you — our concierge team has your message and will reply shortly. / Gracias: le responderemos pronto.";
        }
      } catch {
        reply = "MACALOCATOR: Thank you — our concierge team has your message and will reply shortly. / Gracias: le responderemos pronto.";
      }
    }
    console.log(`[sms-webhook] ${from}: "${body}" → ${intent}`);
    if (process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_CHAT_ID) {
      await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text: `📲 MACALOCATOR — ${from}: "${body}" → ${intent}` }),
      }).catch(() => {});
    }
    res.status(200).json({ reply, intent, mode: process.env.TWILIO_ACCOUNT_SID ? "live" : "demo" });
  });

  // TwiML voice script Twilio fetches when a reminder call connects
  app.get("/api/voice/twiml", (req, res) => {
    const msg = (req.query.msg as string) || "Your MACALOCATOR service is scheduled.";
    const lang = req.query.lang === "es" ? "es" : "en";
    res.setHeader("Content-Type", "text/xml; charset=utf-8");
    res.send(buildTwiml(msg, lang));
  });

  // Local mirrors of the server store + morning cron (dev parity).
  // Prod = api/bookings.ts + api/cron/morning-sweep.ts backed by REDIS_URL.
  const localBookings: any[] = [];
  let localClient: any = {};
  app.get("/api/bookings", (_req, res) => res.json({ bookings: localBookings }));
  app.post("/api/bookings", (req, res) => {
    const { bookings, clientName, clientPhone } = req.body || {};
    if (!Array.isArray(bookings)) { res.status(400).json({ error: "bookings array required" }); return; }
    localBookings.length = 0;
    localBookings.push(...bookings.slice(0, 500));
    if (clientName || clientPhone) localClient = { clientName, clientPhone };
    res.json({ ok: true, count: localBookings.length, storedAt: new Date().toISOString() });
  });
  let lastSweepReport: any = null;
  app.all("/api/cron/morning-sweep", async (_req, res) => {
    const now = Date.now();
    const soon = localBookings.filter((b) => {
      if (b.status === "completed") return false;
      const hours = (new Date(`${b.date}T00:00:00`).getTime() - now) / 36e5;
      return hours > -24 && hours < 24;
    });
    const clientPhone = (localClient.clientPhone || "").replace(/[^\d+]/g, "");
    const detail: any[] = [];
    let skipped = 0;
    for (const b of soon) {
      // Jev skip-logic — mirror of api/cron/morning-sweep.ts
      let should = true;
      if (process.env.TYPESAFE_API_KEY) {
        try {
          const { TypeSafeClient, choice } = await import("@typesafe-ai/sdk");
          const jc = new TypeSafeClient({ apiKey: process.env.TYPESAFE_API_KEY });
          const jr = await jc.systemOne({
          state: {
            service: "MACALOCATOR morning reminder sweep (luxury auto service, Miami). A same-day morning reminder is the standard, expected touch for upcoming services.",
            booking: `${b.type} on ${b.date} at ${b.time}`,
            booking_status: b.status,
          },
            questions: { remind: choice("Is this reminder useful, or clearly redundant? (Redundant = service already in progress or already completed earlier today.)", { yes: "send the reminder", no: "clearly redundant — skip" }) },
          });
          should = (jr as any).answers?.remind?.choice === "yes";
        } catch { should = true; }
      }
      if (!should) {
        skipped++;
        detail.push({ channel: "none", mode: "jev-latest", ok: true, to: localClient.clientName || "", detail: `skipped ${b.type} (Jev: unnecessary)` });
        continue;
      }
      const msg = `MACALOCATOR: Reminder — ${b.type} on ${b.date} at ${b.time}. Reply 1 to confirm or 2 to reschedule.`;
      const staff = `📋 MACALOCATOR Morning Sweep — ${b.type} · ${b.date} ${b.time} · Client: ${localClient.clientName || "VIP client"}.`;
      detail.push(...await Promise.all([
        sendNotification({ channel: "sms", to: clientPhone, message: msg }),
        sendNotification({ channel: "whatsapp", to: clientPhone, message: msg }),
        sendNotification({ channel: "voice", to: clientPhone, message: msg, origin: `http://localhost:${PORT}` }),
        sendNotification({ channel: "telegram", to: "", message: staff }),
      ]));
    }
    lastSweepReport = { ranAt: new Date().toISOString(), reminded: soon.length - skipped, skippedByJev: skipped };
    res.json({ ranAt: lastSweepReport.ranAt, bookingsScanned: localBookings.length, reminded: soon.length - skipped, skippedByJev: skipped, detail });
  });
  app.get("/api/last-sweep", (_req, res) => res.json(lastSweepReport || { ranAt: null }));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
