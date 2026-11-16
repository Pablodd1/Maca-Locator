import { useAppState } from "../context/AppContext";
import { MacalocatorLogo } from "./MacalocatorLogo";
import { Crown, UserPlus, Radar, ArrowRight } from "lucide-react";

// ─── Welcome Gate — demo persona skip buttons ───────────────────────────────
// Shown until a demo profile is chosen. Three ways in:
//   FULL  → Jasmel Acosta, complete VIP profile + a service TODAY (live tracker)
//   EMPTY → brand-new client, nothing registered (walk the registration flow)
//   ADMIN → JASMELADM, straight into Mission Control with the full dataset

export function PersonaGate({ onChosen }: { onChosen?: () => void }) {
  const { applyPersona } = useAppState();

  const choose = (kind: "full" | "empty" | "admin") => {
    onChosen?.();
    applyPersona(kind); // writes storage + reloads into the chosen persona
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex items-center justify-center p-6 overflow-y-auto">
      <div className="absolute top-10 right-[-140px] w-[520px] h-[520px] rounded-full border border-amber-500/30 pointer-events-none" />
      <div className="absolute top-16 right-[-80px] w-[400px] h-[400px] rounded-full border border-amber-500/15 pointer-events-none" />

      <div className="relative w-full max-w-3xl py-10">
        <div className="flex items-center gap-3 justify-center">
          <MacalocatorLogo size="lg" />
        </div>
        <h1 className="text-center text-3xl md:text-4xl font-extrabold text-white mt-6 tracking-tight">
          Welcome to MACALOCATOR
        </h1>
        <p className="text-center text-amber-300 font-semibold mt-1 italic">
          Bienvenido — elija su perfil de demostración
        </p>
        <p className="text-center text-slate-400 text-sm mt-3 max-w-xl mx-auto">
          Pick a profile to enter. You can switch anytime from the sidebar — nothing is lost.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-9">
          <button
            onClick={() => choose("full")}
            className="group text-left bg-gradient-to-b from-amber-500/15 to-amber-500/5 border border-amber-500/30 hover:border-amber-400 rounded-2xl p-5 transition-all hover:-translate-y-0.5"
          >
            <Crown className="w-6 h-6 text-amber-400" />
            <h3 className="font-extrabold text-white mt-3">Jasmel Acosta</h3>
            <p className="text-[11px] text-amber-200 font-bold uppercase tracking-wider mt-0.5">Full VIP demo · skip →</p>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Complete profile: 2 vehicles, insurance, GPS, a service happening <strong className="text-slate-200">today</strong> with live tracking and reminders.
            </p>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-300 mt-3">
              Enter full workflow <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </button>

          <button
            onClick={() => choose("empty")}
            className="group text-left bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-2xl p-5 transition-all hover:-translate-y-0.5"
          >
            <UserPlus className="w-6 h-6 text-sky-400" />
            <h3 className="font-extrabold text-white mt-3">New Client</h3>
            <p className="text-[11px] text-sky-300 font-bold uppercase tracking-wider mt-0.5">Empty profile · skip →</p>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Nothing registered. Walk the real onboarding: create profile, capture GPS, add a vehicle, book the first service.
            </p>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-300 mt-3">
              Enter registration workflow <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </button>

          <button
            onClick={() => choose("admin")}
            className="group text-left bg-gradient-to-b from-blue-600/20 to-blue-600/5 border border-blue-500/40 hover:border-blue-400 rounded-2xl p-5 transition-all hover:-translate-y-0.5"
          >
            <Radar className="w-6 h-6 text-blue-400" />
            <h3 className="font-extrabold text-white mt-3">JASMELADM</h3>
            <p className="text-[11px] text-blue-300 font-bold uppercase tracking-wider mt-0.5">Administrator · skip →</p>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Mission Control: live units, task manager, staff radio, inventory, CRM export and the operations AI.
            </p>
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-300 mt-3">
              Enter Mission Control <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </button>
        </div>

        <p className="text-center text-[11px] text-slate-500 mt-8 font-mono">
          MACALOCATOR · Miami & Miami Beach · English · Español · Kreyòl
        </p>
      </div>
    </div>
  );
}
