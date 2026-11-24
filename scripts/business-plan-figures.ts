// Prints every figure quoted in BUSINESS-PLAN.md, from the same model the
// Business Plan tab uses. Run with `npm run plan:figures` after changing
// inputs or defaults, and paste the output into the document.
import { DEFAULT_INPUTS, cashRamp, profitRanges, runModel, SCENARIOS } from "../src/lib/businessModel.ts";

const i = DEFAULT_INPUTS;
const $ = (n: number) => "$" + Math.round(n).toLocaleString("en-US");
const line = (label: string, value: string) => console.log(`${label.padEnd(46)} ${value}`);

console.log("== TIER ECONOMICS (per member per month, fully loaded) ==");
for (const t of runModel(i, 50).tiers) {
  console.log(`${t.name.padEnd(12)} price ${$(t.price).padStart(5)}  labor ${$(t.labor).padStart(4)}  materials ${$(t.materials).padStart(4)}  direct ${$(t.direct).padStart(4)}  contribution ${$(t.contribution).padStart(4)}  margin ${t.marginPct.toFixed(0)}%  price for 50% margin ${$(t.priceAt50Margin)}`);
}
const mixed = runModel(i, 50).tiers.reduce((s, t) => s + (t.sharePct / 100) * t.contribution, 0);
line("Blended contribution per member", $(mixed));

console.log("\n== P&L ==");
for (const n of [25, 50, 75, 100, 125]) {
  const r = runModel(i, n);
  console.log(`-- ${n} members: ${r.techs} tech(s), ${r.detailers} detailer (${Math.round(r.detailerPaidHours)} paid h), ${r.serviceVans} service van(s), ${r.detailRigs} detail rig(s), utilization ${r.techUtilizationPct.toFixed(0)}%, ${Math.round(r.visitsPerMonth)} visits, ${r.alaCarteRows.reduce((s, a) => s + a.jobsPerMonth, 0).toFixed(1)} à-la-carte jobs, headcount incl. owner ${r.headcountIncludingOwner}, workers' comp ${r.workersCompRequired ? "required" : "not required"}`);
  line("  membership revenue", $(r.revenue.memberships));
  line("  à-la-carte revenue", $(r.revenue.alaCarte));
  line("  revenue", $(r.revenue.total));
  line("  technician payroll", $(r.costs.payrollTech));
  line("  detailer payroll", $(r.costs.payrollDetailer));
  line("  workers' comp", $(r.costs.workersComp));
  line("  vehicles (lease + fuel)", $(r.costs.vehicles));
  line("  insurance", $(r.costs.insurance));
  line("  overhead", $(r.costs.opex));
  line("  included materials", $(r.costs.materialsCovered));
  line("  à-la-carte parts", $(r.costs.materialsAlaCarte));
  line("  costs", $(r.costs.total));
  line("  profit before owner pay", (r.profitBeforeOwner < 0 ? "-" : "+") + $(Math.abs(r.profitBeforeOwner)));
  line("  materials kept on hand", $(r.stockValue));
}

console.log("\n== PROFITABLE MEMBER COUNTS (before owner pay) ==");
console.log(profitRanges(i).map((g) => `${g.from}–${g.to} with ${g.techs}`).join("  |  "));
line("Members per technician", runModel(i, 100).membersPerTech.toFixed(0));
line("Technician hours per member per month", runModel(i, 100).hoursPerMember.toFixed(2));
line("Second technician needed from", profitRanges(i).length > 1 ? profitRanges(i)[1].from + " members (profitable range)" : "n/a");
for (let n = 40; n <= 140; n++) if (runModel(i, n).techs !== runModel(i, n - 1).techs) line(`Technician count rises to ${runModel(i, n).techs} at`, `${n} members`);

console.log("\n== SENSITIVITY AT 50 MEMBERS (profit before owner pay) ==");
const base = runModel(i, 50);
for (const s of SCENARIOS) {
  const r = runModel(s.apply(i), 50);
  console.log(`${s.name.padEnd(46)} ${(r.profit < 0 ? "-" : "+")}${$(Math.abs(r.profit)).padStart(6)}  techs ${r.techs}  util ${r.techUtilizationPct.toFixed(0)}%  delta ${r.profit - base.profit >= 0 ? "+" : "-"}${$(Math.abs(r.profit - base.profit))}`);
}

console.log("\n== VISIT LENGTH VS PROFIT AT 50 AND 75 MEMBERS ==");
for (const h of [1.0, 1.25, 1.5, 1.75, 2.0]) {
  const r50 = runModel({ ...i, hoursPerVisit: h }, 50);
  const r75 = runModel({ ...i, hoursPerVisit: h }, 75);
  console.log(`${h.toFixed(2)} h/visit:  50 members ${(r50.profit < 0 ? "-" : "+")}${$(Math.abs(r50.profit)).padStart(6)} (${r50.techs} techs)   75 members ${(r75.profit < 0 ? "-" : "+")}${$(Math.abs(r75.profit)).padStart(6)} (${r75.techs} techs)`);
}

const r50 = runModel(i, 50);
const alaHours50 = r50.alaCarteRows.reduce((s, a) => s + a.hoursPerMonth, 0);
line("Longest visit that still fits one technician at 50", (((i.paidHoursPerFte * i.utilizationPct) / 100 - alaHours50) / r50.visitsPerMonth).toFixed(2) + " h");
line("Lead technician pay per month", $(r50.costs.payrollTech));

console.log("\n== RAMP SPEED TO 50 MEMBERS ==");
for (const months of [6, 9, 12, 18]) {
  const ramp = cashRamp(i, months, 50);
  const end = ramp.rows[months - 1].cumulative;
  console.log(`${String(months).padStart(2)} months: most cash needed ${$(ramp.peakNeed).padStart(7)}   running total at month ${months}: ${end < 0 ? "-" : "+"}${$(Math.abs(end))}`);
}

console.log("\n== MATERIALS AT 50 MEMBERS ==");
for (const m of runModel(i, 50).materials) {
  console.log(`${m.name.padEnd(30)} ${m.perMonth.toFixed(1).padStart(7)} ${m.unit.padEnd(6)} /mo   ${$(m.unitCost).padStart(5)} each   ${$(m.monthlyCost).padStart(6)}/mo   ${m.billed ? "billed" : "included"}   [${m.evidence}]`);
}
console.log("\n== À-LA-CARTE ITEMS AT 50 MEMBERS ==");
for (const a of runModel(i, 50).alaCarteRows) {
  console.log(`${a.item.name.padEnd(30)} ${a.jobsPerMonth.toFixed(2)} jobs/mo   price ${$(a.pricePerJob)}   revenue ${$(a.revenuePerMonth)}/mo   tech h ${a.hoursPerMonth.toFixed(1)}`);
}

console.log("\n== CASH RAMP (members grow evenly over 12 months) ==");
for (const target of [50, 75, 100]) {
  const ramp = cashRamp(i, 12, target);
  console.log(`-- to ${target} members: peak funding need ${$(ramp.peakNeed)}; cumulative after 12 months ${ramp.rows[11].cumulative < 0 ? "-" : "+"}${$(Math.abs(ramp.rows[11].cumulative))}`);
  console.log("   " + ramp.rows.map((x) => `M${x.month}: ${x.members}m ${x.profit < 0 ? "-" : "+"}${$(Math.abs(x.profit))}${x.capex ? " capex " + $(x.capex) : ""} → ${x.cumulative < 0 ? "-" : "+"}${$(Math.abs(x.cumulative))}`).join("\n   "));
}
