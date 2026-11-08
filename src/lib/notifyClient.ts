// Client wrapper for the MACALOCATOR notification hub (/api/notify).
// Bilingual EN/ES templates so reminders match each client's language.

export type ChannelMode = { sms: boolean; voice: boolean; telegram: boolean };
export type NotifyResponse = {
  channel: "sms" | "voice" | "telegram";
  mode: "live" | "demo";
  ok: boolean;
  to: string;
  detail: string;
};

export async function getChannelModes(): Promise<ChannelMode> {
  try {
    const res = await fetch("/api/notify");
    const data = await res.json();
    return data.channels || { sms: false, voice: false, telegram: false };
  } catch {
    return { sms: false, voice: false, telegram: false };
  }
}

export async function notify(opts: {
  channel: "sms" | "voice" | "telegram";
  to?: string;
  message: string;
  lang?: "en" | "es";
}): Promise<NotifyResponse> {
  const res = await fetch("/api/notify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(opts),
  });
  const data = await res.json();
  return { channel: opts.channel, mode: data.mode || "demo", ok: res.ok && data.ok !== false, to: data.to || opts.to || "", detail: data.detail || data.error || "" };
}

export function reminderMessage(booking: { type: string; date: string; time: string }, lang: "en" | "es" = "en") {
  if (lang === "es") {
    return `MACALOCATOR: Recordatorio de su cita — ${booking.type} el ${booking.date} a las ${booking.time}. Nuestro técnico llegará directamente a usted. Responda para reprogramar.`;
  }
  return `MACALOCATOR: Reminder — ${booking.type} on ${booking.date} at ${booking.time}. Our technician comes straight to you. Reply to reschedule.`;
}

export function staffDispatchMessage(booking: { type: string; date: string; time: string }, clientName: string, lang: "en" | "es" = "en") {
  if (lang === "es") {
    return `📋 MACALOCATOR Staff — ${booking.type} · ${booking.date} ${booking.time} · Cliente: ${clientName}. Confirmar unidad y salir con kit completo.`;
  }
  return `📋 MACALOCATOR Staff — ${booking.type} · ${booking.date} ${booking.time} · Client: ${clientName}. Confirm unit and roll out with full kit.`;
}

export function emergencyMessage(location: string, lang: "en" | "es" = "en") {
  if (lang === "es") {
    return `🚨 MACALOCATOR EMERGENCIA — Cliente requiere asistencia inmediata en ${location}. Responder AHORA.`;
  }
  return `🚨 MACALOCATOR EMERGENCY — Client needs immediate assistance at ${location}. Respond NOW.`;
}
