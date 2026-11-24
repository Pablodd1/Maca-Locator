// Arithmetic checks for the operating model behind Mission Control → Business
// Plan. Run with `npm test`. Exit code is non-zero on any failure.
import { DEFAULT_INPUTS, DETAIL_RIG_BUILD, SERVICE_VAN_BUILD, breakevenMembers, cashRamp, profitRanges, runModel, SCENARIOS, type Inputs } from "../src/lib/businessModel.ts";

let failed = 0;
function check(name: string, ok: boolean, detail = "") {
  if (!ok) {
    failed++;
    console.log(`FAIL  ${name}${detail ? "  —  " + detail : ""}`);
  }
}
const near = (a: number, b: number, tol = 1e-6) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(a), Math.abs(b));

const i = DEFAULT_INPUTS;
const samples = [1, 2, 10, 37, 50, 66, 67, 73, 75, 100, 133, 200];

for (const n of samples) {
  const r = runModel(i, n);
  check(`revenue parts add up at ${n}`, near(r.revenue.total, r.revenue.memberships + r.revenue.alaCarte + r.revenue.other));
  check(`cost parts add up at ${n}`, near(r.costs.total, r.costs.payrollTech + r.costs.payrollDetailer + r.costs.workersComp + r.costs.vehicles + r.costs.insurance + r.costs.opex + r.costs.materialsCovered + r.costs.materialsAlaCarte + r.costs.otherAlaCarte));
  check(`profit identity at ${n}`, near(r.profit, r.revenue.total - r.costs.total - r.ownerDraw));
  check(`tier shares total 100 at ${n}`, near(r.tiers.reduce((s, t) => s + t.sharePct, 0), 100));
  check(`tier members total ${n}`, near(r.tiers.reduce((s, t) => s + t.members, 0), n));
  check(`tier revenue equals MRR at ${n}`, near(r.tiers.reduce((s, t) => s + t.members * t.price, 0), r.revenue.memberships));
  check(`tech hours at ${n}`, near(r.techHours, r.visitsPerMonth * i.hoursPerVisit + r.alaCarteRows.reduce((s, a) => s + a.hoursPerMonth, 0)));
  const productive = (i.paidHoursPerFte * i.utilizationPct) / 100;
  check(`technician count at ${n}`, r.techs === Math.max(1, Math.ceil(r.techHours / productive - 1e-9)));
  check(`idle hours at ${n}`, near(r.idleTechHours, r.techCapacityHours - r.techHours) && r.idleTechHours >= 0);
  check(`workers comp rule at ${n}`, r.workersCompRequired === (r.headcountIncludingOwner >= 4 && r.costs.payrollTech + r.costs.payrollDetailer > 0));
  check(`covered materials sum at ${n}`, near(r.costs.materialsCovered, r.materials.filter((m) => !m.billed).reduce((s, m) => s + m.monthlyCost, 0)));
  check(`billed materials sum at ${n}`, near(r.costs.materialsAlaCarte, r.materials.filter((m) => m.billed).reduce((s, m) => s + m.monthlyCost, 0)));
  check(`oil quantity at ${n}`, near(r.materials.find((m) => m.key === "oil")!.perMonth, (r.iceVehicles * i.milesPerVehicleYear) / i.oilChangeMiles / 12 * i.quartsPerOilChange));
  const finite = { profit: r.profit, profitBeforeOwner: r.profitBeforeOwner, costsTotal: r.costs.total, revenueTotal: r.revenue.total, stockValue: r.stockValue, membersPerTech: r.membersPerTech };
  for (const [key, value] of Object.entries(finite)) check(`finite ${key} at ${n}`, Number.isFinite(value));}

// Revenue and materials scale in a straight line with members; payroll only steps up.
const a = runModel(i, 30);
const b = runModel(i, 70);
const c = runModel(i, 100);
check("revenue is linear in members", near(a.revenue.total + b.revenue.total, c.revenue.total));
check("materials are linear in members", near(a.costs.materialsCovered + b.costs.materialsCovered, c.costs.materialsCovered));
check("technician payroll never falls as members grow", runModel(i, 150).costs.payrollTech >= c.costs.payrollTech && c.costs.payrollTech >= a.costs.payrollTech);

// Owner pay comes straight out of profit.
const paid = runModel({ ...i, ownerMonthlyDraw: 4000 }, 50);
check("owner pay reduces profit one for one", near(paid.profit, runModel(i, 50).profit - 4000));

// Tier shares that do not add to 100 are normalized, not dropped.
const odd = runModel({ ...i, tiers: i.tiers.map((t, k) => ({ ...t, sharePct: [50, 50, 0][k] })) }, 60);
check("odd tier mix normalizes", near(odd.tiers[0].members, 30) && near(odd.tiers[1].members, 30) && near(odd.tiers[2].members, 0));

// Breakeven and profitable ranges.
const be = breakevenMembers(i);
const ranges = profitRanges(i);
if (be !== null) {
  check("breakeven month is profitable", runModel(i, be).profit >= 0);
  check("member before breakeven is not", be === 1 || runModel(i, be - 1).profit < 0);
}
for (let k = 0; k < ranges.length; k++) {
  const g = ranges[k];
  check(`range ${k} starts in profit`, runModel(i, g.from).profit >= 0 && runModel(i, g.to).profit >= 0);
  if (k > 0) check(`range ${k} follows the previous one`, g.from === ranges[k - 1].to + 1 || g.from > ranges[k - 1].to);
  if (g.from > 1 && (k === 0 || g.from !== ranges[k - 1].to + 1)) check(`member before range ${k} is not profitable`, runModel(i, g.from - 1).profit < 0);
}

// Cash ramp.
const ramp = cashRamp(i, 12, 75);
check("ramp has one row per month", ramp.rows.length === 12);
check("ramp ends at the target member count", ramp.rows[11].members === 75);
check("ramp cumulative adds up", near(ramp.rows[11].cumulative, -i.startupCosts + ramp.rows.reduce((s, x) => s + x.profit - x.capex, 0)));
check("peak need covers start-up spending", ramp.peakNeed >= i.startupCosts);

// Scenarios.
const base = runModel(i, 50);
for (const s of SCENARIOS) {
  const r = runModel(s.apply(i), 50);
  check(`scenario "${s.name}" gives finite numbers`, Number.isFinite(r.profit) && r.profit === r.profit);
}
const none = SCENARIOS.find((s) => s.name === "Visits take 40% longer")!.apply(i);
check("longer visits need at least as many technician hours", runModel(none, 50).techHours >= base.techHours);

// No members, no cost, no division errors.
const zero = runModel(i, 0);
// With no members the vans and staff are gone but insurance and overhead are still being paid.
check("zero members: no revenue, no staff, fixed overhead only", near(zero.revenue.total, 0) && zero.techs === 0 && zero.detailers === 0 && near(zero.costs.total, i.insuranceBase + i.software + i.marketing + i.adminMisc + i.storage));

// Extreme inputs must not produce Infinity or NaN.
const edges: Array<[string, Inputs]> = [
  ["no billable hours", { ...i, utilizationPct: 0 }],
  ["zero mileages", { ...i, milesPerVehicleYear: 0, oilChangeMiles: 0, cabinFilterMiles: 0, engineFilterMiles: 0 }],
  ["all tier shares zero", { ...i, tiers: i.tiers.map((t) => ({ ...t, sharePct: 0 })) }],
  ["no à-la-carte items", { ...i, alaCarte: [] }],
];
for (const [name, input] of edges) {
  for (const n of [1, 50]) {
    const r = runModel(input, n);
    const values = [r.profit, r.costs.total, r.revenue.total, r.techs, r.stockValue, r.membersPerTech];
    check(`finite under "${name}" at ${n}`, values.every((v) => Number.isFinite(v)));
  }
}

// The itemized tool lists add up to the default one-time figures.
const sum = (list: ReadonlyArray<readonly [string, number]>) => list.reduce((s, [, v]) => s + v, 0);
check("service van build matches its default", sum(SERVICE_VAN_BUILD) === i.serviceVanTools, `${sum(SERVICE_VAN_BUILD)} vs ${i.serviceVanTools}`);
check("detail rig build matches its default", sum(DETAIL_RIG_BUILD) === i.detailRigUpfit, `${sum(DETAIL_RIG_BUILD)} vs ${i.detailRigUpfit}`);

console.log("");
console.log("Members  Rev/mo   Cost/mo  Profit*  Techs  Util   Visits  Jobs");
for (const n of [10, 25, 50, 75, 100, 125, 150]) {
  const r = runModel(i, n);
  console.log(
    String(n).padStart(7),
    Math.round(r.revenue.total).toLocaleString("en-US").padStart(9),
    Math.round(r.costs.total).toLocaleString("en-US").padStart(9),
    (r.profit < 0 ? "-" : "+") + Math.round(Math.abs(r.profit)).toLocaleString("en-US").padStart(7),
    String(r.techs).padStart(6),
    (Math.round(r.techUtilizationPct) + "%").padStart(6),
    String(Math.round(r.visitsPerMonth)).padStart(8),
    r.alaCarteRows.reduce((s, a) => s + a.jobsPerMonth, 0).toFixed(1).padStart(6)
  );
}
console.log("* before owner pay. One member fits about", runModel(i, 100).membersPerTech.toFixed(0), "per technician.");
console.log("Profitable member counts:", ranges.map((g) => `${g.from}–${g.to} (${g.techs} tech${g.techs > 1 ? "s" : ""})`).join("  |  ") || "none up to 300");
console.log("");
if (failed) {
  console.log(`${failed} check(s) failed.`);
  process.exit(1);
}
console.log("All arithmetic checks passed.");
