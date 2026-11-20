import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAppState } from "../context/AppContext";
import { useOps, taskStatusLabel, STATUS_ORDER, type TaskStatus } from "../context/OpsContext";
import { notify } from "../lib/notifyClient";
import { speakHuman } from "@/lib/voice";
import {
  Radar, MapPin, Package, CalendarDays, Radio, LogIn, LogOut,
  PhoneCall, ClipboardList, Plus, ShoppingCart, Bot, Send, Mic, MicOff, Volume2, VolumeX,
} from "lucide-react";

// ─── MACALOCATOR Mission Control — administrator command center ────────────
// One screen to run the day: live unit map, task manager with check-in/out,
// staff radio, inventory & shopping, calendar load, and the full activity
// ledger. Bilingual EN-first (admin-facing); trilingual tone kept in comms.

type Section = "board" | "tasks" | "staff" | "inventory" | "ledger" | "ai";

export function MissionControl() {
  const { user, vehicles, bookings } = useAppState();
  const { staff, tasks, inventory, ledger, assignTask, checkIn, checkOut, createTask, radioBroadcast, restock, logEvent, etaFor } = useOps();
  const [section, setSection] = useState<Section>("board");
  const [radioMsg, setRadioMsg] = useState("All units: confirm status and next availability.");
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiReply, setAiReply] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [newTaskType, setNewTaskType] = useState("Full Mobile Diagnostics");
  const [newTaskAddr, setNewTaskAddr] = useState("");
  // Mission AI voice: mic dictation + spoken readback
  const [aiListening, setAiListening] = useState(false);
  const [aiVoiceOn, setAiVoiceOn] = useState(true);
  const recRef = useRef<any>(null);

  useEffect(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.lang = "en-US"; // admin-facing English-first; Spanish still understood
    rec.interimResults = false;
    rec.onstart = () => setAiListening(true);
    rec.onend = () => setAiListening(false);
    rec.onerror = () => setAiListening(false);
    rec.onresult = (e: any) => setAiPrompt((prev) => (prev ? prev + " " : "") + e.results[0][0].transcript);
    recRef.current = rec;
  }, []);

  const toggleAiMic = () => {
    if (!recRef.current) return;
    if (aiListening) recRef.current.stop();
    else { try { recRef.current.start(); } catch { /* already running */ } }
  };

  const busy = staff.filter((s) => s.status !== "idle" && s.status !== "offline").length;
  const lowStock = inventory.filter((i) => i.qty <= i.threshold);
  const active = tasks.filter((t) => t.status !== "completed");
  const today = new Date();

  // next-7-days calendar load (from bookings)
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today.getTime() + i * 864e5);
    const iso = d.toISOString().slice(0, 10);
    return {
      label: d.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
      count: bookings.filter((b) => b.date === iso && b.status !== "completed").length,
      iso,
    };
  });

  const opsContext = [
    `OPERATIONS SNAPSHOT — ${new Date().toLocaleString()}`,
    `Active tasks: ${active.length}; completed today: ${tasks.filter((t) => t.status === "completed").length}.`,
    ...active.map((t) => {
      const unit = staff.find((s) => s.id === t.staffId);
      const eta = etaFor(t);
      return `- Task ${t.id.slice(2, 7)} [${t.status}] ${t.type} · client ${t.clientName} · ${t.vehicle} · ${t.address} · ${t.scheduledAt}${unit ? ` · unit: ${unit.name} (${unit.specialty})` : " · UNASSIGNED"}${eta != null ? ` · ETA ${eta} min` : ""}`;
    }),
    `STAFF: ${staff.map((s) => `${s.name} [${s.status}]${s.taskId ? ` on ${s.taskId.slice(2, 7)}` : ""}`).join("; ")}.`,
    `INVENTORY: ${inventory.map((i) => `${i.name}: ${i.qty}${i.qty <= i.threshold ? " (LOW)" : ""}`).join("; ")}.`,
    `CLIENT CRM: ${user?.name}, ${user?.email}, ${user?.phone}; ${vehicles.length} registered vehicles (${vehicles.map((v) => `${v.year} ${v.make} ${v.model}`).join(", ")}).`,
  ].join("\n");

  const askMissionAI = async () => {
    if (!aiPrompt.trim() || aiLoading) return;
    setAiLoading(true);
    const q = aiPrompt;
    setAiPrompt("");
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: "mission_control",
          context: opsContext,
          messages: [{ role: "user", parts: [{ text: q }] }],
        }),
      });
      const data = await res.json();
      const reply = data.text || "Mission AI unavailable — check server logs.";
      setAiReply(reply);
      if (aiVoiceOn) speakHuman(reply);
    } catch {
      setAiReply("Mission AI unreachable (offline demo mode).");
    } finally {
      setAiLoading(false);
    }
  };

  const statusColor: Record<TaskStatus, string> = {
    unassigned: "bg-[#22302A] text-[#C5CBBF] border-[#4A5548]",
    assigned: "bg-[#33402F] text-[#D9A441] border-[#4A5548]",
    en_route: "bg-[#2E3A31] text-[#C5A06C] border-[#4A5548]",
    arrived: "bg-[#2E3A31] text-[#C5A06C] border-[#4A5548]",
    in_service: "bg-[#33402F] text-[#C5A06C] border-[#4A5548]",
    completed: "bg-emerald-50 text-[#6FAE8F] border-emerald-200",
  };

  return (
    <div className="space-y-5">
      {/* Command bar */}
      <div className="bg-[#181C20] text-white rounded-2xl p-5 shadow-xl border border-[#4A5548]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-[#6FAE8F] uppercase">
              <Radar className="w-3.5 h-3.5" /> Mission Control · Live Operations
            </div>
            <h2 className="font-display text-xl font-extrabold mt-1">Everything that is happening, right now.</h2>
            <p className="text-xs text-[#A6B0A3] mt-0.5 max-w-xl">Unidades, tareas, check-in/out, inventario y radio — todo lo que pasa en el día, en una pantalla.</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Stat label="Active tasks" value={active.length} tone="text-[#D9A441]" />
            <Stat label="Units busy" value={`${busy}/${staff.length}`} tone="text-[#C5A06C]" />
            <Stat label="Low stock" value={lowStock.length} tone={lowStock.length ? "text-[#C96A5B]" : "text-[#8FC7AA]"} />
            <Stat label="Events logged" value={ledger.length} tone="text-[#C5CBBF]" />
          </div>
        </div>
        <div className="flex gap-1 mt-4 overflow-x-auto whitespace-nowrap">
          {([["board", "Live Board"], ["tasks", "Task Manager"], ["staff", "Staff & Radio"], ["inventory", "Inventory"], ["ledger", "Activity Ledger"], ["ai", "Mission AI"]] as [Section, string][]).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={`px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all ${section === id ? "bg-[#B08D57] text-white" : "text-[#A6B0A3] hover:text-white hover:bg-[#2E343A]/60"}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── LIVE BOARD: map + queue ── */}
      {section === "board" && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
          <Card className="lg:col-span-3 border-[#4A5548] shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#C5A06C]" /> Live unit map — Miami & Miami Beach</CardTitle></CardHeader>
            <CardContent>
              <div className="relative h-[340px] bg-[#181C20] rounded-xl overflow-hidden border border-[#4A5548]">
                <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
                <span className="absolute top-2 left-3 text-[9px] font-mono text-[#B8C0B4] tracking-widest">MIAMI BEACH, FL — LIVE GRID</span>
                {/* task targets */}
                {tasks.filter((t) => t.status !== "completed").map((t) => (
                  <div key={t.id} className="absolute" style={{ left: `${t.target.x}%`, top: `${t.target.y}%`, transform: "translate(-50%,-50%)" }}>
                    <MapPin className="w-5 h-5 text-[#D9A441] drop-shadow" />
                    <span className="absolute left-5 top-0 text-[9px] font-mono text-amber-200/90 whitespace-nowrap">{t.type}</span>
                  </div>
                ))}
                {/* units */}
                {staff.map((s) => (
                  <div key={s.id} className="absolute transition-all duration-1000" style={{ left: `${s.pos.x}%`, top: `${s.pos.y}%`, transform: "translate(-50%,-50%)" }}>
                    <div className={`w-4 h-4 rounded-full border-2 ${s.status === "en_route" ? "bg-[#2E3A31]0 border-[#3A4046] animate-pulse" : s.status === "on_site" ? "bg-[#33402F]0 border-[#3A4046]" : s.status === "idle" ? "bg-emerald-500 border-emerald-300" : "bg-[#2E343A] border-[#3A4046]"}`} />
                    <span className="absolute left-4 -top-1 text-[9px] font-mono text-white/90 whitespace-nowrap">{s.name.split(" ")[0]} · {s.status.replace("_", " ")}{s.etaMin ? ` · ETA ${s.etaMin}m` : ""}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="lg:col-span-2 space-y-3">
            <Card className="border-[#4A5548] shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-[#C5A06C]" /> 7-day load</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-7 gap-1.5">
                {days.map((d) => (
                  <div key={d.iso} className={`rounded-lg p-2 text-center border ${d.count ? "bg-[#2E3A31] border-[#4A5548]" : "bg-[#22302A] border-[#4A5548]"}`}>
                    <p className="text-[9px] font-bold text-[#B8C0B4] uppercase">{d.label.split(" ")[0]}</p>
                    <p className="text-[10px] text-[#A6B0A3]">{d.label.split(" ")[1]}</p>
                    <p className={`text-lg font-black ${d.count ? "text-[#C5A06C]" : "text-[#C5CBBF]"}`}>{d.count}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card className="border-[#4A5548] shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-bold">Quick dispatch</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2">
                  <select value={newTaskType} onChange={(e) => setNewTaskType(e.target.value)} className="flex-1 h-9 px-2 rounded-lg border border-[#4A5548] text-xs font-bold">
                    {["Full Mobile Diagnostics", "Tire Rotation", "Battery Diagnostic", "Car Wash & Detailing"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                  <input value={newTaskAddr} onChange={(e) => setNewTaskAddr(e.target.value)} placeholder="Address / Dirección" className="flex-1 h-9 px-2 rounded-lg border border-[#4A5548] text-xs" />
                </div>
                <Button
                  className="w-full h-9 bg-[#B08D57] hover:bg-[#C5A06C] text-xs font-bold"
                  onClick={() => createTask({ type: newTaskType, clientName: user?.name || "VIP Client", vehicle: vehicles[0] ? `${vehicles[0].year} ${vehicles[0].make} ${vehicles[0].model}` : "client vehicle", address: newTaskAddr || "Miami Beach, FL", scheduledAt: `Today · ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` })}
                >
                  <Plus className="w-3.5 h-3.5" /> Create task
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ── TASK MANAGER ── */}
      {section === "tasks" && (
        <div className="space-y-3">
          {tasks.length === 0 && <Card><CardContent className="p-8 text-center text-sm text-[#B8C0B4]">No tasks yet — create one from the Live Board or book a service.</CardContent></Card>}
          {tasks.map((t) => {
            const unit = staff.find((s) => s.id === t.staffId);
            const eta = etaFor(t);
            return (
              <Card key={t.id} className="border-[#4A5548] shadow-sm">
                <CardContent className="p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded border ${statusColor[t.status]}`}>{taskStatusLabel(t.status)}</span>
                        <h3 className="font-extrabold text-[#EFE9DC]">{t.type}</h3>
                        {eta != null && <span className="text-xs font-bold text-[#C5A06C]">ETA {eta} min</span>}
                      </div>
                      <p className="text-xs text-[#B8C0B4] mt-1 truncate">{t.clientName} · {t.vehicle} · {t.address} · {t.scheduledAt}</p>
                      <div className="flex gap-3 mt-1.5 text-[10px] text-[#A6B0A3] flex-wrap">
                        <span>✓ {t.includes.join(" · ")}</span>
                      </div>
                      <div className="text-[10px] text-[#A6B0A3] mt-0.5">✗ {t.excludes.join(" · ")}</div>
                    </div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <select
                        className="h-9 px-2 rounded-lg border border-[#4A5548] text-xs font-bold"
                        value={t.staffId || ""}
                        disabled={t.status === "completed"}
                        onChange={(e) => e.target.value && assignTask(t.id, e.target.value)}
                      >
                        <option value="">Assign unit…</option>
                        {staff.map((s) => <option key={s.id} value={s.id} disabled={s.status === "en_route" || s.status === "on_site"}>{s.name} — {s.specialty}{s.status !== "idle" ? ` (${s.status})` : ""}</option>)}
                      </select>
                      {t.status === "arrived" && (
                        <Button size="sm" className="h-9 bg-[#B08D57] hover:bg-[#C5A06C] text-xs font-bold gap-1.5" onClick={() => checkIn(t.id)}>
                          <LogIn className="w-3.5 h-3.5" /> Check IN
                        </Button>
                      )}
                      {t.status === "in_service" && (
                        <Button size="sm" className="h-9 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold gap-1.5" onClick={() => checkOut(t.id)}>
                          <LogOut className="w-3.5 h-3.5" /> Check OUT
                        </Button>
                      )}
                      {t.completedAt && <span className="text-[10px] font-mono text-[#6FAE8F]">done {new Date(t.completedAt).toLocaleTimeString()}</span>}
                      {unit && t.status === "en_route" && <span className="text-[10px] text-[#B8C0B4] font-mono">{unit.name} driving…</span>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── STAFF & RADIO ── */}
      {section === "staff" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-3">
            {staff.map((s) => (
              <Card key={s.id} className="border-[#4A5548] shadow-sm">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-extrabold text-[#EFE9DC] text-sm">{s.name}</p>
                    <p className="text-xs text-[#B8C0B4]">{s.role} · {s.specialty}</p>
                    <p className="text-[11px] text-[#A6B0A3] font-mono">{s.phone}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] font-extrabold px-2 py-1 rounded border ${s.status === "en_route" ? "bg-[#2E3A31] text-[#C5A06C] border-[#4A5548]" : s.status === "on_site" ? "bg-[#33402F] text-[#C5A06C] border-[#4A5548]" : s.status === "idle" ? "bg-emerald-50 text-[#6FAE8F] border-emerald-200" : "bg-[#22302A] text-[#B8C0B4] border-[#4A5548]"}`}>
                      {s.status.replace("_", " ").toUpperCase()}
                    </span>
                    {s.taskId && <p className="text-[10px] text-[#A6B0A3] mt-1 font-mono">task {s.taskId.slice(2, 7)}</p>}
                    {s.checkInAt && <p className="text-[10px] text-[#6FAE8F] mt-0.5 font-mono">in {new Date(s.checkInAt).toLocaleTimeString()}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold gap-1" onClick={() => notify({ channel: "sms", to: s.phone.replace(/[^\d+]/g, ""), message: `MACALOCATOR: status check — please confirm your current status. / Confirme su estado actual.` })}>
                      <PhoneCall className="w-3 h-3" /> Ping
                    </Button>
                    <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold gap-1" onClick={() => logEvent("radio", `Direct call logged to ${s.name}`, "Dispatcher")}>
                      <PhoneCall className="w-3 h-3" /> Call
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Card className="border-[#5A4A44] shadow-sm h-fit">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-[#C96A5B]"><Radio className="w-4 h-4" /> Dispatch radio</CardTitle>
              <CardDescription className="text-xs">Broadcast to every unit (Telegram blast + ledger).</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <textarea value={radioMsg} onChange={(e) => setRadioMsg(e.target.value)} rows={3} className="w-full p-2.5 rounded-lg border border-[#4A5548] text-xs" />
              <Button className="w-full bg-[#C96A5B] hover:bg-[#D57F70] text-white text-xs font-bold h-9 gap-1.5" onClick={() => radioBroadcast(radioMsg)}>
                <Radio className="w-3.5 h-3.5" /> Broadcast now
              </Button>
              <p className="text-[10px] text-[#A6B0A3]">“All units: storm cell over the Beach — confirm shelter status.”</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── INVENTORY ── */}
      {section === "inventory" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Card className="lg:col-span-2 border-[#4A5548] shadow-sm">
            <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-1.5"><Package className="w-4 h-4 text-[#C5A06C]" /> Materials on the vans & warehouse</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {inventory.map((i) => (
                <div key={i.id} className="flex items-center justify-between gap-3 border-b border-[#3E4B42] pb-2">
                  <div>
                    <p className="text-sm font-bold text-[#EFE9DC]">{i.name}</p>
                    <div className="w-40 h-1.5 bg-[#22302A] rounded-full mt-1 overflow-hidden">
                      <div className={`h-full ${i.qty <= i.threshold ? "bg-[#3A2F2C]0" : "bg-emerald-500"}`} style={{ width: `${Math.min(100, (i.qty / Math.max(i.threshold * 2, 1)) * 100)}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-black ${i.qty <= i.threshold ? "text-[#C96A5B]" : "text-[#DCD8CC]"}`}>{i.qty} <span className="text-[10px] text-[#A6B0A3] font-bold">{i.unit}</span></span>
                    <Button size="sm" variant="outline" className="h-8 text-[10px] font-bold" onClick={() => restock(i.id, 5)}>+5</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card className={`shadow-sm h-fit ${lowStock.length ? "border-[#5A4A44] bg-[#3A2F2C]/40" : "border-emerald-200"}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold flex items-center gap-1.5 text-[#C96A5B]"><ShoppingCart className="w-4 h-4" /> Shopping list</CardTitle>
              <CardDescription className="text-xs">Auto-built from items at/below threshold. / Lista de compras automática.</CardDescription>
            </CardHeader>
            <CardContent>
              {lowStock.length === 0 ? (
                <p className="text-xs text-[#6FAE8F] font-bold">✓ All stocked — nothing to buy.</p>
              ) : (
                <ul className="text-xs space-y-1.5 text-[#DCD8CC]">
                  {lowStock.map((i) => <li key={i.id} className="flex justify-between"><span>{i.name}</span><span className="font-bold text-[#C96A5B]">{i.qty}/{i.threshold}</span></li>)}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── LEDGER ── */}
      {section === "ledger" && (
        <Card className="border-[#4A5548] shadow-sm">
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5"><ClipboardList className="w-4 h-4 text-[#C5A06C]" /> Activity ledger — everything, registered</CardTitle>
            <Button
              size="sm"
              variant="outline"
              className="text-[10px] font-bold h-8"
              onClick={() => {
                const crm = {
                  exportedAt: new Date().toISOString(),
                  client: { ...user, vehicles },
                  bookings,
                  tasks,
                  staff,
                  inventory,
                  ledger,
                };
                const blob = new Blob([JSON.stringify(crm, null, 2)], { type: "application/json" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `macalocator-crm-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(a.href);
                logEvent("crm", "CRM record exported (client + vehicles + bookings + tasks + ledger)");
              }}
            >
              Export CRM record (JSON)
            </Button>
          </CardHeader>
          <CardContent className="max-h-[420px] overflow-y-auto font-mono text-[11px] space-y-1.5">
            {ledger.length === 0 && <p className="text-[#A6B0A3]">No events yet.</p>}
            {ledger.map((l) => (
              <div key={l.id} className="flex gap-2 items-baseline">
                <span className="text-[#A6B0A3] shrink-0">{new Date(l.ts).toLocaleTimeString()}</span>
                <span className={`shrink-0 font-bold ${l.kind === "radio" ? "text-[#C96A5B]" : l.kind === "check_in" || l.kind === "check_out" ? "text-[#C5A06C]" : l.kind === "status" ? "text-[#C5A06C]" : l.kind === "inventory" ? "text-[#D9A441]" : "text-[#B8C0B4]"}`}>[{l.kind}]</span>
                <span className="text-[#DCD8CC]">{l.text}</span>
                <span className="text-[#A6B0A3] ml-auto shrink-0">{l.actor}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* ── MISSION AI ── */}
      {section === "ai" && (
        <Card className="border-[#4A5548] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold flex items-center gap-1.5"><Bot className="w-4 h-4 text-[#C5A06C]" /> Mission Control AI — knows every client, unit and part</CardTitle>
            <CardDescription className="text-xs">Real Gemini briefing over the live ops snapshot: tasks, ETAs, staffing, inventory, CRM. Ask in English or Spanish.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between text-xs text-[#B8C0B4]">
              <span className="inline-flex items-center gap-1.5">
                <Mic className="w-3.5 h-3.5 text-[#C5A06C]" /> Speak or type your question — the answer is read back aloud.
              </span>
              <button
                type="button"
                onClick={() => setAiVoiceOn((v) => !v)}
                className={`flex items-center gap-1.5 font-bold ${aiVoiceOn ? "text-[#C5A06C]" : "text-[#A6B0A3]"}`}
              >
                {aiVoiceOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                Readback {aiVoiceOn ? "ON" : "OFF"}
              </button>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={toggleAiMic}
                className={`shrink-0 h-10 rounded-xl ${aiListening ? "bg-[#3A2F2C] text-[#C96A5B] border-[#5A4A44] animate-pulse" : "bg-[#262B30] text-[#C5CBBF] border-[#4A5548] hover:bg-[#22302A]"}`}
                title={aiListening ? "Stop listening" : "Dictate question"}
              >
                {aiListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              <input
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && askMissionAI()}
                placeholder={aiListening ? "Listening… (EN/ES)" : "e.g. Brief me — any unit at risk of delay? What should I restock today?"}
                className="flex-1 h-10 px-3 rounded-xl border border-[#4A5548] text-sm"
                disabled={aiLoading}
              />
              <Button className="bg-[#B08D57] hover:bg-[#C5A06C] h-10 gap-1.5 font-bold" onClick={askMissionAI} disabled={aiLoading || !aiPrompt.trim()}>
                <Send className="w-4 h-4" /> {aiLoading ? "Analyzing…" : "Ask"}
              </Button>
            </div>
            {aiReply && (
              <div className="bg-[#22302A] border border-[#4A5548] rounded-xl p-4 text-sm text-[#EFE9DC] whitespace-pre-line">{aiReply}</div>
            )}
            <details className="text-[11px] text-[#A6B0A3]">
              <summary className="cursor-pointer font-bold">What the AI sees (live context)</summary>
              <pre className="mt-2 p-3 bg-[#181C20] text-[#8FC7AA] rounded-lg overflow-x-auto whitespace-pre-wrap">{opsContext}</pre>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: string | number; tone: string }) {
  return (
    <div className="bg-[#22262B]/70 border border-[#4A5548] rounded-xl px-3.5 py-2 text-center min-w-[86px]">
      <p className={`text-xl font-black leading-none ${tone}`}>{value}</p>
      <p className="text-[9px] font-bold uppercase tracking-wider text-[#B8C0B4] mt-1">{label}</p>
    </div>
  );
}
