import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { sendNotification, channelStatus, buildTwiml, type Channel } from "./lib/notify-server";
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
      const { messages } = req.body;
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: messages,
        config: {
          systemInstruction:
            "You are the MACALOCATOR VIP Concierge — a warm, human-sounding assistant for a luxury mobile auto service serving Miami and Miami Beach (Brickell, Coral Gables, South Beach, Wynwood). Upscale clientele: penthouse owners, executives, hotel guests. ALWAYS reply in the SAME language the client wrote in — English, Spanish, or Haitian Creole (Kreyòl). Match their language exactly; if they mix, follow their dominant language. Tone: polished but genuinely warm and conversational, like a five-star hotel concierge — never robotic, never over-formal. Keep answers concise and helpful; offer to book the at-your-door service when relevant.",
        },
      });
      res.json({ text: response.text });
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
    const { channel, to, message, lang } = req.body || {};
    if (!channel || !message?.trim()) {
      res.status(400).json({ error: "channel and message are required" });
      return;
    }
    const result = await sendNotification({
      channel: channel as Channel,
      to: to || "",
      message,
      lang: lang === "es" ? "es" : "en",
      origin: `http://localhost:${PORT}`,
    });
    res.status(result.ok ? 200 : 502).json(result);
  });

  // TwiML voice script Twilio fetches when a reminder call connects
  app.get("/api/voice/twiml", (req, res) => {
    const msg = (req.query.msg as string) || "Your MACALOCATOR service is scheduled.";
    const lang = req.query.lang === "es" ? "es" : "en";
    res.setHeader("Content-Type", "text/xml; charset=utf-8");
    res.send(buildTwiml(msg, lang));
  });

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
