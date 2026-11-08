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
    const { messages } = req.body;
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: messages,
      config: {
        systemInstruction:
          "You are the MACALOCATOR VIP Concierge — a warm, human-sounding assistant for a luxury mobile auto service serving Miami and Miami Beach (Brickell, Coral Gables, South Beach, Wynwood). Upscale clientele: penthouse owners, executives, hotel guests. ALWAYS reply in the SAME language the client wrote in — English, Spanish, or Haitian Creole (Kreyòl). Match their language exactly; if they mix, follow their dominant language. Tone: polished but genuinely warm and conversational, like a five-star hotel concierge — never robotic, never over-formal. Keep answers concise and helpful; offer to book the at-your-door service when relevant.",
      },
    });
    return res.json({ text: response.text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: "Failed to generate content" });
  }
}
