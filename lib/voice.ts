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

export function speakHuman(text: string, lang?: ConciergeLang) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  // Strip markdown so the voice never reads asterisks or backticks aloud.
  const cleaned = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[`*#_>|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return;
  const language = lang ?? detectLang(cleaned);
  const utterance = new SpeechSynthesisUtterance(cleaned);
  utterance.lang = language === "es" ? "es-US" : "en-US";
  // Slightly slower, natural pitch — the default 1.0 rate reads as rushed/robotic.
  utterance.rate = 0.94;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;
  const voice = pickVoice(language);
  if (voice) utterance.voice = voice;
  window.speechSynthesis.speak(utterance);
}

// Some browsers populate the voice list asynchronously; warm it up once.
if (typeof window !== "undefined" && "speechSynthesis" in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}
