// Shared human-sounding text-to-speech for the MACALOCATOR concierge.
// Picks the most natural voice available on the device for a language,
// and uses warm, unhurried pacing so it sounds like a person, not a robot.

export type ConciergeLang = "en" | "es";

const PREMIUM_HINTS = ["Natural", "Neural", "Premium", "Enhanced", "Online", "Google"];

function scoreVoice(v: SpeechSynthesisVoice, lang: string): number {
  const name = v.name || "";
  let score = 0;
  const langBase = lang.slice(0, 2);
  if (v.lang?.toLowerCase().startsWith(langBase)) score += 10;
  if (v.lang?.replace("_", "-").toLowerCase() === lang.toLowerCase()) score += 5;
  // Prefer the newer neural/natural voices — they sound dramatically more human.
  const hint = PREMIUM_HINTS.findIndex((h) => name.includes(h));
  if (hint >= 0) score += 6 - hint;
  // Female voices tend to test warmer for concierge personas.
  if (/female|aria|jenny|samantha|zira|sabina|elvira|paloma/i.test(name)) score += 2;
  // Skip obviously robotic system voices unless nothing better exists.
  if (/compact|espeak|robosoft/i.test(name)) score -= 4;
  return score;
}

export function pickVoice(lang: ConciergeLang): SpeechSynthesisVoice | undefined {
  if (!("speechSynthesis" in window)) return undefined;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return undefined;
  const target = lang === "es" ? "es-US" : "en-US";
  return [...voices].sort((a, b) => scoreVoice(b, target) - scoreVoice(a, target))[0];
}

// Very light language detection so replies come back in the voice that
// matches the language the concierge answered in.
export function detectLang(text: string): ConciergeLang {
  const t = text.toLowerCase();
  const spanishMarks = (t.match(/[áéíóúñ¿¡]/g) || []).length;
  const spanishWords = (t.match(
    /\b(hola|buenos|buenas|gracias|cita|servicio|veh[íi]culo|carro|agenda|reserva|emergencia|d[íi]a|usted|estamos|c[óo]mo|cu[áa]nto|para|nuestro|t[ée]cnico|listo)\b/g
  ) || []).length;
  return spanishMarks + spanishWords >= 2 ? "es" : "en";
}

export function speakHuman(text: string, lang?: ConciergeLang, maxSentences = 4) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const cleaned = condenseForVoice(text, maxSentences);
  if (!cleaned) return;
  const language = lang ?? detectLang(cleaned);
  const voice = pickVoice(language);
  // Speak sentence by sentence with a touch of prosody variation — a single
  // flat utterance is the #1 "robot" tell; small rate/pitch shifts per
  // sentence sound like a person actually talking.
  const sentences = cleaned.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g) || [cleaned];
  sentences.forEach((s, i) => {
    const u = new SpeechSynthesisUtterance(s.trim());
    u.lang = language === "es" ? "es-US" : "en-US";
    u.rate = 0.92 + (i % 2 === 1 ? 0.02 : 0); // subtle alternation, never monotone
    u.pitch = 1.0 + (i % 2 === 1 ? 0.045 : 0);
    u.volume = 1.0;
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
  });
}

// ─── "Less AI, more human" layer ────────────────────────────────────────────
// Turns written replies into something a person would actually say out loud:
// contractions, no markdown/bullets/URLs/emoji, and only the first couple of
// sentences (the text bubble still shows the full reply).

const CONTRACTIONS: Array<[RegExp, string]> = [
  [/\byou are\b/gi, "you're"],
  [/\bYou are\b/g, "You're"],
  [/\bwe will\b/gi, "we'll"],
  [/\bWe will\b/g, "We'll"],
  [/\bwe are\b/gi, "we're"],
  [/\bWe are\b/g, "We're"],
  [/\bI am\b/g, "I'm"],
  [/\bit is\b/gi, "it's"],
  [/\bIt is\b/g, "It's"],
  [/\bthat is\b/gi, "that's"],
  [/\bdo not\b/gi, "don't"],
  [/\bdoes not\b/gi, "doesn't"],
  [/\bcannot\b/gi, "can't"],
  [/\bcan not\b/gi, "can't"],
  [/\bwill not\b/gi, "won't"],
  [/\byou will\b/gi, "you'll"],
  [/\bwe have\b/gi, "we've"],
  [/\bthere is\b/gi, "there's"],
  [/\bhere is\b/gi, "here's"],
  [/\b technician has\b/gi, " technician's"],
];

export function condenseForVoice(text: string, maxSentences = 2): string {
  let t = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\[(.*?)\]\(.*?\)/g, "$1") // links → keep the label only
    .replace(/https?:\/\/\S+/g, " ") // never read URLs aloud
    .replace(/[*_#`>|~]/g, " ")
    .replace(/[•·▪]/g, ", ")
    .replace(/[–—]/g, ", ")
    .replace(/^\s*\d+[.)]\s*/gm, "") // numbered lists → plain sentences
    .replace(/^\s*[-–]\s*/gm, "")
    .replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]/gu, " ") // emoji out
    .replace(/\s+/g, " ")
    .trim();
  for (const [a, b] of CONTRACTIONS) t = t.replace(a, b);
  const sentences = t.match(/[^.!?…]+[.!?…]+|[^.!?…]+$/g) || [t];
  return sentences.slice(0, maxSentences).join(" ").trim();
}

// Conversational readback: what a person would SAY, not what they wrote.
export function speakConversational(text: string, lang?: ConciergeLang, maxSentences = 2) {
  const source = text.includes("Byenvini")
    ? text.split("\n").find((l) => /[a-z]/i.test(l)) || text // greeting → EN line
    : text;
  speakHuman(source, lang ?? detectLang(source), maxSentences);
}

// Some browsers populate the voice list asynchronously; warm it up once.
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}
