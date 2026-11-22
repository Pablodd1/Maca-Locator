import type { VercelRequest, VercelResponse } from "@vercel/node";
import { TypeSafeClient, choice } from "@typesafe-ai/sdk";

// Jev System-1 dispatch scoring — ranks idle units for a task.
// POST { task: {type, address}, staff: [{id, name, specialty, status}] }
// → { unitId, unitName, confidence, rationale }
// Falls back to a deterministic specialty/availability heuristic when
// TYPESAFE_API_KEY is absent (demo mode, clearly labeled).

type Staff = { id: string; name: string; specialty: string; status: string };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { task, staff } = req.body || {};
  if (!task?.type || !Array.isArray(staff) || staff.length === 0) {
    return res.status(400).json({ error: "task.type and staff[] required" });
  }
  const candidates: Staff[] = staff.filter((s: Staff) => s.status === "idle" || s.status === "offline");

  if (process.env.TYPESAFE_API_KEY && candidates.length) {
    try {
      const client = new TypeSafeClient({ apiKey: process.env.TYPESAFE_API_KEY });
      const res1 = await client.systemOne({
        state: {
          service: "MACALOCATOR dispatch (luxury mobile auto service, Miami)",
          task_type: task.type,
          task_address: task.address || "",
          candidate_units: candidates.map((s) => `${s.id}: ${s.name} — ${s.specialty} [${s.status}]`).join("; "),
        },
        questions: {
          best_unit: choice(
            "Which unit id should take this task? Answer with the unit id only.",
            Object.fromEntries(candidates.map((s) => [s.id, `${s.name} — ${s.specialty}`]))
          ),
          confidence: choice("How confident is this assignment?", { high: "clear best fit", medium: "reasonable fit", low: "no good fit" }),
          escalate: choice("Should a human dispatcher review this assignment before dispatch?", { no: "auto-assign is safe", yes: "human should confirm" }),
        },
      });
      const a = res1.answers as any;
      const unitId = a.best_unit?.choice;
      const unit = candidates.find((s) => s.id === unitId) || candidates[0];
      return res.status(200).json({
        mode: "jev-latest",
        unitId: unit.id,
        unitName: unit.name,
        confidence: a.confidence?.choice || "medium",
        humanReview: a.escalate?.choice === "yes",
        rationale: `${unit.name} — ${unit.specialty}`,
      });
    } catch (e: any) {
      // fall through to heuristic on rate limit / network
      void e;
    }
  }

  // Heuristic fallback: keyword overlap between task type and specialty
  const words = (t: string) => t.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3);
  const tw = words(task.type);
  let best = candidates[0];
  let bestScore = -1;
  for (const s of candidates) {
    const sw = words(s.specialty);
    const overlap = tw.filter((w) => sw.some((x) => x.startsWith(w.slice(0, 4)))).length;
    const score = overlap * 2 + (s.status === "idle" ? 1 : 0);
    if (score > bestScore) { bestScore = score; best = s; }
  }
  return res.status(200).json({
    mode: "heuristic-fallback",
    unitId: best.id,
    unitName: best.name,
    confidence: "medium",
    humanReview: false,
    rationale: `${best.name} — ${best.specialty}`,
  });
}
