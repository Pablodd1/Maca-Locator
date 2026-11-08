const path = require("path");
const GROOT = require("child_process").execSync("npm root -g").toString().trim();
const pptxgen = require(path.join(GROOT, "pptxgenjs"));

// ---- Palette: Miami luxury — deep navy, champagne gold, white ----
const NAVY = "0F1B2D";      // dark background (cover/closing)
const NAVY_SOFT = "16324F"; // primary structural
const GOLD = "C9A45C";      // accent (sparingly)
const BG = "FFFFFF";        // content background
const TEXT = "1A2333";
const MUTED = "6B7686";
const TINT = "F4F1EA";      // warm-neutral tint for cards (gold family tint)

// Typography: Georgia (display serif, luxury) + Segoe UI (body)
const DISP = "Georgia";
const BODY = "Segoe UI";

const W = 13.33, H = 7.5, M = 0.6;
const pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
pres.author = "MACALOCATOR";
pres.title = "MACALOCATOR — Luxury Auto Care That Comes To You";

// helper: bilingual block (EN bold + ES italic muted below)
function bi(slide, en, es, o) {
  slide.addText(en, { ...o, fontFace: o.disp ? DISP : BODY, bold: true, color: o.color || TEXT });
  slide.addText(es, { ...o, y: o.y + (o.dh ?? 0.42), fontFace: BODY, italic: true, color: o.esColor || MUTED, bold: false, fontSize: (o.fontSize || 18) - 3 });
}

// ---------- Slide 1 · Cover (dark) ----------
let s = pres.addSlide();
s.background = { color: NAVY };
// motif: thin gold ring, off-center — elegant, not a stripe
s.addShape(pres.shapes.OVAL, { x: 9.4, y: -1.6, w: 6.2, h: 6.2, fill: { color: NAVY }, line: { color: GOLD, width: 1 } });
s.addShape(pres.shapes.OVAL, { x: 10.1, y: -0.9, w: 4.8, h: 4.8, fill: { color: NAVY }, line: { color: GOLD, width: 0.5 } });
s.addText("M A C A L O C A T O R", { x: M, y: 1.5, w: 9, h: 0.5, fontFace: BODY, fontSize: 15, color: GOLD, charSpacing: 6, bold: true });
s.addText("Luxury auto care\nthat comes to you.", { x: M, y: 2.2, w: 10.5, h: 2.4, fontFace: DISP, fontSize: 54, color: "FFFFFF", bold: true, lineSpacing: 62 });
s.addText("Servicio automotriz de lujo, en su puerta.", { x: M, y: 4.75, w: 10, h: 0.6, fontFace: BODY, italic: true, fontSize: 22, color: GOLD });
s.addText([
  { text: "Miami & Miami Beach", options: { breakLine: true } },
  { text: "English · Español · Kreyòl", options: {} },
], { x: M, y: 5.9, w: 8, h: 0.9, fontFace: BODY, fontSize: 15, color: "B9C2D0", lineSpacing: 24 });

// ---------- Slide 2 · The difference (light) ----------
s = pres.addSlide();
s.background = { color: BG };
s.addText("The old way vs. MACALOCATOR", { x: M, y: 0.55, w: 12, h: 0.6, fontFace: DISP, fontSize: 34, bold: true, color: TEXT });
s.addText("El taller tradicional vs. MACALOCATOR", { x: M, y: 1.2, w: 12, h: 0.45, fontFace: BODY, italic: true, fontSize: 17, color: MUTED });

// left column — traditional (muted card)
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 2.0, w: 5.75, h: 4.6, fill: { color: "F1F3F6" }, rectRadius: 0.09 });
s.addText("The traditional shop", { x: M + 0.4, y: 2.35, w: 5, h: 0.5, fontFace: BODY, bold: true, fontSize: 20, color: MUTED });
s.addText("Taller tradicional", { x: M + 0.4, y: 2.82, w: 5, h: 0.4, fontFace: BODY, italic: true, fontSize: 14, color: MUTED });
const bu1 = () => ({ code: "2013", indent: 12 });
s.addText([
  { text: "Drop the car off", options: { bullet: bu1(), breakLine: true } },
  { text: "Dejar el carro en el taller", options: { bullet: false, italic: true, color: MUTED, fontSize: 13, breakLine: true } },
  { text: "Arrange rides or wait for hours", options: { bullet: bu1(), breakLine: true } },
  { text: "Buscar transporte o esperar horas", options: { bullet: false, italic: true, color: MUTED, fontSize: 13, breakLine: true } },
  { text: "Rework your whole day", options: { bullet: bu1(), breakLine: true } },
  { text: "Reorganizar todo su día", options: { bullet: false, italic: true, color: MUTED, fontSize: 13 } },
], { x: M + 0.4, y: 3.45, w: 4.9, h: 2.9, fontFace: BODY, fontSize: 16, color: TEXT, paraSpaceAfter: 6, margin: 0 });

// right column — MACALOCATOR (gold-tinted card, the focal point)
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 7.0, y: 2.0, w: 5.75, h: 4.6, fill: { color: TINT }, rectRadius: 0.09, shadow: { type: "outer", color: "000000", blur: 7, offset: 2, angle: 45, opacity: 0.14 } });
s.addText("With MACALOCATOR", { x: 7.4, y: 2.35, w: 5, h: 0.5, fontFace: BODY, bold: true, fontSize: 20, color: NAVY_SOFT });
s.addText("Con MACALOCATOR", { x: 7.4, y: 2.82, w: 5, h: 0.4, fontFace: BODY, italic: true, fontSize: 14, color: MUTED });
const bu2 = () => ({ code: "25B8", indent: 12, color: GOLD });
s.addText([
  { text: "We come to your home, office or hotel", options: { bullet: bu2(), breakLine: true } },
  { text: "Venimos a su casa, oficina u hotel", options: { bullet: false, italic: true, color: MUTED, fontSize: 13, breakLine: true } },
  { text: "Certified technicians, premium tools", options: { bullet: bu2(), breakLine: true } },
  { text: "Técnicos certificados, herramientas premium", options: { bullet: false, italic: true, color: MUTED, fontSize: 13, breakLine: true } },
  { text: "Your day stays yours", options: { bullet: bu2(), breakLine: true } },
  { text: "Su día sigue siendo suyo", options: { bullet: false, italic: true, color: MUTED, fontSize: 13 } },
], { x: 7.4, y: 3.45, w: 5.0, h: 2.9, fontFace: BODY, fontSize: 16, color: TEXT, paraSpaceAfter: 6, margin: 0 });

// ---------- Slide 3 · How it works (light) ----------
s = pres.addSlide();
s.background = { color: BG };
s.addText("How it works", { x: M, y: 0.55, w: 8, h: 0.6, fontFace: DISP, fontSize: 34, bold: true, color: TEXT });
s.addText("Cómo funciona", { x: M, y: 1.2, w: 8, h: 0.45, fontFace: BODY, italic: true, fontSize: 17, color: MUTED });

const steps = [
  { n: "1", en: "Book", es: "Reserve", dEn: "In the app, by voice, or by WhatsApp — in your language.", dEs: "En la app, por voz o por WhatsApp — en su idioma." },
  { n: "2", en: "We come to you", es: "Venimos a usted", dEn: "A certified technician arrives at your location, fully equipped.", dEs: "Un técnico certificado llega a su ubicación, con equipo completo." },
  { n: "3", en: "Carry on with your day", es: "Siga con su día", dEn: "Service at your door. Live status until the job is done.", dEs: "Servicio en su puerta. Estado en vivo hasta terminar." },
];
steps.forEach((st, i) => {
  const x = M + i * 4.15;
  s.addText(st.n, { x, y: 2.1, w: 1.6, h: 1.5, fontFace: DISP, fontSize: 88, bold: true, color: GOLD });
  s.addText(st.en, { x, y: 3.75, w: 3.7, h: 0.55, fontFace: BODY, bold: true, fontSize: 22, color: TEXT });
  s.addText(st.es, { x, y: 4.3, w: 3.7, h: 0.4, fontFace: BODY, italic: true, fontSize: 15, color: GOLD });
  s.addText(st.dEn, { x, y: 4.85, w: 3.6, h: 1.0, fontFace: BODY, fontSize: 14, color: TEXT, lineSpacing: 19 });
  s.addText(st.dEs, { x, y: 5.85, w: 3.6, h: 0.9, fontFace: BODY, italic: true, fontSize: 12, color: MUTED, lineSpacing: 16 });
});

// ---------- Slide 4 · Services (light) ----------
s = pres.addSlide();
s.background = { color: BG };
s.addText("Services at your door", { x: M, y: 0.55, w: 9, h: 0.6, fontFace: DISP, fontSize: 34, bold: true, color: TEXT });
s.addText("Servicios en su puerta", { x: M, y: 1.2, w: 9, h: 0.45, fontFace: BODY, italic: true, fontSize: 17, color: MUTED });

const svc = [
  { en: "Full mobile diagnostics", es: "Diagnóstico completo móvil", p: "from $79" },
  { en: "Battery service & EV checks", es: "Batería y revisión eléctrica", p: "from $49" },
  { en: "Tires — rotation, patch, spare", es: "Llantas — rotación, parche, repuesto", p: "from $39" },
  { en: "Detailing suite", es: "Detalle y limpieza premium", p: "from $129" },
  { en: "Emergency roadside — 24/7", es: "Emergencias en carretera — 24/7", p: "from $89" },
];
svc.forEach((v, i) => {
  const y = 2.0 + i * 0.92;
  if (i > 0) s.addShape(pres.shapes.LINE, { x: M, y: y - 0.06, w: W - 2 * M, h: 0, line: { color: "E4E1D8", width: 0.75 } });
  s.addText(v.en, { x: M, y, w: 7.6, h: 0.45, fontFace: BODY, bold: true, fontSize: 19, color: TEXT, margin: 0 });
  s.addText(v.es, { x: M, y: y + 0.42, w: 7.6, h: 0.35, fontFace: BODY, italic: true, fontSize: 13, color: MUTED, margin: 0 });
  s.addText(v.p, { x: 10.2, y, w: 2.5, h: 0.75, fontFace: BODY, bold: true, fontSize: 20, color: GOLD, align: "right", valign: "middle", margin: 0 });
});
s.addText("Illustrative starting prices — final quote before every job. / Precios de referencia — cotización final antes de cada servicio.", { x: M, y: 6.75, w: 12, h: 0.35, fontFace: BODY, italic: true, fontSize: 11, color: MUTED });

// ---------- Slide 5 · Smart reminders (light) ----------
s = pres.addSlide();
s.background = { color: BG };
s.addText("Your clients never miss a service", { x: M, y: 0.55, w: 12, h: 0.6, fontFace: DISP, fontSize: 34, bold: true, color: TEXT });
s.addText("Sus clientes nunca olvidan un servicio", { x: M, y: 1.2, w: 12, h: 0.45, fontFace: BODY, italic: true, fontSize: 17, color: MUTED });

// channel diagram: booking -> 4 channels -> client phone
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: M, y: 2.5, w: 2.9, h: 1.15, fill: { color: NAVY_SOFT }, rectRadius: 0.09 });
s.addText([
  { text: "Appointment", options: { breakLine: true, bold: true, color: "FFFFFF" } },
  { text: "Cita agendada", options: { italic: true, color: "B9C2D0", fontSize: 11 } },
], { x: M, y: 2.5, w: 2.9, h: 1.15, fontFace: BODY, fontSize: 15, align: "center", valign: "middle" });

const chans = ["SMS", "WhatsApp", "Voice call / Llamada", "Email"];
chans.forEach((c, i) => {
  const y = 1.95 + i * 1.02;
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 4.7, y, w: 3.4, h: 0.85, fill: { color: TINT }, rectRadius: 0.09 });
  s.addText(c, { x: 4.7, y, w: 3.4, h: 0.85, fontFace: BODY, bold: true, fontSize: 15, color: NAVY_SOFT, align: "center", valign: "middle" });
});
// client reply
s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: 9.0, y: 2.5, w: 3.7, h: 2.1, fill: { color: NAVY }, rectRadius: 0.1, shadow: { type: "outer", color: "000000", blur: 7, offset: 2, angle: 45, opacity: 0.18 } });
s.addText([
  { text: "Client replies:", options: { bold: true, color: GOLD, breakLine: true } },
  { text: "“1” — confirmed / confirmado", options: { color: "FFFFFF", breakLine: true } },
  { text: "“2” — reschedule / reprogramar", options: { color: "FFFFFF" } },
], { x: 9.25, y: 2.62, w: 3.3, h: 1.9, fontFace: BODY, fontSize: 15, lineSpacing: 26 });
// explanatory text lives in the free left column, below the appointment box
s.addText("Reminders go out 24 hours before every appointment — automatically, in the client's language. Staff get an instant Telegram dispatch brief.", { x: M, y: 4.05, w: 3.7, h: 1.5, fontFace: BODY, fontSize: 14, color: TEXT, lineSpacing: 19 });
s.addText("Recordatorios automáticos 24 horas antes, en el idioma del cliente. El equipo recibe un aviso inmediato por Telegram.", { x: M, y: 5.6, w: 3.7, h: 1.2, fontFace: BODY, italic: true, fontSize: 11, color: MUTED, lineSpacing: 15 });

// ---------- Slide 6 · Benefits (light) ----------
s = pres.addSlide();
s.background = { color: BG };
s.addText("What your clients get", { x: M, y: 0.55, w: 9, h: 0.6, fontFace: DISP, fontSize: 34, bold: true, color: TEXT });
s.addText("Lo que sus clientes reciben", { x: M, y: 1.2, w: 9, h: 0.45, fontFace: BODY, italic: true, fontSize: 17, color: MUTED });

const bens = [
  { big: "0", uEn: "minutes waiting", uEs: "minutos de espera", dEn: "No lounge, no lines — the workshop comes to them.", dEs: "Sin salas de espera: el taller va hasta ellos." },
  { big: "3", uEn: "languages, always", uEs: "idiomas, siempre", dEn: "English, Español and Kreyòl — app, chat and calls.", dEs: "Inglés, español y criollo — app, chat y llamadas." },
  { big: "24/7", uEn: "roadside response", uEs: "asistencia en carretera", dEn: "One tap for emergency dispatch, day or night.", dEs: "Un toque para ayuda inmediata, día o noche." },
];
bens.forEach((b, i) => {
  const x = M + i * 4.15;
  s.addText(b.big, { x, y: 2.15, w: 3.6, h: 1.6, fontFace: DISP, fontSize: b.big.length > 2 ? 64 : 88, bold: true, color: GOLD });
  s.addText(b.uEn, { x, y: 3.85, w: 3.6, h: 0.45, fontFace: BODY, bold: true, fontSize: 18, color: TEXT });
  s.addText(b.uEs, { x, y: 4.3, w: 3.6, h: 0.4, fontFace: BODY, italic: true, fontSize: 13, color: MUTED });
  s.addText(b.dEn, { x, y: 4.85, w: 3.5, h: 0.9, fontFace: BODY, fontSize: 13, color: TEXT, lineSpacing: 18 });
  s.addText(b.dEs, { x, y: 5.75, w: 3.5, h: 0.9, fontFace: BODY, italic: true, fontSize: 11, color: MUTED, lineSpacing: 15 });
});

// ---------- Slide 7 · For the business (light) ----------
s = pres.addSlide();
s.background = { color: BG };
s.addText("Your front desk, automated", { x: M, y: 0.55, w: 10, h: 0.6, fontFace: DISP, fontSize: 34, bold: true, color: TEXT });
s.addText("Su recepción, automatizada", { x: M, y: 1.2, w: 10, h: 0.45, fontFace: BODY, italic: true, fontSize: 17, color: MUTED });

const rows = [
  { en: "Bookings dashboard", es: "Panel de reservas", d: "Every appointment, status and technician on one screen." },
  { en: "Automatic confirmations", es: "Confirmaciones automáticas", d: "Email + WhatsApp the moment a client books." },
  { en: "Staff dispatch briefs", es: "Avisos al equipo", d: "Telegram alerts keep crews moving without phone tag." },
  { en: "Trilingual AI concierge", es: "Conserje AI trilingüe", d: "Answers client questions 24/7 in EN, ES and Kreyòl." },
];
rows.forEach((r, i) => {
  const y = 2.15 + i * 1.12;
  s.addShape(pres.shapes.OVAL, { x: M, y: y + 0.12, w: 0.16, h: 0.16, fill: { color: GOLD } });
  s.addText(r.en, { x: M + 0.45, y, w: 6.2, h: 0.42, fontFace: BODY, bold: true, fontSize: 18, color: TEXT, margin: 0 });
  s.addText(r.es, { x: M + 0.45, y: y + 0.4, w: 6.2, h: 0.32, fontFace: BODY, italic: true, fontSize: 12, color: MUTED, margin: 0 });
  s.addText(r.d, { x: 7.3, y, w: 5.4, h: 0.8, fontFace: BODY, fontSize: 14, color: TEXT, valign: "top", lineSpacing: 18 });
});

// ---------- Slide 8 · Closing (dark) ----------
s = pres.addSlide();
s.background = { color: NAVY };
s.addShape(pres.shapes.OVAL, { x: 10.0, y: -2.0, w: 5.6, h: 5.6, fill: { color: NAVY }, line: { color: GOLD, width: 1 } });
s.addText("We come to you.", { x: M, y: 2.3, w: 9, h: 1.2, fontFace: DISP, fontSize: 60, bold: true, color: "FFFFFF" });
s.addText("Venimos hasta usted.", { x: M, y: 3.6, w: 12, h: 0.8, fontFace: BODY, italic: true, fontSize: 28, color: GOLD });
s.addText([
  { text: "MACALOCATOR — Miami & Miami Beach", options: { breakLine: true } },
  { text: "maca-locator.vercel.app", options: {} },
], { x: M, y: 5.3, w: 10, h: 0.9, fontFace: BODY, fontSize: 16, color: "B9C2D0", lineSpacing: 26 });

pres.writeFile({ fileName: "MACALOCATOR-Client-Presentation.pptx" }).then(() => console.log("deck written"));
