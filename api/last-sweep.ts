import type { VercelRequest, VercelResponse } from "@vercel/node";
import { get } from "@vercel/blob";

// Last morning-sweep report (written by /api/cron/morning-sweep to blob).
// GET → { ranAt, reminded, skippedByJev, live, failed } or { ranAt: null }.

const LAST_RUN = "maca/last-sweep.json";

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

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(200).json({ ranAt: null, note: "store not connected" });
  }
  try {
    const blob = await get(LAST_RUN, { access: "private" });
    return res.status(200).json(await streamToJson(blob.stream));
  } catch {
    return res.status(200).json({ ranAt: null, note: "no sweep recorded yet" });
  }
}
