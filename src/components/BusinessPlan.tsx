import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RotateCcw } from "lucide-react";
import {
  DEFAULT_INPUTS,
  DETAIL_RIG_BUILD,
  INPUT_META,
  SCENARIOS,
  SERVICE_VAN_BUILD,
  cashRamp,
  profitRanges,
  runModel,
  type Evidence,
  type InputMeta,
  type Inputs,
  type ProfitRange,
  type Result,
  type ScalarKey,
} from "../lib/businessModel";

// ─── Business Plan — the operating model behind the service ────────────────
// Every number on this tab is computed by src/lib/businessModel.ts from the
// inputs under "Assumptions". Nothing here is typed in by hand.

const STORAGE_KEY = "maca_plan_inputs_v1";

type View = "overview" | "tiers" | "inventory" | "cash" | "assumptions";
const VIEWS: ReadonlyArray<readonly [View, string]> = [
  ["overview", "Overview"],
  ["tiers", "Tiers & pricing"],
  ["inventory", "Staff, fleet & materials"],
  ["cash", "Cash ramp"],
  ["assumptions", "Assumptions"],
];

const GROUP_ORDER = ["People", "Time", "Member fleet", "Included consumables", "À-la-carte", "Monthly fixed", "One-time"];
const BAR_POINTS = [10, 25, 40, 50, 67, 80, 100, 125, 150, 200];

const money = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const signed = (n: number) => (n < 0 ? "−" : "+") + money(Math.abs(n));
const hours = (n: number) => (Math.round(n * 10) / 10).toLocaleString("en-US") + " h";

const EVIDENCE_LABEL: Record<Evidence, string> = { verified: "Verified", reported: "Reported", assumption: "Assumption" };
const EVIDENCE_CLASS: Record<Evidence, string> = {
  verified: "border-[#6FAE8F] text-[#8FC7AA]",
  reported: "border-[#D9A441] text-[#E5B95C]",
  assumption: "border-[#8B93A7] text-[#C5CBBF]",
};

function EvidenceTag({ evidence }: { evidence: Evidence }) {
  return (
    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${EVIDENCE_CLASS[evidence]}`}>
      {EVIDENCE_LABEL[evidence]}
    </span>
  );
}

const cleanNumber = (v: unknown, fallback: number) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : fallback);

// Saved edits are restored on reload; anything malformed falls back to the default.
function loadInputs(): Inputs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_INPUTS;
    const saved = JSON.parse(raw) as Record<string, unknown>;
    const out = { ...DEFAULT_INPUTS } as Record<string, unknown>;
    for (const key of Object.keys(INPUT_META) as ScalarKey[]) out[key] = cleanNumber(saved[key], DEFAULT_INPUTS[key]);
    if (Array.isArray(saved.tiers) && saved.tiers.length === DEFAULT_INPUTS.tiers.length) {
      out.tiers = DEFAULT_INPUTS.tiers.map((t, k) => {
        const s = (saved.tiers as Record<string, unknown>[])[k] ?? {};
        return {
          ...t,
          price: cleanNumber(s.price, t.price),
          visitsPerMonth: cleanNumber(s.visitsPerMonth, t.visitsPerMonth),
          detailsPerMonth: cleanNumber(s.detailsPerMonth, t.detailsPerMonth),
          sharePct: cleanNumber(s.sharePct, t.sharePct),
        };
      });
    }
    out.alaCarte = DEFAULT_INPUTS.alaCarte; // not editable, so never restore an older shape
    return out as unknown as Inputs;
  } catch {
    return DEFAULT_INPUTS;
  }
}

/** Adjacent profitable ranges are joined so the sentence reads naturally. */
function mergedRanges(ranges: ProfitRange[]): ProfitRange[] {
  const out: ProfitRange[] = [];
  for (const g of ranges) {
    const last = out[out.length - 1];
    if (last && last.to === g.from - 1) last.to = g.to;
    else out.push({ ...g });
  }
  return out;
}

export function BusinessPlan() {
  const [inp, setInp] = useState<Inputs>(loadInputs);
  const [members, setMembers] = useState(50);
  const [view, setView] = useState<View>("overview");
  const [rampMonths, setRampMonths] = useState(12);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inp));
    } catch {
      /* storage unavailable: edits last for the session */
    }
  }, [inp]);

  const r = useMemo(() => runModel(inp, members), [inp, members]);
  const ranges = useMemo(() => mergedRanges(profitRanges(inp, 200)), [inp]);
  const scenarios = useMemo(() => SCENARIOS.map((s) => ({ name: s.name, r: runModel(s.apply(inp), members) })), [inp, members]);
  const ramp = useMemo(() => cashRamp(inp, rampMonths, members), [inp, rampMonths, members]);
  const rampSpeed = useMemo(() => {
    const half = Math.max(1, Math.round(rampMonths / 2));
    return { half, faster: cashRamp(inp, half, members), slower: cashRamp(inp, rampMonths * 2, members) };
  }, [inp, rampMonths, members]);
  const leadPayPerMonth = inp.leadTechWage * (1 + inp.payrollLoadPct / 100) * inp.paidHoursPerFte;

  // First member count past today's that needs another technician.
  const nextTech = useMemo(() => {
    for (let n = members + 1; n <= 400; n++) {
      if (runModel(inp, n).techs > r.techs) return n;
    }
    return null;
  }, [inp, members, r.techs]);

  const setScalar = (key: ScalarKey, value: number) => setInp((p) => ({ ...p, [key]: value }));
  const setTier = (index: number, patch: Partial<Inputs["tiers"][number]>) =>
    setInp((p) => ({ ...p, tiers: p.tiers.map((t, k) => (k === index ? { ...t, ...patch } : t)) }));

  const tabs = (
    <div className="mt-4 flex gap-1 overflow-x-auto whitespace-nowrap" aria-label="Business plan sections" role="group">
      {VIEWS.map(([id, label]) => (
        <button
          key={id}
          type="button"
          aria-pressed={view === id}
          onClick={() => setView(id)}
          className={`min-h-11 rounded-lg px-3.5 text-xs font-bold uppercase tracking-wider transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B08D57] ${
            view === id ? "bg-[#B08D57] text-[#241C10]" : "text-[#B8C0B4] hover:bg-[#22262B] hover:text-[#EFE9DC]"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-[#3A4046] bg-[#181C20] p-5 shadow-xl">
        <p className="text-[11px] font-bold uppercase tracking-widest text-[#C5A06C]">Business plan</p>
        <h2 className="font-display mt-1 text-xl font-extrabold text-[#EFE9DC]">What it takes to run the service, member by member.</h2>
        <p className="mt-1 max-w-3xl text-xs leading-relaxed text-[#B8C0B4]">
          Every figure here is computed from the inputs in the Assumptions tab, and each input says where it comes from.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <label htmlFor="plan-members" className="text-xs font-bold text-[#B8C0B4]">
            Members
          </label>
          <input
            id="plan-members"
            type="range"
            min={0}
            max={200}
            value={members}
            onChange={(e) => setMembers(Number(e.target.value))}
            className="h-11 min-w-[220px] flex-1 cursor-pointer accent-[#B08D57]"
          />
          <span className="font-display w-16 text-right text-2xl font-extrabold tabular-nums text-[#C5A06C]">{members}</span>
        </div>
        {tabs}
      </div>

      {view === "overview" && (
        <>
          <Card className="border-[#4A5548] shadow-sm">
            <CardContent className="grid grid-cols-2 gap-2 p-5 sm:grid-cols-3 xl:grid-cols-6">
              <Cell label="Revenue / month" value={money(r.revenue.total)} />
              <Cell label="Costs / month" value={money(r.costs.total)} />
              <Cell
                label="Profit before owner pay"
                value={signed(r.profit)}
                tone={r.profit >= 0 ? "text-[#6FAE8F]" : "text-[#C96A5B]"}
              />
              <Cell label="Technicians" value={`${r.techs} · ${Math.round(r.techUtilizationPct)}% busy`} />
              <Cell label="Visits / month" value={String(Math.round(r.visitsPerMonth))} />
              <Cell label="Members per technician" value={r.membersPerTech ? String(Math.round(r.membersPerTech)) : "—"} />
            </CardContent>
          </Card>

          <Card className="border-[#4A5548] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-[#EFE9DC]">Profit as members grow</CardTitle>
              <CardDescription className="text-xs">
                Monthly profit before owner pay. A second technician comes on when the first runs out of hours, and that step is what
                dips the line.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfitBars inp={inp} members={members} />
              <p className="mt-3 text-xs text-[#DCD8CC]">
                {ranges.length
                  ? `In profit at ${ranges.map((g) => (g.from === g.to ? `${g.from}` : g.to >= 200 ? `${g.from} and up` : `${g.from}–${g.to}`)).join(", ")} members.`
                  : "Not in profit at any size up to 200 members."}
              </p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card className="border-[#4A5548] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-[#EFE9DC]">Where the money comes from</CardTitle>
              </CardHeader>
              <CardContent>
                <Lines
                  rows={[
                    ["Memberships", r.revenue.memberships],
                    ["À-la-carte work", r.revenue.alaCarte],
                    ["Other repairs", r.revenue.other],
                  ]}
                  total={["Revenue", r.revenue.total]}
                />
              </CardContent>
            </Card>
            <Card className="border-[#4A5548] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold text-[#EFE9DC]">Where it goes</CardTitle>
              </CardHeader>
              <CardContent>
                <Lines
                  rows={[
                    ["Technician pay", r.costs.payrollTech],
                    ["Detailer pay", r.costs.payrollDetailer],
                    ["Workers' comp", r.costs.workersComp],
                    ["Vehicles: lease, fuel, upkeep", r.costs.vehicles],
                    ["Insurance", r.costs.insurance],
                    ["Overhead", r.costs.opex],
                    ["Included materials", r.costs.materialsCovered],
                    ["Parts for billed work", r.costs.materialsAlaCarte],
                    ["Cost of other repairs", r.costs.otherAlaCarte],
                  ]}
                  total={["Costs", r.costs.total]}
                />
              </CardContent>
            </Card>
          </div>

          <Card className="border-[#4A5548] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-[#EFE9DC]">What moves the answer most</CardTitle>
              <CardDescription className="text-xs">The same month at {members} members, with one input changed.</CardDescription>
            </CardHeader>
            <CardContent>
              <Sensitivity rows={scenarios} base={r} />
            </CardContent>
          </Card>

          <Card className="border-[#4A5548] shadow-sm">
            <CardContent className="space-y-2 p-5 text-xs leading-relaxed text-[#DCD8CC]">
              <p className="font-bold text-[#EFE9DC]">Read this before trusting any figure</p>
              <p>
                {r.ownerDraw > 0
                  ? `Profit is after ${money(r.ownerDraw)} a month of owner pay.`
                  : "Profit is before any pay for the owner running dispatch. At 0, the owner works for free."}
              </p>
              <p>
                Pay is a step: {r.techs} technician{r.techs > 1 ? "s are" : " is"} on the payroll
                {nextTech ? `, and another is needed from ${nextTech} members` : ""} at {hours(r.hoursPerMember)} per member per month.
              </p>
              <p>
                No figure for visit length, tier mix or à-la-carte demand has been measured on real jobs. Treat the result as a range to
                confirm with a small paid pilot, not a forecast.
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {view === "tiers" && (
        <>
          <Card className="border-[#4A5548] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-[#EFE9DC]">Tier economics</CardTitle>
              <CardDescription className="text-xs">
                Per member per month, at {members} members. Labor is charged at the average loaded technician cost per billable hour.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-xs">
                <caption className="sr-only">Revenue, direct cost and margin for each membership tier</caption>
                <thead>
                  <tr className="border-b border-[#4A5548] text-left text-[#8B93A7]">
                    <Th>Tier</Th>
                    <Th right>Share</Th>
                    <Th right>Visits / mo</Th>
                    <Th right>Details / mo</Th>
                    <Th right>Price</Th>
                    <Th right>Labor</Th>
                    <Th right>Materials</Th>
                    <Th right>Direct cost</Th>
                    <Th right>Contribution</Th>
                    <Th right>Margin</Th>
                    <Th right>Price for 50%</Th>
                  </tr>
                </thead>
                <tbody>
                  {r.tiers.map((t) => (
                    <tr key={t.name} className="border-b border-[#3A4046]">
                      <th scope="row" className="py-2 pr-3 text-left font-bold text-[#EFE9DC]">
                        {t.name}
                      </th>
                      <Td right>{Math.round(t.sharePct)}%</Td>
                      <Td right>{hours(t.visitsPerMonth).replace(" h", "")}</Td>
                      <Td right>{t.detailsPerMonth.toFixed(2).replace(/\.?0+$/, "")}</Td>
                      <Td right strong>
                        {money(t.price)}
                      </Td>
                      <Td right>{money(t.labor)}</Td>
                      <Td right>{money(t.materials)}</Td>
                      <Td right>{money(t.direct)}</Td>
                      <Td right tone={t.contribution >= 0 ? "text-[#6FAE8F]" : "text-[#C96A5B]"}>
                        {signed(t.contribution)}
                      </Td>
                      <Td right>{Math.round(t.marginPct)}%</Td>
                      <Td right muted>
                        {money(t.priceAt50Margin)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card className="border-[#4A5548] shadow-sm">
            <CardContent className="space-y-2 p-5 text-xs leading-relaxed text-[#DCD8CC]">
              <p className="font-bold text-[#EFE9DC]">On the prices themselves</p>
              <ul className="list-disc space-y-1.5 pl-4">
                <li>
                  The prices are proposals. No published Miami mobile-maintenance membership was found to compare against. The closest
                  published price is YourMechanic's diagnostic fee, which starts at $130.
                </li>
                <li>
                  Privé carries the thinnest margin: two visits and a quarterly detail for {money(r.tiers[1]?.price ?? 0)}. At{" "}
                  {money(r.tiers[1]?.priceAt50Margin ?? 0)} its margin would be 50%.
                </li>
                <li>Change any price or benefit under Assumptions to see the effect here.</li>
              </ul>
            </CardContent>
          </Card>
        </>
      )}

      {view === "inventory" && (
        <>
          <Card className="border-[#4A5548] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-[#EFE9DC]">Staff and capacity at {members} members</CardTitle>
            </CardHeader>
            <CardContent>
              <Facts
                rows={[
                  ["Technicians", `${r.techs} · ${Math.round(r.techUtilizationPct)}% of hours booked`],
                  ["Technician pay", r.techs > 0 ? `${money(r.costs.payrollTech)} a month` : "—"],
                  ["Detailer", `${hours(r.detailerPaidHours)} of pay a month`],
                  ["Hours not covered by memberships", `${hours(r.idleTechHours)} a month`],
                ]}
              />
                            <ul className="mt-3 list-disc space-y-1.5 pl-4 text-xs leading-relaxed text-[#DCD8CC]">
                <li>
                  {r.techs > 0
                    ? nextTech
                      ? `The next technician is needed from ${nextTech} members.`
                      : "No further technician is needed up to 400 members."
                    : "No technicians are needed with no members."}
                </li>
                <li>
                  {r.idleTechHours > 0
                    ? `About ${hours(r.idleTechHours)} a month are not covered by memberships. Non-member work sold into those hours costs materials only.`
                    : "Memberships use every technician hour. Extra work will mean longer waits or another technician."}
                </li>
                <li>
                  Headcount including the owner is {r.headcountIncludingOwner}. Florida requires workers' comp at four or more, so it is{" "}
                  {r.workersCompRequired ? "required" : "not required"} at this size.
                  {r.workersCompRequired ? ` Modeled at ${money(r.costs.workersComp)} a month.` : ""}
                </li>
                <li>The owner runs dispatch from this console: {r.ownerDraw > 0 ? `${money(r.ownerDraw)} a month` : "unpaid in this model"}.</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-[#4A5548] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-[#EFE9DC]">Fleet and tools</CardTitle>
              <CardDescription className="text-xs">The detailer needs their own vehicle, so it is counted separately.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <div>
                <p className="text-xs font-bold text-[#EFE9DC]">
                  {r.serviceVans} service van{r.serviceVans === 1 ? "" : "s"} · {money(inp.serviceVanLease)} lease + {money(inp.vehicleFuelMaint)}{" "}
                  fuel and upkeep each
                </p>
                <BuildList items={SERVICE_VAN_BUILD} total={inp.serviceVanTools} />
              </div>
              <div>
                <p className="text-xs font-bold text-[#EFE9DC]">
                  {r.detailRigs} detailing rig{r.detailRigs === 1 ? "" : "s"} · {money(inp.detailRigLease)} lease + {money(inp.vehicleFuelMaint)}{" "}
                  fuel and upkeep each
                </p>
                <BuildList items={DETAIL_RIG_BUILD} total={inp.detailRigUpfit} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-[#4A5548] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-[#EFE9DC]">Materials to keep on hand</CardTitle>
              <CardDescription className="text-xs">
                Usage follows the member fleet: {Math.round(r.fleetVehicles)} vehicles, {Math.round(r.iceVehicles)} of them not electric.{" "}
                {money(r.stockValue)} of stock covers {inp.weeksOfStock} weeks.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-xs">
                <caption className="sr-only">Monthly material usage, cost and stock to keep for each item</caption>
                <thead>
                  <tr className="border-b border-[#4A5548] text-left text-[#8B93A7]">
                    <Th>Item</Th>
                    <Th right>Used / mo</Th>
                    <Th right>Our cost</Th>
                    <Th right>Cost / mo</Th>
                    <Th right>Keep on hand</Th>
                    <Th>Paid by</Th>
                    <Th>Source</Th>
                  </tr>
                </thead>
                <tbody>
                  {r.materials.map((m) => (
                    <tr key={m.key} className="border-b border-[#3A4046]">
                      <th scope="row" className="py-1.5 pr-3 text-left font-normal text-[#DCD8CC]">
                        {m.name}
                      </th>
                      <Td right>{m.perMonth.toFixed(1)} {m.unit}</Td>
                      <Td right muted>
                        {money(m.unitCost)}
                      </Td>
                      <Td right>{money(m.monthlyCost)}</Td>
                      <Td right muted>
                        {((m.perMonth * inp.weeksOfStock) / (52 / 12)).toFixed(1)} {m.unit}
                      </Td>
                      <Td>{m.billed ? "Member, à-la-carte" : "Membership"}</Td>
                      <Td>
                        <EvidenceTag evidence={m.evidence} />
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card className="border-[#4A5548] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-[#EFE9DC]">À-la-carte work</CardTitle>
              <CardDescription className="text-xs">
                Replacement items only. Repairs beyond these are not counted unless "Other repairs per member" is set above zero.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[860px] text-xs">
                <caption className="sr-only">À-la-carte jobs per month, price and revenue</caption>
                <thead>
                  <tr className="border-b border-[#4A5548] text-left text-[#8B93A7]">
                    <Th>Job</Th>
                    <Th right>Jobs / mo</Th>
                    <Th right>Price</Th>
                    <Th right>Revenue / mo</Th>
                    <Th right>Technician time</Th>
                    <Th>Basis</Th>
                  </tr>
                </thead>
                <tbody>
                  {r.alaCarteRows.map((a) => (
                    <tr key={a.item.name} className="border-b border-[#3A4046]">
                      <th scope="row" className="py-1.5 pr-3 text-left font-normal text-[#DCD8CC]">
                        {a.item.name}
                      </th>
                      <Td right>{a.jobsPerMonth.toFixed(2)}</Td>
                      <Td right strong>
                        {money(a.pricePerJob)}
                      </Td>
                      <Td right>{money(a.revenuePerMonth)}</Td>
                      <Td right>{hours(a.hoursPerMonth)}</Td>
                      <Td muted>{a.item.basis}</Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card className="border-[#4A5548] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-[#EFE9DC]">Logistics</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs leading-relaxed text-[#DCD8CC]">
              <p>
                Proposed zones: Brickell and Downtown · South Beach · Coral Gables and Coconut Grove · Wynwood, Edgewater and the Design
                District · Fisher Island and Key Biscayne by arrangement. This is a starting list, not a validated plan.
              </p>
              <p>
                Each building decides whether a technician may work in its garage. Associations commonly ask for a certificate of
                insurance before a vendor starts, and some restrict vehicle maintenance on the premises. Access has to be arranged
                building by building.
              </p>
              <p>
                Parts are carried on the vans and restocked from the storage unit ({money(inp.storage)} a month) every{" "}
                {inp.weeksOfStock} weeks.
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {view === "cash" && (
        <Card className="border-[#4A5548] shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-[#EFE9DC]">Cash to get to {members} members</CardTitle>
            <CardDescription className="text-xs">
              Members grow evenly from zero. Staff and vehicles come on as the model needs them, and one-time spending is counted when
              each vehicle is set up.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <label htmlFor="plan-ramp-months" className="text-xs font-bold text-[#B8C0B4]">
                Months to get there
              </label>
              <input
                id="plan-ramp-months"
                type="number"
                min={1}
                max={36}
                value={rampMonths}
                onChange={(e) => setRampMonths(Math.min(36, Math.max(1, Math.round(Number(e.target.value) || 1))))}
                className="h-11 w-24 rounded-lg border border-[#3A4046] bg-[#181C20] px-3 text-sm tabular-nums text-[#EFE9DC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B08D57]"
              />
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Cell label="Most cash needed" value={money(ramp.peakNeed)} tone="text-[#E5B95C]" />
              <Cell label="Running total at the end" value={signed(ramp.rows[ramp.rows.length - 1]?.cumulative ?? 0)} tone="text-[#EFE9DC]" />
              <Cell label="One-time spending" value={money(inp.startupCosts + ramp.rows.reduce((s, x) => s + x.capex, 0))} />
            </div>
            <div className="max-h-[420px] overflow-auto">
              <table className="w-full text-xs">
                <caption className="sr-only">Month by month members, profit, one-time spending and running total</caption>
                <thead>
                  <tr className="border-b border-[#4A5548] text-left text-[#8B93A7]">
                    <Th>Month</Th>
                    <Th right>Members</Th>
                    <Th right>Monthly profit</Th>
                    <Th right>One-time spend</Th>
                    <Th right>Running total</Th>
                  </tr>
                </thead>
                <tbody>
                  {ramp.rows.map((x) => (
                    <tr key={x.month} className="border-b border-[#3A4046]">
                      <th scope="row" className="py-1.5 pr-3 text-left font-normal text-[#DCD8CC]">
                        {x.month}
                      </th>
                      <Td right>{x.members}</Td>
                      <Td right tone={x.profit >= 0 ? "text-[#6FAE8F]" : "text-[#C96A5B]"}>
                        {signed(x.profit)}
                      </Td>
                      <Td right muted>
                        {x.capex ? money(x.capex) : "—"}
                      </Td>
                      <Td right tone={x.cumulative >= 0 ? "text-[#6FAE8F]" : "text-[#EFE9DC]"}>
                        {signed(x.cumulative)}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs leading-relaxed text-[#8B93A7]">
              {rampSpeed.half < rampMonths
                ? `Getting there in half the time would need at most ${money(rampSpeed.faster.peakNeed)}. `
                : ""}
              Taking twice as long would need at most {money(rampSpeed.slower.peakNeed)}. An owner who works the first van instead of
              hiring saves about {money(leadPayPerMonth)} a month in wages while there is one technician, and goes unpaid for that work.
            </p>
          </CardContent>
        </Card>
      )}

      {view === "assumptions" && (
        <>
          <Card className="border-[#4A5548] shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold text-[#EFE9DC]">Membership tiers</CardTitle>
              <CardDescription className="text-xs">Shares are scaled to 100%, so they do not have to add up exactly.</CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-xs">
                <caption className="sr-only">Editable prices, visits, details and share for each tier</caption>
                <thead>
                  <tr className="border-b border-[#4A5548] text-left text-[#8B93A7]">
                    <Th>Tier</Th>
                    <Th right>Price / mo</Th>
                    <Th right>Visits / mo</Th>
                    <Th right>Details / mo</Th>
                    <Th right>Share %</Th>
                  </tr>
                </thead>
                <tbody>
                  {inp.tiers.map((t, k) => (
                    <tr key={t.name} className="border-b border-[#3A4046]">
                      <th scope="row" className="py-2 pr-3 text-left font-bold text-[#EFE9DC]">
                        {t.name}
                      </th>
                      {(
                        [
                          ["price", "$", 1],
                          ["visitsPerMonth", "", 0.25],
                          ["detailsPerMonth", "", 0.25],
                          ["sharePct", "", 1],
                        ] as const
                      ).map(([field, unit, step]) => (
                        <td key={field} className="px-1.5 py-1.5 text-right">
                          <label className="sr-only" htmlFor={`plan-tier-${k}-${field}`}>
                            {t.name} {field === "price" ? "price per month" : field === "visitsPerMonth" ? "visits per month" : field === "detailsPerMonth" ? "details per month" : "share"}
                          </label>
                          <input
                            id={`plan-tier-${k}-${field}`}
                            type="number"
                            min={0}
                            step={step}
                            value={Number(t[field].toFixed(2))}
                            onChange={(e) => setTier(k, { [field]: Math.max(0, Number(e.target.value) || 0) } as Partial<Inputs["tiers"][number]>)}
                            className="h-11 w-24 rounded-lg border border-[#3A4046] bg-[#181C20] px-2 text-right tabular-nums text-[#EFE9DC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B08D57]"
                          />
                          {unit ? <span className="ml-1 text-[#8B93A7]">{unit}</span> : null}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          <Card className="border-[#4A5548] shadow-sm">
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 pb-2">
              <div className="space-y-1.5">
                <CardTitle className="text-sm font-bold text-[#EFE9DC]">Everything else</CardTitle>
                <CardDescription className="text-xs">
                  <span className="text-[#8FC7AA]">Verified</span> is from a primary source that was opened.{" "}
                  <span className="text-[#E5B95C]">Reported</span> appears in widely published secondary sources.{" "}
                  <span className="text-[#C5CBBF]">Assumption</span> is an estimate.
                </CardDescription>
              </div>
              <Button
                type="button"
                variant="outline"
                className="h-11 gap-1.5 border-[#4A5548] text-xs font-bold text-[#EFE9DC]"
                onClick={() => setInp(DEFAULT_INPUTS)}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset to defaults
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {GROUP_ORDER.map((group) => (
                <div key={group}>
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-widest text-[#C5A06C]">{group}</p>
                  <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2 2xl:grid-cols-3">
                    {(Object.keys(INPUT_META) as ScalarKey[])
                      .filter((key) => INPUT_META[key].group === group)
                      .map((key) => (
                        <Field
                          key={key}
                          id={`plan-${key}`}
                          meta={INPUT_META[key]}
                          value={inp[key]}
                          onChange={(n) => setScalar(key, n)}
                        />
                      ))}
                  </div>
                </div>
              ))}
              <p className="text-xs leading-relaxed text-[#8B93A7]">
                Your edits are saved in this browser only. The full plan, with sources and what is still unverified, is BUSINESS-PLAN.md
                in the repository.
              </p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Cell({ label, value, tone = "text-[#EFE9DC]" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-[#3A4046] bg-[#22262B] px-3 py-2.5">
      <p className={`text-sm font-extrabold tabular-nums ${tone}`}>{value}</p>
      <p className="mt-0.5 text-[11px] font-bold uppercase tracking-wider text-[#8B93A7]">{label}</p>
    </div>
  );
}

function Lines({ rows, total }: { rows: Array<[string, number]>; total?: [string, number] }) {
  const show = (n: number) => money(n);
  return (
    <table className="w-full text-xs">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label} className="border-b border-[#3A4046]">
            <th scope="row" className="py-1.5 pr-3 text-left font-normal text-[#DCD8CC]">
              {label}
            </th>
            <td className="py-1.5 text-right tabular-nums text-[#EFE9DC]">{show(value)}</td>
          </tr>
        ))}
        {total ? (
          <tr>
            <th scope="row" className="py-2 pr-3 text-left font-bold text-[#EFE9DC]">
              {total[0]}
            </th>
            <td className="py-2 text-right font-extrabold tabular-nums text-[#C5A06C]">{money(total[1])}</td>
          </tr>
        ) : null}
      </tbody>
    </table>
  );
}

function Facts({ rows }: { rows: Array<[string, string]> }) {
  return (
    <table className="w-full text-xs">
      <tbody>
        {rows.map(([label, value]) => (
          <tr key={label} className="border-b border-[#3A4046]">
            <th scope="row" className="py-1.5 pr-3 text-left font-normal text-[#DCD8CC]">
              {label}
            </th>
            <td className="py-1.5 text-right font-bold tabular-nums text-[#EFE9DC]">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ProfitBars({ inp, members }: { inp: Inputs; members: number }) {
  const points = Array.from(new Set([...BAR_POINTS, members])).sort((a, b) => a - b);
  const rows = points.map((n) => ({ n, r: runModel(inp, n) }));
  const max = Math.max(1, ...rows.map((x) => Math.abs(x.r.profit)));
  return (
    <table className="w-full text-xs">
      <caption className="sr-only">Monthly profit before owner pay at different member counts</caption>
      <thead>
        <tr className="border-b border-[#4A5548] text-left text-[#8B93A7]">
          <Th>Members</Th>
          <Th />
          <Th right>Profit / mo</Th>
          <Th right>Technicians</Th>
        </tr>
      </thead>
      <tbody>
        {rows.map(({ n, r }) => {
          const width = `${(Math.abs(r.profit) / max) * 100}%`;
          const neg = r.profit < 0;
          return (
            <tr key={n} className={`${n === members ? "bg-[#181C20]" : ""} border-b border-[#3A4046]`}>
              <th scope="row" className={`w-24 py-1.5 pr-3 text-left tabular-nums ${n === members ? "font-bold text-[#C5A06C]" : "font-normal text-[#DCD8CC]"}`}>
                {n}
                {n === members ? " (now)" : ""}
              </th>
              <td>
                <div aria-hidden="true" className="flex h-4 items-center border-r border-[#3A4046]">
                  <div className="flex w-1/2 justify-end border-r border-[#4A5548]">
                    <div className={neg ? "h-3 rounded-l bg-[#C96A5B]" : ""} style={neg ? { width } : undefined} />
                  </div>
                  <div className="w-1/2">
                    <div className={!neg ? "h-3 rounded-r bg-[#6FAE8F]" : ""} style={!neg ? { width } : undefined} />
                  </div>
                </div>
              </td>
              <Td right tone={neg ? "text-[#C96A5B]" : "text-[#6FAE8F]"}>
                {signed(r.profit)}
              </Td>
              <Td right muted>
                {r.techs}
              </Td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Sensitivity({ rows, base }: { rows: Array<{ name: string; r: Result }>; base: Result }) {
  const body = [{ name: "As entered", r: base, delta: 0 }, ...rows.map((x) => ({ ...x, delta: x.r.profit - base.profit }))];
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[620px] text-xs">
        <caption className="sr-only">Profit at the current member count under each changed assumption</caption>
        <thead>
          <tr className="border-b border-[#4A5548] text-left text-[#8B93A7]">
            <Th>Change</Th>
            <Th right>Profit / mo</Th>
            <Th right>Difference</Th>
            <Th right>Technicians</Th>
            <Th right>Hours booked</Th>
          </tr>
        </thead>
        <tbody>
          {body.map((x, k) => (
            <tr key={x.name} className="border-b border-[#3A4046]">
              <th scope="row" className={`py-1.5 pr-3 text-left ${k === 0 ? "font-bold text-[#EFE9DC]" : "font-normal text-[#DCD8CC]"}`}>
                {x.name}
              </th>
              <Td right tone={x.r.profit < 0 ? "text-[#C96A5B]" : "text-[#6FAE8F]"}>
                {signed(x.r.profit)}
              </Td>
              <Td right tone={x.delta === 0 ? undefined : x.delta < 0 ? "text-[#C96A5B]" : "text-[#6FAE8F]"}>
                {x.delta === 0 ? "—" : signed(x.delta)}
              </Td>
              <Td right>{x.r.techs}</Td>
              <Td right muted>
                {Math.round(x.r.techUtilizationPct)}%
              </Td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function BuildList({ items, total }: { items: ReadonlyArray<readonly [string, number]>; total: number }) {
  const listed = items.reduce((s, [, v]) => s + v, 0);
  const matches = listed === total;
  return (
    <div>
      <ul className="mt-2 text-xs">
        {items.map(([name, cost]) => (
          <li key={name} className="flex justify-between border-b border-[#3A4046] py-1">
            <span className="text-[#DCD8CC]">{name}</span>
            <span className="tabular-nums text-[#B8C0B4]">{money(cost)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[11px] leading-snug text-[#8B93A7]">
        {matches
          ? `Default build, ${money(listed)} per vehicle. Prices were not checked with suppliers.`
          : `Default build listed at ${money(listed)}; the figure in use is ${money(total)}.`}
      </p>
    </div>
  );
}

function Field({ id, meta, value, onChange }: { id: string; meta: InputMeta; value: number; onChange: (n: number) => void }) {
  // Keep the typed text while the field is focused so decimals and clears behave normally.
  const [draft, setDraft] = useState(String(value));
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (document.activeElement !== ref.current) setDraft(String(value));
  }, [value]);

  return (
    <div>
      <div className="flex items-start justify-between gap-2">
        <label htmlFor={id} className="text-xs font-bold leading-snug text-[#DCD8CC]">
          {meta.label}
        </label>
        <EvidenceTag evidence={meta.evidence} />
      </div>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          ref={ref}
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          step={meta.step}
          value={draft}
          onChange={(e) => {
            const v = e.target.value;
            setDraft(v);
            if (v.trim() !== "" && Number.isFinite(Number(v))) onChange(Math.max(0, Number(v)));
          }}
          aria-describedby={meta.note ? `${id}-note` : undefined}
          className="h-11 w-32 rounded-lg border border-[#3A4046] bg-[#181C20] px-3 text-sm tabular-nums text-[#EFE9DC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B08D57]"
        />
        <span className="text-xs text-[#8B93A7]">{meta.unit}</span>
      </div>
      {meta.note ? (
        <p id={`${id}-note`} className="mt-1 text-[11px] leading-snug text-[#8B93A7]">
          {meta.note}
        </p>
      ) : null}
    </div>
  );
}

function Th({ children, right }: { children?: ReactNode; right?: boolean }) {
  return <th scope="col" className={`whitespace-nowrap py-1.5 font-bold first:pl-0 last:pr-0 ${right ? "pl-3 pr-3 text-right" : "pr-3 text-left"}`}>{children}</th>;
}

function Td({ children, right, tone, muted, strong }: { children?: ReactNode; right?: boolean; tone?: string; muted?: boolean; strong?: boolean }) {
  return (
    <td className={`py-1.5 tabular-nums first:pl-0 last:pr-0 ${right ? "whitespace-nowrap pl-3 pr-3 text-right" : "pr-3 text-left"} ${strong ? "font-bold" : ""} ${tone ?? (muted ? "text-[#8B93A7]" : "text-[#EFE9DC]")}`}>
      {children}
    </td>
  );
}
