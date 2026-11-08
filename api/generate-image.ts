import type { VercelRequest, VercelResponse } from "@vercel/node";
import { GoogleGenAI } from "@google/genai";

// Gemini image generation for the Marketing Creative Studio — Vercel serverless function.
// Requires GEMINI_API_KEY env var.

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "GEMINI_API_KEY not configured" });
  }

  try {
    const { prompt, aspectRatio } = req.body;
    const ai = new GoogleGenAI({ apiKey });
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
      return res.json({ image: `data:${mimeType};base64,${b64}` });
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Image Gen Error:", error);
    return res.status(500).json({ error: "Failed to generate image" });
  }
}
