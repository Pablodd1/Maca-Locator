import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useAppState } from "./AppContext";

// ─── MACALOCATOR live operations engine ─────────────────────────────────────
// Simulates the real dispatch pipeline end-to-end: staff units move across the
// city grid, tasks progress en_route → arrived → in_service → completed with
// check-in/check-out events, inventory is consumed on completion, and every
// event lands in one activity ledger Mission Control can audit. Swap this
// simulator for the Supabase-backed engine later — the shapes stay the same.

export type StaffStatus = "idle" | "en_route" | "on_site" | "offline";

export type StaffUnit = {
  id: string;
  name: string;
  role: string;
  specialty: string;
  phone: string;
  status: StaffStatus;
  pos: { x: number; y: number }; // % of map area
  home: { x: number; y: number };
  taskId?: string;
  checkInAt?: number;
  checkOutAt?: number;
  etaMin?: number;
};

export type TaskStatus = "unassigned" | "assigned" | "en_route" | "arrived" | "in_service" | "completed";

export type OpsTask = {
  id: string;
  bookingId?: string;
  type: string;
  clientName: string;
  vehicle: string;
  address: string;
  target: { x: number; y: number };
  status: TaskStatus;
  staffId?: string;
  scheduledAt: string; // display label
  startedAt?: number;
  completedAt?: number;
  expectedMin: number;
  includes: string[];
  excludes: string[];
};

export type InventoryItem = {
  id: string;
  name: string;
  qty: number;
  threshold: number;
  unit: string;
};

export type LedgerKind = "dispatch" | "check_in" | "check_out" | "status" | "radio" | "inventory" | "crm" | "alert";

export type LedgerEntry = {
  id: string;
  ts: number;
  kind: LedgerKind;
  text: string;
  actor: string;
};

const DIST = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);

const now = () => Date.now();
const rid = (p: string) => p + Math.random().toString(36).slice(2, 9);

const defaultStaff: StaffUnit[] = [
  { id: "u1", name: "Marco Díaz", role: "Lead Technician", specialty: "EV & Diagnostics", phone: "+1 (305) 555-0181", status: "idle", pos: { x: 22, y: 30 }, home: { x: 22, y: 30 } },
  { id: "u2", name: "Ana Villalba", role: "Mobile Mechanic", specialty: "Tires & Brakes", phone: "+1 (305) 555-0182", status: "idle", pos: { x: 70, y: 62 }, home: { x: 70, y: 62 } },
  { id: "u3", name: "James Wright", role: "Roadside Specialist", specialty: "Battery & Recovery", phone: "+1 (305) 555-0183", status: "idle", pos: { x: 50, y: 12 }, home: { x: 50, y: 12 } },
];

const defaultInventory: InventoryItem[] = [
  { id: "i1", name: "0W-20 Full Synthetic Oil (qt)", qty: 24, threshold: 10, unit: "qt" },
  { id: "i2", name: "Cabin Air Filter (OEM)", qty: 8, threshold: 10, unit: "ea" },
  { id: "i3", name: "12V AGM Battery", qty: 6, threshold: 4, unit: "ea" },
  { id: "i4", name: "Brake Pads Front (set)", qty: 5, threshold: 4, unit: "set" },
  { id: "i5", name: "Tire Patch Kit", qty: 12, threshold: 6, unit: "ea" },
  { id: "i6", name: "EV Coolant (gal)", qty: 3, threshold: 4, unit: "gal" },
];

const SERVICE_RULES: Record<string, { includes: string[]; excludes: string[]; min: number }> = {
  "Tire Rotation": { includes: ["Torque to OEM spec", "TPMS recheck", "Tread depth report"], excludes: ["Alignment", "New tires mounting"], min: 30 },
  "Battery Diagnostic": { includes: ["12V & high-voltage health scan", "Charging system test", "Replacement quote if failing"], excludes: ["Battery replacement without approval", "Traction pack opening"], min: 45 },
  "Car Wash & Detailing": { includes: ["Hand exterior wash", "Interior detail", "Ceramic touch-up spray"], excludes: ["Paint correction", "Body work"], min: 90 },
  "Full Mobile Diagnostics": { includes: ["Full ECU scan", "Road-test verification", "Written report + photos"], excludes: ["Repairs without written approval"], min: 60 },
};

function seedTask(type: string, clientName: string, vehicle: string, address: string, scheduledAt: string, bookingId?: string): OpsTask {
  const rules = SERVICE_RULES[type] || SERVICE_RULES["Full Mobile Diagnostics"];
  return {
    id: rid("t_"),
    bookingId,
    type,
    clientName,
    vehicle,
    address,
    target: { x: 20 + Math.random() * 60, y: 20 + Math.random() * 60 },
    status: "unassigned",
    scheduledAt,
    expectedMin: rules.min,
    includes: rules.includes,
    excludes: rules.excludes,
  };
}

type OpsContextType = {
  staff: StaffUnit[];
  tasks: OpsTask[];
  inventory: InventoryItem[];
  ledger: LedgerEntry[];
  liveTask: OpsTask | null; // the client's active task (demo: newest non-completed)
  createTask: (t: { type: string; clientName: string; vehicle: string; address: string; scheduledAt: string; bookingId?: string }) => OpsTask;
  assignTask: (taskId: string, staffId: string) => void;
  checkIn: (taskId: string) => void;
  checkOut: (taskId: string) => void;
  advance: (taskId: string, status: TaskStatus) => void;
  radioBroadcast: (message: string) => void;
  restock: (itemId: string, qty: number) => void;
  logEvent: (kind: LedgerKind, text: string, actor?: string) => void;
  etaFor: (t: OpsTask) => number | null;
};

const OpsContext = createContext<OpsContextType | undefined>(undefined);

const STATUS_LABEL: Record<TaskStatus, string> = {
  unassigned: "Awaiting assignment",
  assigned: "Technician assigned",
  en_route: "Technician en route to you",
  arrived: "Technician arrived",
  in_service: "Service in progress",
  completed: "Service completed",
};
export const taskStatusLabel = (s: TaskStatus) => STATUS_LABEL[s];
export const STATUS_ORDER: TaskStatus[] = ["unassigned", "assigned", "en_route", "arrived", "in_service", "completed"];

export const OpsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, vehicles, bookings } = useAppState();
  const [staff, setStaff] = useState<StaffUnit[]>(() => {
    try { return JSON.parse(localStorage.getItem("maca_staff") || "null") || defaultStaff; } catch { return defaultStaff; }
  });
  const [tasks, setTasks] = useState<OpsTask[]>(() => {
    try { return JSON.parse(localStorage.getItem("maca_tasks") || "null") || []; } catch { return []; }
  });
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    try { return JSON.parse(localStorage.getItem("maca_inventory") || "null") || defaultInventory; } catch { return defaultInventory; }
  });
  const [ledger, setLedger] = useState<LedgerEntry[]>(() => {
    try { return JSON.parse(localStorage.getItem("maca_ledger") || "null") || []; } catch { return []; }
  });

  useEffect(() => localStorage.setItem("maca_staff", JSON.stringify(staff)), [staff]);
  useEffect(() => localStorage.setItem("maca_tasks", JSON.stringify(tasks)), [tasks]);
  useEffect(() => localStorage.setItem("maca_inventory", JSON.stringify(inventory)), [inventory]);
  useEffect(() => localStorage.setItem("maca_ledger", JSON.stringify(ledger.slice(0, 200))), [ledger]);

  const logEvent = (kind: LedgerKind, text: string, actor = "Mission Control") => {
    setLedger((prev) => [{ id: rid("l_"), ts: now(), kind, text, actor }, ...prev].slice(0, 200));
  };

  // Seed a live task from today's bookings the first time we see them
  const seededRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    const todays = bookings.filter(
      (b) => b.status !== "completed" && b.date === new Date().toISOString().slice(0, 10)
    );
    if (todays.length && !tasks.length && !seededRef.current.size) {
      const b = todays[0];
      const v = vehicles.find((x) => x.id === b.vehicleId);
      seededRef.current.add(b.id);
      createTask({
        type: b.type,
        clientName: user?.name || "VIP Client",
        vehicle: v ? `${v.year} ${v.make} ${v.model}` : "client vehicle",
        address: "1000 Brickell Plaza, Miami, FL",
        scheduledAt: `${b.date} · ${b.time}`,
        bookingId: b.id,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookings.length]);

  const createTask: OpsContextType["createTask"] = (t) => {
    const task = seedTask(t.type, t.clientName, t.vehicle, t.address, t.scheduledAt, t.bookingId);
    setTasks((prev) => [task, ...prev]);
    logEvent("dispatch", `New task created — ${t.type} for ${t.clientName} · ${t.scheduledAt} · ${t.address}`);
    return task;
  };

  const assignTask: OpsContextType["assignTask"] = (taskId, staffId) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "assigned", staffId } : t)));
    setStaff((prev) => prev.map((s) => (s.id === staffId ? { ...s, status: "en_route", taskId } : s)));
    const who = staff.find((s) => s.id === staffId);
    logEvent("dispatch", `${who?.name || "Technician"} dispatched to ${taskId.slice(0, 6)} — en route`);
  };

  const checkIn: OpsContextType["checkIn"] = (taskId) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "in_service", startedAt: now() } : t)));
    setStaff((prev) => prev.map((s) => (s.taskId === taskId ? { ...s, status: "on_site", checkInAt: now() } : s)));
    logEvent("check_in", `Technician checked IN on site — task ${taskId.slice(0, 6)}`);
  };

  const checkOut: OpsContextType["checkOut"] = (taskId) => {
    const task = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: "completed", completedAt: now() } : t)));
    setStaff((prev) =>
      prev.map((s) =>
        s.taskId === taskId
          ? { ...s, status: "idle", taskId: undefined, checkOutAt: now(), pos: { ...task?.target ?? s.home } }
          : s
      )
    );
    // consume inventory on completion
    setInventory((prev) =>
      prev.map((i, idx) => (idx % 3 === 0 ? { ...i, qty: Math.max(0, i.qty - 1) } : i))
    );
    logEvent("check_out", `Task ${taskId.slice(0, 6)} completed — technician checked OUT, materials consumed`);
  };

  const advance: OpsContextType["advance"] = (taskId, status) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status } : t)));
    logEvent("status", `Task ${taskId.slice(0, 6)} → ${taskStatusLabel(status)}`);
  };

  const radioBroadcast: OpsContextType["radioBroadcast"] = (message) => {
    logEvent("radio", `RADIO BROADCAST to all units: "${message}"`, "Dispatcher");
    fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: "telegram", message: `📻 MACALOCATOR RADIO — ${message}` }),
    }).catch(() => {});
  };

  const restock: OpsContextType["restock"] = (itemId, qty) => {
    setInventory((prev) => prev.map((i) => (i.id === itemId ? { ...i, qty: i.qty + qty } : i)));
    const item = inventory.find((i) => i.id === itemId);
    logEvent("inventory", `Restocked ${item?.name || itemId} +${qty}`);
  };

  const etaFor: OpsContextType["etaFor"] = (t) => {
    if (t.status === "completed" || t.status === "in_service" || t.status === "arrived") return null;
    const unit = staff.find((s) => s.id === t.staffId);
    if (!unit) return null;
    const remaining = DIST(unit.pos, t.target);
    return Math.max(1, Math.round(remaining / 2.2));
  };

  // ── Simulation tick: units drive toward their target, statuses advance ──
  useEffect(() => {
    const SPEED = 1.8; // % of map per tick
    const timer = setInterval(() => {
      setStaff((prevStaff) => {
        let changed = false;
        const next = prevStaff.map((s) => {
          if (s.status !== "en_route" || !s.taskId) return s;
          const task = tasks.find((t) => t.id === s.taskId);
          if (!task) return s;
          const dx = task.target.x - s.pos.x;
          const dy = task.target.y - s.pos.y;
          const d = Math.hypot(dx, dy);
          if (d < SPEED) {
            changed = true;
            return { ...s, pos: { ...task.target }, etaMin: 0 };
          }
          changed = true;
          return {
            ...s,
            pos: { x: s.pos.x + (dx / d) * SPEED, y: s.pos.y + (dy / d) * SPEED },
            etaMin: Math.max(1, Math.round((d - SPEED) / 2.2)),
          };
        });
        return changed ? next : prevStaff;
      });

      // Status transitions: assigned → en_route once the unit is driving,
      // then arrival detection → "arrived" (+ client alert)
      setTasks((prevTasks) => {
        let mutated = false;
        const next = prevTasks.map((t) => {
          if (t.status !== "assigned" && t.status !== "en_route") return t;
          const unit = staff.find((s) => s.id === t.staffId);
          if (!unit) return t;
          if (DIST(unit.pos, t.target) < 2.5) {
            mutated = true;
            return { ...t, status: "arrived" as TaskStatus };
          }
          if (t.status === "assigned" && unit.status === "en_route") {
            mutated = true;
            return { ...t, status: "en_route" as TaskStatus };
          }
          return t;
        });
        if (mutated) {
          const arrived = next.filter((t) => t.status === "arrived" && prevTasks.find((p) => p.id === t.id)?.status === "en_route");
          arrived.forEach((t) =>
            logEvent("status", `${t.clientName}: technician ARRIVED at ${t.address} — awaiting check-in`, "Ops Engine")
          );
        }
        return mutated ? next : prevTasks;
      });
    }, 2500);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, staff]);

  const liveTask = tasks.find((t) => t.status !== "completed") || null;

  return (
    <OpsContext.Provider
      value={{ staff, tasks, inventory, ledger, liveTask, createTask, assignTask, checkIn, checkOut, advance, radioBroadcast, restock, logEvent, etaFor }}
    >
      {children}
    </OpsContext.Provider>
  );
};

export const useOps = () => {
  const ctx = useContext(OpsContext);
  if (!ctx) throw new Error("useOps must be used within OpsProvider");
  return ctx;
};
