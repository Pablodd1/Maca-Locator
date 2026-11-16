import type { VercelRequest, VercelResponse } from "@vercel/node";
import { get, put, del } from "@vercel/blob";

// Server-side booking store — lets reminders run WITHOUT the app being open.
// The client mirrors its localStorage bookings here after every change; the
// morning cron reads from here. Backed by the project's private Vercel Blob
// store "maca-bookings" (auto-connected token = BLOB_READ_WRITE_TOKEN).
// Self-contained on purpose (Vercel builder + cross-directory imports).

const KEY = "maca/bookings.json";
const CLIENT_KEY = "maca/client.json";

// Private blobs must be read through the SDK stream (downloadUrl is not signed).
async function streamToJson(stream: ReadableStream<Uint8Array>): Promise<any> {
  const chunks: Uint8Array[] = [];
  const reader = stream.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    chunks.push(value);
  }
  return JSON.parse(new TextDecoder().decode(Buffer.concat(chunks)));
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({
      error: "Blob store not connected yet — attach the 'maca-bookings' store to this project in the Vercel dashboard (Storage tab), then redeploy. Until then bookings stay client-local.",
    });
  }

  try {
    if (req.method === "GET") {
      try {
        const blob = await get(KEY, { access: "private" });
        const bookings = await streamToJson(blob.stream);
        let client: any = null;
        try {
          const cb = await get(CLIENT_KEY, { access: "private" });
          client = await streamToJson(cb.stream);
        } catch { /* client profile optional */ }
        return res.status(200).json({ bookings, client });
      } catch (e: any) {
        if (String(e?.message || e).includes("not found") || e?.name === "BlobNotFoundError") {
          return res.status(200).json({ bookings: [], client: null });
        }
        throw e;
      }
    }
    if (req.method === "POST") {
      const { bookings, clientName, clientPhone } = req.body || {};
      if (!Array.isArray(bookings)) {
        return res.status(400).json({ error: "bookings array required" });
      }
      await put(KEY, JSON.stringify(bookings.slice(0, 500)), { access: "private", allowOverwrite: true });
      if (clientName || clientPhone) {
        await put(CLIENT_KEY, JSON.stringify({ clientName: clientName || "", clientPhone: clientPhone || "", updatedAt: new Date().toISOString() }), { access: "private", allowOverwrite: true });
      }
      return res.status(200).json({ ok: true, count: bookings.length, storedAt: new Date().toISOString() });
    }
    if (req.method === "DELETE") {
      await del(KEY);
      return res.status(200).json({ ok: true });
    }
    return res.status(405).json({ error: "Method not allowed" });
  } catch (err: any) {
    return res.status(502).json({ error: `Store error: ${err?.message || err}` });
  }
}
