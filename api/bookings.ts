import type { VercelRequest, VercelResponse } from "@vercel/node";
import Redis from "ioredis";

// Server-side booking store — the piece that lets reminders run WITHOUT the
// app being open. The client mirrors its localStorage bookings here after
// every change; the morning cron reads from here. Keys namespaced maca:*.
// NOTE: reuses the account's existing Upstash Redis (shared with other
// projects, namespaced). Move to a dedicated store when this goes to prod.
// Self-contained on purpose (Vercel builder + cross-directory imports).

const KEY = "maca:bookings";
const CLIENT_KEY = "maca:client";

let redis: Redis | null = null;
function getRedis(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;
  if (!redis) {
    redis = new Redis(url, {
      maxRetriesPerRequest: 1,
      connectTimeout: 5000,
      lazyConnect: false,
    });
  }
  return redis;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const r = getRedis();
  if (!r) {
    return res.status(503).json({ error: "REDIS_URL not configured — bookings are client-local only." });
  }

  try {
    if (req.method === "GET") {
      const raw = await r.get(KEY);
      return res.status(200).json({ bookings: raw ? JSON.parse(raw) : [] });
    }
    if (req.method === "POST") {
      const { bookings, clientName, clientPhone } = req.body || {};
      if (!Array.isArray(bookings)) {
        return res.status(400).json({ error: "bookings array required" });
      }
      await r.set(KEY, JSON.stringify(bookings.slice(0, 500)));
      if (clientName || clientPhone) {
        await r.set(CLIENT_KEY, JSON.stringify({ clientName: clientName || "", clientPhone: clientPhone || "", updatedAt: new Date().toISOString() }));
      }
      return res.status(200).json({ ok: true, count: bookings.length, storedAt: new Date().toISOString() });
    }
    if (req.method === "DELETE") {
      await r.del(KEY);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    return res.status(502).json({ error: `Store error: ${err?.message || err}` });
  }
}
