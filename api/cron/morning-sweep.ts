import type { VercelRequest, VercelResponse } from "@vercel/node";
import { get, put } from "@vercel/blob";

// MACALOCATOR Morning Reminder Sweep — Vercel Cron endpoint.
// Runs daily (vercel.json crons, 13:00 UTC = 8:00 AM Miami). Reads bookings
// from the server store, finds everything in the next 24 hours, and sends
// client reminders (SMS + WhatsApp + voice) and staff Telegram briefs via
// the notification hub. Works in demo mode (composes, marks demo) when
// provider keys are absent. Self-contained by design (Vercel builder).

const KEY = "maca/bookings.json";
const CLIENT_KEY = "maca/client.json";
const LAST_RUN = "maca/last-sweep.json";

type Booking = { id: string; type: string; date: string; time: string; status: string; vehicleId?: string };
type NotifyResult = { channel: string; mode: "live" | "demo"; ok: boolean; to: string; detail: string };

function channelStatus() {
  return {
    sms: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER),
    whatsapp: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_WHATSAPP_FROM),
    voice: Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER),
    telegram: Boolean(process.env.TELEGRAM_BOT_TOKEN),
    email: Boolean(process.env.RESEND_API_KEY && process.env.NOTIFICATION_EMAIL_FROM),
  };
}

async function twilioSend(endpoint: string, params: Record<string, string>) {
  const sid = process.env.TWILIO_ACCOUNT_SID!;
  const auth = Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/${endpoint}`, {
    method: "POST",
    headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.message || `Twilio HTTP ${res.status}`);
  return data;
}

async function sendNotification(opts: { channel: string; to: string; message: string; lang?: "en" | "es"; origin?: string }): Promise<NotifyResult> {
  const { channel, to, message, lang = "en", origin } = opts;
  const status = channelStatus();
  try {
    if (channel === "telegram") {
      if (!status.telegram) return { channel, mode: "demo", ok: true, to, detail: "TELEGRAM_BOT_TOKEN not set — composed." };
      const chatId = to || process.env.TELEGRAM_CHAT_ID || "";
      if (!chatId) return { channel, mode: "demo", ok: false, to, detail: "No chat id." };
      const r = await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text: message }),
      });
      const d: any = await r.json().catch(() => ({}));
      if (!r.ok || !d?.ok) throw new Error(d?.description || `Telegram HTTP ${r.status}`);
      return { channel, mode: "live", ok: true, to: chatId, detail: "delivered" };
    }
    if (channel === "sms" || channel === "whatsapp") {
      const wa = channel === "whatsapp";
      if (!status[channel]) return { channel, mode: "demo", ok: true, to, detail: `Twilio not set — composed.` };
      const d = await twilioSend("Messages.json", {
        To: wa ? `whatsapp:${to}` : to,
        From: wa ? `whatsapp:${process.env.TWILIO_WHATSAPP_FROM}` : process.env.TWILIO_FROM_NUMBER!,
        Body: message,
      });
      return { channel, mode: "live", ok: true, to, detail: `SID ${d.sid}` };
    }
    if (channel === "voice") {
      if (!status.voice) return { channel, mode: "demo", ok: true, to, detail: "Twilio not set — script composed." };
      const base = process.env.PUBLIC_BASE_URL || origin || "https://maca-locator.vercel.app";
      const d = await twilioSend("Calls.json", {
        To: to,
        From: process.env.TWILIO_FROM_NUMBER!,
        Url: `${base}/api/voice/twiml?msg=${encodeURIComponent(message)}&lang=${lang}`,
      });
      return { channel, mode: "live", ok: true, to, detail: `call SID ${d.sid}` };
    }
    return { channel, mode: "demo", ok: false, to, detail: `unknown channel ${channel}` };
  } catch (err: any) {
    return { channel, mode: status[channel] ? "live" : "demo", ok: false, to, detail: `error: ${err?.message || err}` };
  }
}

function reminderEn(b: Booking, vehicle: string) {
  return `MACALOCATOR: Reminder — ${b.type} on ${b.date} at ${b.time}. Our technician comes straight to you. Reply 1 to confirm or 2 to reschedule. Vehicle: ${vehicle}.`;
}
function staffBrief(b: Booking, client: string) {
  return `📋 MACALOCATOR Morning Sweep — ${b.type} · ${b.date} ${b.time} · Client: ${client}. Confirm unit and roll out with full kit.`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Auth: Vercel Cron sends x-vercel-cron; manual runs need CRON_SECRET match.
  // If CRON_SECRET is unset the endpoint is open (demo posture).
  const secret = process.env.CRON_SECRET;
  const isCron = Boolean(req.headers["x-vercel-cron"]);
  const bearerOk = secret ? req.headers.authorization === `Bearer ${secret}` : true;
  if (!isCron && !bearerOk) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(503).json({ error: "Blob store not connected yet — attach 'maca-bookings' to this project in the Vercel dashboard, then redeploy." });
  }

  try {
    let bookings: Booking[] = [];
    let client: any = { clientName: "", clientPhone: "" };
    try {
      const blob = await get(KEY, { access: "private" });
      bookings = await fetch(blob.blob.downloadUrl).then((r) => r.json());
      const cb = await get(CLIENT_KEY, { access: "private" });
      client = await fetch(cb.blob.downloadUrl).then((r) => r.json());
    } catch (e: any) {
      if (!String(e?.message || e).includes("not found") && e?.name !== "BlobNotFoundError") throw e;
    }
    const now = Date.now();
    const soon = bookings.filter((b) => {
      if (b.status === "completed") return false;
      const when = new Date(`${b.date}T00:00:00`).getTime();
      const hours = (when - now) / 36e5;
      return hours > -24 && hours < 24;
    });

    const clientPhone = (client.clientPhone || process.env.NOTIFICATION_CLIENT_PHONE || "").replace(/[^\d+]/g, "");
    const clientName = client.clientName || "VIP client";
    const results: NotifyResult[] = [];
    for (const b of soon) {
      const msg = reminderEn(b, "client vehicle");
      const staff = staffBrief(b, clientName);
      const batch = await Promise.all([
        sendNotification({ channel: "sms", to: clientPhone, message: msg }),
        sendNotification({ channel: "whatsapp", to: clientPhone, message: msg }),
        sendNotification({ channel: "voice", to: clientPhone, message: msg }),
        sendNotification({ channel: "telegram", to: "", message: staff }),
      ]);
      results.push(...batch);
    }

    const report = {
      ranAt: new Date().toISOString(),
      bookingsScanned: bookings.length,
      reminded: soon.length,
      channels: channelStatus(),
      live: results.filter((x) => x.mode === "live").length,
      demo: results.filter((x) => x.mode === "demo").length,
      failed: results.filter((x) => !x.ok).length,
      detail: results,
    };
    await put(LAST_RUN, JSON.stringify({ ranAt: report.ranAt, reminded: soon.length, live: report.live, failed: report.failed }), { access: "private", allowOverwrite: true });
    return res.status(200).json(report);
  } catch (err: any) {
    return res.status(502).json({ error: `Sweep error: ${err?.message || err}` });
  }
}
