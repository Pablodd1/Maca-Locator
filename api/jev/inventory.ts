import type { VercelRequest, VercelResponse } from "@vercel/node";
import { TypeSafeClient, choice } from "@typesafe-ai/sdk";

// Jev System-1 inventory judgment — for each item below/at threshold,
// decide: restock now? urgency? how much to order? Falls back to the
// threshold heuristic when TYPESAFE_API_KEY is absent.

type Item = { id: string; name: string; qty: number; threshold: number; unit: string };
type Verdict = { id: string; name: string; restockNow: boolean; urgency: string; orderQty: number; note: string; mode: string };

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const { items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "items[] required" });
  }

  const verdicts: Verdict[] = [];
  const hasJev = Boolean(process.env.TYPESAFE_API_KEY);
  let client: TypeSafeClient | null = null;
  if (hasJev) {
    try {
      client = new TypeSafeClient({ apiKey: process.env.TYPESAFE_API_KEY! });
    } catch {
      client = null;
    }
  }

  for (const raw of items.slice(0, 10)) {
    const it: Item = {
      id: String(raw.id || raw.name),
      name: String(raw.name || "item"),
      qty: Number(raw.qty) || 0,
      threshold: Number(raw.threshold) || 0,
      unit: String(raw.unit || "ea"),
    };
    const heuristic = {
      restockNow: it.qty <= it.threshold,
      urgency: it.qty === 0 ? "high" : it.qty <= it.threshold / 2 ? "high" : "normal",
      orderQty: Math.max(10, it.threshold * 2 - it.qty),
    };

    if (client) {
      try {
        const r = await client.systemOne({
          state: {
            service: "MACALOCATOR inventory (luxury mobile auto service, Miami — vans carry stock; stockouts cost VIP jobs).",
            item: it.name,
            current_qty: it.qty,
            reorder_threshold: it.threshold,
            unit: it.unit,
          },
          questions: {
            restock_now: choice("Should this item be reordered today?", { yes: "order now", no: "stock is fine" }),
            urgency: choice("How urgent is the reorder?", { low: "next routine order", normal: "this week", high: "today — risks a job" }),
            qty: choice("How many units to order?", { min: "about 5", med: "about 10", max: "about 20" }),
          },
        });
        const a: any = (r as any).answers;
        verdicts.push({
          id: it.id,
          name: it.name,
          restockNow: a.restock_now?.choice === "yes",
          urgency: a.urgency?.choice || heuristic.urgency,
          orderQty: a.qty?.choice === "max" ? 20 : a.qty?.choice === "min" ? 5 : 10,
          note: a.restock_now?.choice === "yes" ? `order ${a.qty?.choice === "max" ? 20 : a.qty?.choice === "min" ? 5 : 10} ${it.unit} — ${a.urgency?.choice || "normal"}` : "stock is fine",
          mode: "jev-latest",
        });
        continue;
      } catch { /* fall through to heuristic */ }
    }
    verdicts.push({
      id: it.id,
      name: it.name,
      restockNow: heuristic.restockNow,
      urgency: heuristic.urgency,
      orderQty: heuristic.orderQty,
      note: heuristic.restockNow ? `order ~${heuristic.orderQty} ${it.unit} (threshold rule)` : "stock is fine",
      mode: "heuristic-fallback",
    });
  }

  return res.status(200).json({ mode: hasJev && verdicts.some((v) => v.mode === "jev-latest") ? "jev-latest" : "heuristic-fallback", verdicts });
}
