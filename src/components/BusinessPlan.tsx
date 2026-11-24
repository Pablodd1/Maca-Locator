import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Briefcase, Wrench, Package, Truck, Sparkles, LineChart as LineChartIcon, Users, Calculator,
} from "lucide-react";

// ─── MACALOCATOR Business Plan — 50-client operating model ──────────────────
// All figures grounded in 2025-26 research (see BUSINESS-PLAN.md for sources):
// mobile repair market $4.27B→$7.09B by 2031 (Mordor); competitor jobs
// $100-200 (YourMechanic/Wrench); Miami techs $25-31/hr (Indeed/BLS);
// full mobile-op insurance $340-590/mo solo (Insureon); luxury concierge
// memberships $100-700/mo (MotorEnvy/Aurelius benchmarks).

// ── Model coefficients (editable in one place) ──
const MODEL = {
  visitsPerClientMonth: 1.2,        // membership-covered maintenance visits
  alaCarteJobsPer50: 25,            // brakes/batteries/extra details/roadside
  alaCarteAvgRev: 210,
  alaCarteMat: 95,
  coveredMatPerVisit: 48,           // oil/filters/diag consumables mix
  hoursPerJob: 2.0,                 // 1.5 on-site + 0.5 travel
  productiveHoursPerTech: 140,      // 21 days × 8h × 83% utilization
  techLoadedHourly: 32,             // $26-28 base + taxes/WC/benefits
  detailerLoadedHourly: 26,
  surgeContractorJobs: 0.15,        // share of jobs to on-call contractors
  vanLease: 700,
  vanFuelMaintPerVan: 420,          // ~1,200 mi/mo
  insurance: 1100,                  // garage liability + commercial auto ×2 + tools floater
  software: 250,                    // hosting, Twilio, Telegram ops, phone
  marketing: 600,
  miscAdmin: 350,
  storage: 400,                     // small parts warehouse (Brickell-adjacent)
};

const TIERS = [
  {
    name: "Essential", price: 119, target: "40% of members",
    color: "#C5CBBF",
    includes: [
      "1 maintenance visit / month (oil, diagnostics, battery health)",
      "Smart reminders — SMS, WhatsApp, voice call, email",
      "Trilingual concierge chat (EN · ES · Kreyòl)",
      "15% member pricing on everything else",
    ],
  },
  {
    name: "Privé", price: 269, target: "44% of members",
    color: "#C5A06C", featured: true,
    includes: [
      "2 visits / month — maintenance + care",
      "Full detail every quarter",
      "Priority dispatch (same-day windows)",
      "Direct WhatsApp line to your technician",
      "Tire & battery season checks",
    ],
  },
  {
    name: "Prestige", price: 549, target: "16% of members",
    color: "#6FAE8F",
    includes: [
      "Unlimited maintenance (fair use: 4 visits/mo)",
      "Full detail monthly",
      "24/7 priority roadside included",
      "Second household car at 50%",
      "Dedicated technician + annual vehicle report",
    ],
  },
];

// ── 50-client capacity inventory ──
const STAFF_PLAN = [
  { role: "Master Technician (EV & Diagnostics)", count: 1, schedule: "Full-time · Mon–Sat", cost: "$26–30/hr + load ≈ $5.4K/mo", note: "ASE/EV certified; runs Van 1 (diagnostics & repair)" },
  { role: "Technician (Service & Brakes)", count: 1, schedule: "Full-time · Mon–Sat", cost: "≈ $5.4K/mo loaded", note: "Runs Van 2; cross-trained in detailing" },
  { role: "Detail Specialist", count: 1, schedule: "Part-time · 80 hrs/mo", cost: "≈ $2.1K/mo loaded", note: "Surge to full-time past 60 members" },
  { role: "Dispatcher / Mission Control", count: 1, schedule: "Owner-operated", cost: "Sweat equity (draw at profit)", note: "Runs this console: dispatch, radio, CRM, sweeps" },
  { role: "EV High-Voltage Contractor", count: 2, schedule: "On-call", cost: "Per job (≈15% of jobs)", note: "Traction-pack referrals — never in-house at this scale" },
];

const FLEET_TOOLS = [
  { item: "Cargo van (lease, wrapped) — Van 1 Diagnostics", qty: 1, cost: "$700/mo lease", oneTime: "$1,500 wrap" },
  { item: "Cargo van (lease, wrapped) — Van 2 Service & Detail", qty: 1, cost: "$700/mo lease", oneTime: "$1,500 wrap" },
  { item: "Pro diagnostic scanner (Autel MaxiSys class)", qty: 2, cost: "—", oneTime: "$3,500 ea" },
  { item: "EV high-voltage safety kit (Class 0 gloves, tester, mats)", qty: 1, cost: "—", oneTime: "$900" },
  { item: "Jack + stands + ramps set", qty: 2, cost: "—", oneTime: "$700 ea" },
  { item: "Torque wrench set (¼-¾ in)", qty: 2, cost: "—", oneTime: "$300 ea" },
  { item: "Battery tester + smart charger/maintainer", qty: 2, cost: "—", oneTime: "$400 ea" },
  { item: "Impact kit + portable compressor", qty: 2, cost: "—", oneTime: "$800 ea" },
  { item: "Detailing rig (polisher, steamer, extractor)", qty: 1, cost: "—", oneTime: "$2,200" },
  { item: "Complete hand-tool complement + storage", qty: 2, cost: "—", oneTime: "$2,000 ea" },
  { item: "TPMS programmer + tire service kit", qty: 1, cost: "—", oneTime: "$1,100" },
];

const MATERIALS_MONTHLY = [
  { item: "0W-20 / 0W-30 full synthetic oil", par: "160 qt", monthly: "$1,120" },
  { item: "OEM oil filters (mixed makes)", par: "35 ea", monthly: "$420" },
  { item: "Cabin air filters", par: "15 ea", monthly: "$270" },
  { item: "Engine air filters", par: "10 ea", monthly: "$200" },
  { item: "Brake pad sets (front/rear)", par: "6 sets", monthly: "$510" },
  { item: "Brake rotors (pairs)", par: "3 pairs", monthly: "$420" },
  { item: "12V AGM batteries (premium)", par: "8 ea", monthly: "$1,680" },
  { item: "EV coolant (OEM-spec)", par: "6 gal", monthly: "$168" },
  { item: "Engine coolant (ICE)", par: "10 gal", monthly: "$180" },
  { item: "Wiper blades (premium beam)", par: "12 pr", monthly: "$264" },
  { item: "Bulbs / LED assemblies", par: "10 ea", monthly: "$150" },
  { item: "Tire patch & repair consumables", par: "kit", monthly: "$60" },
  { item: "Detailing chemistry (ceramic, interior, wash)", par: "20 details", monthly: "$560" },
  { item: "Gloves, towels, disposables", par: "bulk", monthly: "$180" },
  { item: "Hardware, bits, wear items", par: "bulk", monthly: "$120" },
];

const ZONES = [
  { zone: "Z1 · Brickell / Downtown", base: "Van 1", promise: "Arrival ≤ 60 min (emergency ≤ 30)" },
  { zone: "Z2 · South Beach / South of Fifth", base: "Van 2", promise: "Arrival ≤ 60 min (emergency ≤ 30)" },
  { zone: "Z3 · Coral Gables / Coconut Grove", base: "Closest unit", promise: "Arrival ≤ 90 min (emergency ≤ 45)" },
  { zone: "Z4 · Wynwood / Edgewater / Design District", base: "Closest unit", promise: "Arrival ≤ 90 min (emergency ≤ 45)" },
  { zone: "Z5 · Fisher Island / Key Biscayne (by arrangement)", base: "Ferry schedule", promise: "Scheduled visits only" },
];

const RAMP = [
  { phase: "Months 1–3 · Founding 25", focus: "Founding-member pricing, concierge partnerships (buildings, hotels), 1 van + 1 master tech", exit: "25 members · ~$6.2K MRR" },
  { phase: "Months 4–8 · To 50", focus: "Van 2 + tech 2, detail program launch, referral engine (1 free detail per referral)", exit: "50 members · ~$12.7K MRR · breakeven zone" },
  { phase: "Months 9–12 · Optimize 50→75", focus: "Fleet routing tuning, Prestige tier push, corporate accounts (hotels, brokers)", exit: "75 members · ~$19K MRR · profitable" },
];

function money(n: number) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
}

export function BusinessPlan() {
  const [members, setMembers] = useState(50);
  const [showAll, setShowAll] = useState(false);

  const econ = useMemo(() => {
    const m = MODEL;
    const coveredVisits = members * m.visitsPerClientMonth;
    const alaCarte = Math.round((members / 50) * m.alaCarteJobsPer50);
    const totalJobs = Math.round(coveredVisits + alaCarte);
    const techHours = totalJobs * m.hoursPerJob;
    const techsNeeded = Math.max(1, Math.ceil(techHours / m.productiveHoursPerTech));
    const vansNeeded = Math.max(1, Math.ceil(members / 30));
    // revenue: tier mix 40/44/16
    const mrr = members * (0.4 * 119 + 0.44 * 269 + 0.16 * 549);
    const alaRev = alaCarte * m.alaCarteAvgRev;
    const revenue = mrr + alaRev;
    // costs
    const payroll = techsNeeded * m.techLoadedHourly * 160 + Math.min(1, members / 60) * m.detailerLoadedHourly * 80;
    const vans = vansNeeded * (m.vanLease + m.vanFuelMaintPerVan);
    const fixed = vans + m.insurance + m.software + m.marketing + m.miscAdmin + m.storage;
    const materials = coveredVisits * m.coveredMatPerVisit + alaCarte * m.alaCarteMat;
    const costs = payroll + fixed + materials;
    const profit = revenue - costs;
    // breakeven members at this cost curve (linear-ish): solve iteratively
    let be = 1;
    for (let n = 1; n <= 200; n++) {
      const cv = n * m.visitsPerClientMonth;
      const ac = Math.round((n / 50) * m.alaCarteJobsPer50);
      const tn = Math.max(1, Math.ceil((cv + ac) * m.hoursPerJob / m.productiveHoursPerTech));
      const vn = Math.max(1, Math.ceil(n / 30));
      const rev = n * (0.4 * 119 + 0.44 * 269 + 0.16 * 549) + ac * m.alaCarteAvgRev;
      const cost = tn * m.techLoadedHourly * 160 + Math.min(1, n / 60) * m.detailerLoadedHourly * 80
        + vn * (m.vanLease + m.vanFuelMaintPerVan) + m.insurance + m.software + m.marketing + m.miscAdmin + m.storage
        + cv * m.coveredMatPerVisit + ac * m.alaCarteMat;
      if (rev >= cost) { be = n; break; }
    }
    return { coveredVisits: Math.round(coveredVisits), alaCarte, totalJobs, techsNeeded, vansNeeded, mrr, alaRev, revenue, payroll, fixed, materials: Math.round(materials), costs: Math.round(costs), profit: Math.round(profit), breakeven: be };
  }, [members]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-[#181C20] text-white rounded-2xl p-5 shadow-xl border border-[#3A4046]">
        <div className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-[#C5A06C] uppercase">
          <Briefcase className="w-3.5 h-3.5" /> Business Plan · 50-Client Operating Model
        </div>
        <h2 className="font-display text-xl font-extrabold mt-1">The full picture — demand, fleet, people, money.</h2>
        <p className="text-xs text-[#8B93A7] mt-0.5 max-w-2xl">
          Model grounded in 2025-26 market data (sources in BUSINESS-PLAN.md). Drag the member count — staffing, fleet, revenue and costs recalculate live.
        </p>
      </div>

      {/* Interactive unit economics */}
      <Card className="border-[#3A4046] shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold flex items-center gap-1.5"><Calculator className="w-4 h-4 text-[#C5A06C]" /> Unit economics — live model</CardTitle>
          <CardDescription className="text-xs">Tier mix 40% Essential · 44% Privé · 16% Prestige. Jobs = covered visits + à-la-carte.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-[#B8C0B4] w-20 shrink-0">Members</span>
            <input
              type="range" min={10} max={120} value={members}
              onChange={(e) => setMembers(Number(e.target.value))}
              className="flex-1 accent-[#B08D57] touch-manipulation"
              aria-label="Member count"
            />
            <span className="font-display text-2xl font-extrabold text-[#C5A06C] w-14 text-right tabular-nums">{members}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <Cell label="Covered visits/mo" value={econ.coveredVisits} />
            <Cell label="À-la-carte jobs/mo" value={econ.alaCarte} />
            <Cell label="Technicians" value={econ.techsNeeded} />
            <Cell label="Vans" value={econ.vansNeeded} />
            <Cell label="MRR (memberships)" value={money(econ.mrr)} tone="text-[#6FAE8F]" />
            <Cell label="Total revenue/mo" value={money(econ.revenue)} tone="text-[#6FAE8F]" />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <Cell label="Payroll (loaded)" value={money(econ.payroll)} />
            <Cell label="Fleet + fixed" value={money(econ.fixed)} />
            <Cell label="Materials" value={money(econ.materials)} />
            <Cell label="Total costs/mo" value={money(econ.costs)} />
            <Cell label="Monthly profit" value={money(econ.profit)} tone={econ.profit >= 0 ? "text-[#6FAE8F]" : "text-[#C96A5B]"} />
            <Cell label="Breakeven at" value={`${econ.breakeven} members`} tone="text-[#C5A06C]" />
          </div>
          <p className="text-[11px] text-[#8B93A7] leading-relaxed">
            Honest read: 50 members sits in the pre-breakeven zone; the curve crosses zero around {econ.breakeven} members. Margin lives in Privé/Prestige mix, à-la-carte attach (target ≥ 0.6 jobs/member/mo at 2.0–2.5× materials), and capping the Essential covered visit at ≤ $35 materials. With those levers, this same member base clears ≈ $4–6K/mo.
          </p>
        </CardContent>
      </Card>

      {/* Pricing tiers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {TIERS.map((t) => (
          <Card key={t.name} className={`border-[#3A4046] shadow-sm relative ${t.featured ? "ring-1 ring-[#B08D57]" : ""}`}>
            {t.featured && <span className="absolute -top-2.5 left-4 text-[9px] font-extrabold uppercase tracking-wider bg-[#B08D57] text-[#241C10] px-2 py-0.5 rounded-full">Most popular</span>}
            <CardContent className="p-5 pt-6">
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: t.color }}>{t.name} · {t.target}</p>
              <p className="font-display text-4xl font-extrabold text-[#EFE9DC] mt-1">{t.price}<span className="text-sm text-[#8B93A7] font-semibold"> /mo</span></p>
              <ul className="mt-3 space-y-1.5 text-xs text-[#DCD8CC]">
                {t.includes.map((i) => <li key={i} className="flex gap-2"><span className="text-[#C5A06C]">◆</span>{i}</li>)}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Staff */}
      <Card className="border-[#3A4046] shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-1.5"><Users className="w-4 h-4 text-[#C5A06C]" /> Staff plan — 50 members</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {STAFF_PLAN.map((s) => (
            <div key={s.role} className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-3 border-b border-[#3A4046] pb-2">
              <div className="sm:w-72 shrink-0"><p className="text-sm font-bold text-[#EFE9DC]">{s.count}× {s.role}</p><p className="text-[11px] text-[#8B93A7]">{s.schedule}</p></div>
              <p className="text-xs text-[#C5A06C] font-bold sm:w-40 shrink-0 tabular-nums">{s.cost}</p>
              <p className="text-[11px] text-[#B8C0B4]">{s.note}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Fleet & tools */}
      <Card className="border-[#3A4046] shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-1.5"><Wrench className="w-4 h-4 text-[#C5A06C]" /> Fleet & tool inventory — one-time build ≈ $20K</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6">
            {FLEET_TOOLS.slice(0, showAll ? FLEET_TOOLS.length : 6).map((t) => (
              <div key={t.item} className="flex items-center justify-between gap-3 border-b border-[#3A4046] py-1.5">
                <p className="text-xs text-[#DCD8CC] flex-1">{t.item}</p>
                <span className="text-[10px] font-mono text-[#8B93A7]">×{t.qty}</span>
                <span className="text-xs font-bold text-[#C5A06C] w-24 text-right tabular-nums">{t.oneTime}</span>
              </div>
            ))}
          </div>
          <Button size="sm" variant="outline" className="mt-3 h-8 text-[10px] font-bold border-[#3A4046] text-[#B8C0B4]" onClick={() => setShowAll(!showAll)}>
            {showAll ? "Show less" : `Show all ${FLEET_TOOLS.length} items`}
          </Button>
        </CardContent>
      </Card>

      {/* Materials */}
      <Card className="border-[#3A4046] shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-1.5"><Package className="w-4 h-4 text-[#C5A06C]" /> Materials — monthly par for 50 members (≈ $6.3K/mo)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6">
            {MATERIALS_MONTHLY.map((m) => (
              <div key={m.item} className="flex items-center justify-between gap-3 border-b border-[#3A4046] py-1.5">
                <p className="text-xs text-[#DCD8CC] flex-1">{m.item}</p>
                <span className="text-[10px] font-mono text-[#8B93A7] w-16 text-right">{m.par}</span>
                <span className="text-xs font-bold text-[#C5A06C] w-16 text-right tabular-nums">{m.monthly}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Logistics */}
      <Card className="border-[#3A4046] shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-1.5"><Truck className="w-4 h-4 text-[#C5A06C]" /> Logistics — service zones & promises</CardTitle></CardHeader>
        <CardContent className="space-y-1.5">
          {ZONES.map((z) => (
            <div key={z.zone} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 border-b border-[#3A4046] pb-1.5">
              <p className="text-xs font-bold text-[#EFE9DC] sm:w-72 shrink-0">{z.zone}</p>
              <p className="text-[11px] text-[#C5A06C] sm:w-24 shrink-0">{z.base}</p>
              <p className="text-[11px] text-[#B8C0B4]">{z.promise}</p>
            </div>
          ))}
          <p className="text-[11px] text-[#8B93A7] pt-2">Nightly van return + restock at storage unit; Saturday = peak detailing day; storms trigger the radio-broadcast playbook.</p>
        </CardContent>
      </Card>

      {/* Ramp plan */}
      <Card className="border-[#3A4046] shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-sm font-bold flex items-center gap-1.5"><LineChartIcon className="w-4 h-4 text-[#C5A06C]" /> 12-month ramp to 75 members</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {RAMP.map((r) => (
            <div key={r.phase} className="bg-[#22262B] border border-[#3A4046] rounded-xl p-4">
              <p className="text-xs font-extrabold text-[#C5A06C]">{r.phase}</p>
              <p className="text-[11px] text-[#DCD8CC] mt-2 leading-relaxed">{r.focus}</p>
              <p className="text-[11px] font-bold text-[#6FAE8F] mt-2">Exit: {r.exit}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <p className="text-[10px] text-[#8B93A7] flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> Full narrative, market study and sources: BUSINESS-PLAN.md in the repo. Model coefficients editable in this component's MODEL constant.</p>
    </div>
  );
}

function Cell({ label, value, tone = "text-[#EFE9DC]" }: { label: string; value: string | number; tone?: string }) {
  return (
    <div className="bg-[#22262B] border border-[#3A4046] rounded-lg px-3 py-2">
      <p className={`text-sm font-extrabold tabular-nums ${tone}`}>{typeof value === "number" ? value.toLocaleString() : value}</p>
      <p className="text-[9px] font-bold uppercase tracking-wider text-[#8B93A7] mt-0.5">{label}</p>
    </div>
  );
}
