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
    });
    return res.json({ text: response.text });
  } catch (error) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: "Failed to generate content" });
  }
}
