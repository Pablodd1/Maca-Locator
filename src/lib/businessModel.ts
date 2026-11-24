// MACALOCATOR operating model — pure functions, no DOM.
// Every figure in Mission Control → Business Plan and in BUSINESS-PLAN.md is
// computed here (`npm test` checks the arithmetic, `npm run plan:figures`
// prints the document's numbers).
//
// Each input carries an evidence level:
//   verified   — taken from a primary source that was opened
//   reported   — appears in widely published secondary sources; not independently opened
//   assumption — an estimate; edit it and watch the conclusion move

export type Evidence = "verified" | "reported" | "assumption";

export interface Tier {
  name: string;
  price: number; // $ per member per month
  visitsPerMonth: number; // technician visits included
  detailsPerMonth: number; // detailing sessions included
  sharePct: number; // share of members on this tier (normalized to 100)
}

export interface AlaCarteItem {
  name: string;
  stockName: string; // how it appears on the materials shelf
  unit: string;
  everyXVehicleYears: number; // one job per vehicle every N years
  partsCost: number; // our cost per job
  partsMultiplier: number; // parts are billed at cost × this
  techHours: number; // technician time per job
  basis: string;
  evidence: Evidence;
}

export interface Inputs {
  tiers: Tier[];
  // People
  leadTechWage: number; // $/h base
  techWage: number;
  detailerWage: number;
  payrollLoadPct: number; // taxes + benefits on top of base wage
  paidHoursPerFte: number;
  utilizationPct: number; // share of paid hours that is billable work
  ownerMonthlyDraw: number; // pay for running dispatch; 0 = unpaid
  workersCompPct: number; // premium as % of payroll when required
  // Time
  hoursPerVisit: number; // technician time per membership visit, travel included
  hoursPerDetail: number;
  // Member fleet
  vehiclesPerMember: number;
  evSharePct: number; // electric vehicles: no oil, no engine air filter
  milesPerVehicleYear: number;
  // Consumables included in the membership
  oilChangeMiles: number;
  quartsPerOilChange: number;
  oilPricePerQuart: number;
  oilFilterCost: number;
  cabinFilterMiles: number;
  cabinFilterCost: number;
  engineFilterMiles: number;
  engineFilterCost: number;
  wiperSetCost: number; // one set per vehicle per year
  suppliesPerVisit: number;
  chemistryPerDetail: number;
  weeksOfStock: number; // weeks of materials kept on the vans / shelf
  // À-la-carte
  alaCarte: AlaCarteItem[];
  laborRateBilled: number; // $/h billed to the member on à-la-carte work
  otherAlaCartePerMemberMonth: number; // other repairs and services; 0 = not counted
  otherAlaCarteCostPct: number; // our cost as % of that revenue
  // Monthly fixed
  serviceVanLease: number;
  detailRigLease: number;
  vehicleFuelMaint: number; // per vehicle
  insuranceBase: number; // general liability + tools
  insurancePerVehicle: number; // commercial auto
  software: number;
  marketing: number;
  adminMisc: number;
  storage: number;
  // One-time
  serviceVanTools: number; // per service van
  detailRigUpfit: number; // per detailing rig
  vehicleWrap: number;
  startupCosts: number; // deposits, registrations, filing
}

export const DEFAULT_INPUTS: Inputs = {
  tiers: [
    { name: "Essential", price: 119, visitsPerMonth: 1, detailsPerMonth: 0, sharePct: 40 },
    { name: "Privé", price: 269, visitsPerMonth: 2, detailsPerMonth: 1 / 3, sharePct: 44 },
    { name: "Prestige", price: 549, visitsPerMonth: 2, detailsPerMonth: 1, sharePct: 16 },
  ],
  leadTechWage: 31.08,
  techWage: 26.85,
  detailerWage: 18,
  payrollLoadPct: 25,
  paidHoursPerFte: 168,
  utilizationPct: 83,
  ownerMonthlyDraw: 0,
  workersCompPct: 4,
  hoursPerVisit: 1.25,
  hoursPerDetail: 2.5,
  vehiclesPerMember: 1.15,
  evSharePct: 25,
  milesPerVehicleYear: 10000,
  oilChangeMiles: 10000,
  quartsPerOilChange: 6,
  oilPricePerQuart: 7.5,
  oilFilterCost: 12,
  cabinFilterMiles: 15000,
  cabinFilterCost: 15,
  engineFilterMiles: 30000,
  engineFilterCost: 18,
  wiperSetCost: 25,
  suppliesPerVisit: 4,
  chemistryPerDetail: 28,
  weeksOfStock: 3,
  alaCarte: [
    {
      name: "12V battery replacement",
      stockName: "AGM 12V battery",
      unit: "ea",
      everyXVehicleYears: 4,
      partsCost: 175,
      partsMultiplier: 2,
      techHours: 0.75,
      basis: "Batteries are commonly quoted as lasting 3–5 years; 4 used here.",
      evidence: "reported",
    },
    {
      name: "Brake pads, one axle",
      stockName: "Brake pad set (one axle)",
      unit: "sets",
      everyXVehicleYears: 2.5,
      partsCost: 110,
      partsMultiplier: 2.2,
      techHours: 1.5,
      basis: "Pads are commonly quoted at 30,000–70,000 miles; ~50,000 per axle at 10,000 miles a year, two axles.",
      evidence: "reported",
    },
    {
      name: "Tire patch or plug",
      stockName: "Tire patch kit",
      unit: "ea",
      everyXVehicleYears: 2,
      partsCost: 10,
      partsMultiplier: 2,
      techHours: 0.75,
      basis: "One repair per vehicle every two years.",
      evidence: "assumption",
    },
  ],
  laborRateBilled: 110,
  otherAlaCartePerMemberMonth: 0,
  otherAlaCarteCostPct: 35,
  serviceVanLease: 750,
  detailRigLease: 550,
  vehicleFuelMaint: 420,
  insuranceBase: 500,
  insurancePerVehicle: 150,
  software: 250,
  marketing: 600,
  adminMisc: 250,
  storage: 400,
  serviceVanTools: 9700,
  detailRigUpfit: 5700,
  vehicleWrap: 1500,
  startupCosts: 3000,
};

export type ScalarKey = Exclude<keyof Inputs, "tiers" | "alaCarte">;

export interface InputMeta {
  label: string;
  group: string;
  unit: string;
  step: number;
  evidence: Evidence;
  note: string;
}

export const INPUT_META: Record<ScalarKey, InputMeta> = {
  leadTechWage: { label: "Lead technician wage", group: "People", unit: "$/h", step: 0.5, evidence: "verified", note: "Miami metro 75th-percentile wage, $31.08/hr (BLS, May 2025). Paying the lead at the 75th percentile is a choice, not a fact." },
  techWage: { label: "Technician wage", group: "People", unit: "$/h", step: 0.5, evidence: "verified", note: "Miami metro mean wage, $26.85/hr; median $23.82 (BLS, May 2025)." },
  detailerWage: { label: "Detailer wage", group: "People", unit: "$/h", step: 0.5, evidence: "reported", note: "Miami detailer listings run roughly $15–20/hr (search summary, not opened)." },
  payrollLoadPct: { label: "Payroll load", group: "People", unit: "%", step: 1, evidence: "assumption", note: "Payroll taxes and benefits on top of base wage." },
  paidHoursPerFte: { label: "Paid hours per full-timer", group: "People", unit: "h/mo", step: 4, evidence: "assumption", note: "21 working days × 8 hours." },
  utilizationPct: { label: "Billable share of paid hours", group: "People", unit: "%", step: 1, evidence: "assumption", note: "The rest is admin, breaks and gaps between jobs." },
  ownerMonthlyDraw: { label: "Owner / dispatcher pay", group: "People", unit: "$/mo", step: 250, evidence: "assumption", note: "Pay for running dispatch. At 0 the owner works for free and 'profit' is before this." },
  workersCompPct: { label: "Workers' comp premium", group: "People", unit: "% of payroll", step: 0.5, evidence: "assumption", note: "Florida requires coverage at 4 or more employees, owners who are officers or LLC members included (verified). The rate is an estimate." },
  hoursPerVisit: { label: "Technician time per visit", group: "Time", unit: "h", step: 0.05, evidence: "assumption", note: "On-site work plus travel. Reported on-site times: oil change 20–45 min, diagnostics 30–60 min. Not measured for Miami condos." },
  hoursPerDetail: { label: "Time per detail", group: "Time", unit: "h", step: 0.25, evidence: "assumption", note: "Detailer time per detailing session." },
  vehiclesPerMember: { label: "Vehicles per member", group: "Member fleet", unit: "vehicles", step: 0.05, evidence: "assumption", note: "Prestige adds a second household car at half price." },
  evSharePct: { label: "Electric share of vehicles", group: "Member fleet", unit: "%", step: 5, evidence: "assumption", note: "Electric vehicles need no oil or engine air filter. Not measured for Miami." },
  milesPerVehicleYear: { label: "Miles per vehicle per year", group: "Member fleet", unit: "mi", step: 500, evidence: "assumption", note: "Drives how often consumables come due." },
  oilChangeMiles: { label: "Oil change interval", group: "Included consumables", unit: "mi", step: 500, evidence: "assumption", note: "Only non-electric vehicles." },
  quartsPerOilChange: { label: "Quarts per oil change", group: "Included consumables", unit: "qt", step: 0.5, evidence: "assumption", note: "Luxury engines commonly take 6–8." },
  oilPricePerQuart: { label: "Synthetic oil, our cost", group: "Included consumables", unit: "$/qt", step: 0.25, evidence: "assumption", note: "Not price-checked." },
  oilFilterCost: { label: "Oil filter, our cost", group: "Included consumables", unit: "$", step: 1, evidence: "assumption", note: "Not price-checked." },
  cabinFilterMiles: { label: "Cabin filter interval", group: "Included consumables", unit: "mi", step: 1000, evidence: "reported", note: "About 15,000 miles is the commonly cited interval (search summary, not opened)." },
  cabinFilterCost: { label: "Cabin filter, our cost", group: "Included consumables", unit: "$", step: 1, evidence: "assumption", note: "Not price-checked." },
  engineFilterMiles: { label: "Engine air filter interval", group: "Included consumables", unit: "mi", step: 1000, evidence: "assumption", note: "Only non-electric vehicles." },
  engineFilterCost: { label: "Engine air filter, our cost", group: "Included consumables", unit: "$", step: 1, evidence: "assumption", note: "Not price-checked." },
  wiperSetCost: { label: "Wiper set per year, our cost", group: "Included consumables", unit: "$/set", step: 1, evidence: "assumption", note: "One set per vehicle per year." },
  suppliesPerVisit: { label: "Supplies per visit", group: "Included consumables", unit: "$/visit", step: 0.5, evidence: "assumption", note: "Gloves, towels, fluid top-offs." },
  chemistryPerDetail: { label: "Products per detail", group: "Included consumables", unit: "$/detail", step: 1, evidence: "assumption", note: "Not price-checked." },
  weeksOfStock: { label: "Weeks of stock to keep", group: "Included consumables", unit: "weeks", step: 0.5, evidence: "assumption", note: "On the vans and shelf, to cover delivery lead times." },
  laborRateBilled: { label: "Labor rate billed", group: "À-la-carte", unit: "$/h", step: 5, evidence: "assumption", note: "Charged on the à-la-carte items below." },
  otherAlaCartePerMemberMonth: { label: "Other repairs per member", group: "À-la-carte", unit: "$/mo", step: 10, evidence: "assumption", note: "Work beyond the replacement items below. 0 means none is counted." },
  otherAlaCarteCostPct: { label: "Our cost on other repairs", group: "À-la-carte", unit: "%", step: 5, evidence: "assumption", note: "Parts and materials as a share of that revenue." },
  serviceVanLease: { label: "Service van lease", group: "Monthly fixed", unit: "$/mo", step: 25, evidence: "reported", note: "2026 cargo-van lease ads run roughly $700–850/mo (search summary, not opened)." },
  detailRigLease: { label: "Detailing rig lease", group: "Monthly fixed", unit: "$/mo", step: 25, evidence: "assumption", note: "Detailer needs their own vehicle." },
  vehicleFuelMaint: { label: "Fuel + maintenance per vehicle", group: "Monthly fixed", unit: "$/mo", step: 25, evidence: "assumption", note: "Per vehicle, monthly." },
  insuranceBase: { label: "Liability + tools insurance", group: "Monthly fixed", unit: "$/mo", step: 25, evidence: "assumption", note: "Get quotes. A solo mobile mechanic was reported at about $180–360/mo all-in (search summary; Insureon's page shows no dollar figures)." },
  insurancePerVehicle: { label: "Commercial auto per vehicle", group: "Monthly fixed", unit: "$/mo", step: 25, evidence: "assumption", note: "Get quotes." },
  software: { label: "Software and phones", group: "Monthly fixed", unit: "$/mo", step: 25, evidence: "assumption", note: "" },
  marketing: { label: "Marketing", group: "Monthly fixed", unit: "$/mo", step: 50, evidence: "assumption", note: "" },
  adminMisc: { label: "Admin and misc", group: "Monthly fixed", unit: "$/mo", step: 25, evidence: "assumption", note: "" },
  storage: { label: "Parts storage unit", group: "Monthly fixed", unit: "$/mo", step: 25, evidence: "assumption", note: "" },
  serviceVanTools: { label: "Tools per service van", group: "One-time", unit: "$", step: 100, evidence: "assumption", note: "Scanner, jacks, impact kit, hand tools, tire kit. Not price-checked." },
  detailRigUpfit: { label: "Upfit per detailing rig", group: "One-time", unit: "$", step: 100, evidence: "assumption", note: "Water tank, generator, extractor, polisher. Not price-checked." },
  vehicleWrap: { label: "Wrap per vehicle", group: "One-time", unit: "$", step: 50, evidence: "assumption", note: "" },
  startupCosts: { label: "Deposits, registrations, filing", group: "One-time", unit: "$", step: 100, evidence: "assumption", note: "" },
};

// What the default one-time figures are made of. Prices were not checked against suppliers.
export const SERVICE_VAN_BUILD: ReadonlyArray<readonly [string, number]> = [
  ["Pro diagnostic scanner", 3500],
  ["Jack, stands and ramps", 700],
  ["Torque wrench set", 300],
  ["Battery tester and charger", 400],
  ["Impact kit and portable compressor", 800],
  ["Hand tools and storage", 2000],
  ["TPMS programmer and tire kit", 1100],
  ["EV high-voltage safety kit", 900],
];

export const DETAIL_RIG_BUILD: ReadonlyArray<readonly [string, number]> = [
  ["Polisher, steamer and extractor", 2200],
  ["Water tank, pump and hoses", 1500],
  ["Generator", 1200],
  ["Shelving and power", 800],
];

export interface MaterialLine {
  key: string;
  name: string;
  unit: string;
  perMonth: number; // units used per month
  unitCost: number; // our cost per unit
  monthlyCost: number;
  billed: boolean; // charged to the member as à-la-carte
  vehicle: boolean; // scales with member vehicles
  basis: string;
  evidence: Evidence;
}

export interface AlaCarteRow {
  item: AlaCarteItem;
  jobsPerMonth: number;
  pricePerJob: number;
  revenuePerMonth: number;
  hoursPerMonth: number;
  partsPerMonth: number;
}

export interface TierEconomics {
  name: string;
  sharePct: number; // normalized
  members: number;
  price: number;
  visitsPerMonth: number;
  detailsPerMonth: number;
  labor: number; // per member per month
  materials: number;
  direct: number;
  contribution: number;
  marginPct: number;
  priceAt50Margin: number;
}

export interface Result {
  members: number;
  fleetVehicles: number;
  iceVehicles: number;
  tiers: TierEconomics[];
  visitsPerMonth: number;
  detailsPerMonth: number;
  techHours: number;
  detailHours: number;
  techs: number;
  detailers: number;
  detailerPaidHours: number;
  serviceVans: number;
  detailRigs: number;
  vehicles: number;
  techCapacityHours: number;
  techUtilizationPct: number;
  idleTechHours: number;
  hoursPerMember: number;
  membersPerTech: number;
  headcountIncludingOwner: number;
  workersCompRequired: boolean;
  revenue: { memberships: number; alaCarte: number; other: number; total: number };
  costs: {
    payrollTech: number;
    payrollDetailer: number;
    workersComp: number;
    vehicles: number;
    insurance: number;
    opex: number;
    materialsCovered: number;
    materialsAlaCarte: number;
    otherAlaCarte: number;
    total: number;
  };
  profitBeforeOwner: number;
  ownerDraw: number;
  profit: number;
  materials: MaterialLine[];
  alaCarteRows: AlaCarteRow[];
  stockValue: number; // value of materials kept on hand
}

export function materialLines(i: Inputs, fleet: number, iceFleet: number, visits: number, details: number): MaterialLine[] {
  const oilChangesPerIceYear = i.oilChangeMiles > 0 ? i.milesPerVehicleYear / i.oilChangeMiles : 0;
  const oilChanges = (iceFleet * oilChangesPerIceYear) / 12;
  const perYear = (miles: number) => (miles > 0 ? i.milesPerVehicleYear / miles : 0);
  const line = (
    key: string,
    name: string,
    unit: string,
    perMonth: number,
    unitCost: number,
    flags: Partial<Pick<MaterialLine, "billed" | "vehicle">>,
    basis: string,
    evidence: Evidence
  ): MaterialLine => ({ key, name, unit, perMonth, unitCost, monthlyCost: perMonth * unitCost, billed: false, vehicle: false, ...flags, basis, evidence });

  return [
    line("oil", "Full synthetic oil", "qt", oilChanges * i.quartsPerOilChange, i.oilPricePerQuart, { vehicle: true }, "Non-electric vehicles ÷ oil interval × quarts per change", "assumption"),
    line("oilfilter", "Oil filter", "ea", oilChanges, i.oilFilterCost, { vehicle: true }, "One per oil change", "assumption"),
    line("cabin", "Cabin air filter", "ea", (fleet * perYear(i.cabinFilterMiles)) / 12, i.cabinFilterCost, { vehicle: true }, "Every 15,000 miles", "reported"),
    line("engine", "Engine air filter", "ea", (iceFleet * perYear(i.engineFilterMiles)) / 12, i.engineFilterCost, { vehicle: true }, "Non-electric vehicles, every 30,000 miles", "assumption"),
    line("wipers", "Wiper blade set", "sets", fleet / 12, i.wiperSetCost, { vehicle: true }, "One set per vehicle per year", "assumption"),
    line("supplies", "Shop supplies", "visits", visits, i.suppliesPerVisit, {}, "One lot per membership visit", "assumption"),
    line("chemistry", "Detailing products", "details", details, i.chemistryPerDetail, {}, "One lot per detailing session", "assumption"),
    ...i.alaCarte.map((a) =>
      line("ala-" + a.name, a.stockName, a.unit, fleet / a.everyXVehicleYears / 12, a.partsCost, { billed: true, vehicle: true }, a.basis, a.evidence)
    ),
  ];
}

export function alaCarteRows(i: Inputs, fleet: number): AlaCarteRow[] {
  return i.alaCarte.map((item) => {
    const jobsPerMonth = item.everyXVehicleYears > 0 ? fleet / item.everyXVehicleYears / 12 : 0;
    const pricePerJob = item.partsCost * item.partsMultiplier + item.techHours * i.laborRateBilled;
    return { item, jobsPerMonth, pricePerJob, revenuePerMonth: jobsPerMonth * pricePerJob, hoursPerMonth: jobsPerMonth * item.techHours, partsPerMonth: jobsPerMonth * item.partsCost };
  });
}

export function runModel(i: Inputs, members: number): Result {
  const util = i.utilizationPct / 100;
  const load = 1 + i.payrollLoadPct / 100;
  const productivePerTech = i.paidHoursPerFte * util;
  const loaded = { lead: i.leadTechWage * load, tech: i.techWage * load, detailer: i.detailerWage * load };
  const blendedTech = (loaded.lead + loaded.tech) / 2;
  const costPerProductiveHour = { tech: util > 0 ? blendedTech / util : 0, detailer: util > 0 ? loaded.detailer / util : 0 };

  const shareSum = i.tiers.reduce((s, t) => s + t.sharePct, 0) || 1;
  const fleet = members * i.vehiclesPerMember;
  const iceFleet = fleet * (1 - i.evSharePct / 100);

  const agg = i.tiers.reduce(
    (a, t) => {
      const n = (members * t.sharePct) / shareSum;
      a.visits += n * t.visitsPerMonth;
      a.details += n * t.detailsPerMonth;
      a.memberships += n * t.price;
      return a;
    },
    { visits: 0, details: 0, memberships: 0 }
  );

  const materials = materialLines(i, fleet, iceFleet, agg.visits, agg.details);
  const vehicleConsumables = materials.filter((m) => m.vehicle && !m.billed).reduce((s, m) => s + m.monthlyCost, 0);
  const materialsCovered = materials.filter((m) => !m.billed).reduce((s, m) => s + m.monthlyCost, 0);
  const alaCarteRowsList = alaCarteRows(i, fleet);
  const alaJobs = alaCarteRowsList.reduce((s, r) => s + r.jobsPerMonth, 0);
  const alaRevenue = alaCarteRowsList.reduce((s, r) => s + r.revenuePerMonth, 0);
  const alaHours = alaCarteRowsList.reduce((s, r) => s + r.hoursPerMonth, 0);
  const alaParts = alaCarteRowsList.reduce((s, r) => s + r.partsPerMonth, 0);
  const otherRevenue = members * i.otherAlaCartePerMemberMonth;
  const otherCost = (otherRevenue * i.otherAlaCarteCostPct) / 100;

  const techHours = agg.visits * i.hoursPerVisit + alaHours;
  const detailHours = agg.details * i.hoursPerDetail;

  const techs = members > 0 ? (productivePerTech > 0 ? Math.max(1, Math.ceil(techHours / productivePerTech - 1e-9)) : 1) : 0;
  const detailerPaidHours = util > 0 ? detailHours / util : 0;
  const detailers = detailHours > 0 ? Math.max(1, Math.ceil(detailerPaidHours / i.paidHoursPerFte - 1e-9)) : 0;
  const serviceVans = techs;
  const detailRigs = detailers;
  const vehicles = techs + detailers;

  const payrollTech = (techs > 0 ? loaded.lead * i.paidHoursPerFte : 0) + Math.max(0, techs - 1) * loaded.tech * i.paidHoursPerFte;
  const payrollDetailer = detailerPaidHours * loaded.detailer;
  const headcountIncludingOwner = techs + detailers + 1;
  const workersCompRequired = headcountIncludingOwner >= 4 && payrollTech + payrollDetailer > 0;
  const workersComp = workersCompRequired ? ((payrollTech + payrollDetailer) * i.workersCompPct) / 100 : 0;
  const vehicleCost = techs * i.serviceVanLease + detailers * i.detailRigLease + vehicles * i.vehicleFuelMaint;
  const insurance = i.insuranceBase + vehicles * i.insurancePerVehicle;
  const opex = i.software + i.marketing + i.adminMisc + i.storage;

  const revenue = { memberships: agg.memberships, alaCarte: alaRevenue, other: otherRevenue, total: agg.memberships + alaRevenue + otherRevenue };
  const costs = {
    payrollTech,
    payrollDetailer,
    workersComp,
    vehicles: vehicleCost,
    insurance,
    opex,
    materialsCovered,
    materialsAlaCarte: alaParts,
    otherAlaCarte: otherCost,
    total: payrollTech + payrollDetailer + workersComp + vehicleCost + insurance + opex + materialsCovered + alaParts + otherCost,
  };
  const profitBeforeOwner = revenue.total - costs.total;
  const ownerDraw = members > 0 ? i.ownerMonthlyDraw : 0;

  const tiers: TierEconomics[] = i.tiers.map((t) => {
    const labor = t.visitsPerMonth * i.hoursPerVisit * costPerProductiveHour.tech + t.detailsPerMonth * i.hoursPerDetail * costPerProductiveHour.detailer;
    const materialsPerMember = t.visitsPerMonth * i.suppliesPerVisit + t.detailsPerMonth * i.chemistryPerDetail + (members > 0 ? vehicleConsumables / members : 0);
    const direct = labor + materialsPerMember;
    return {
      name: t.name,
      sharePct: (t.sharePct / shareSum) * 100,
      members: (members * t.sharePct) / shareSum,
      price: t.price,
      visitsPerMonth: t.visitsPerMonth,
      detailsPerMonth: t.detailsPerMonth,
      labor,
      materials: materialsPerMember,
      direct,
      contribution: t.price - direct,
      marginPct: t.price > 0 ? ((t.price - direct) / t.price) * 100 : 0,
      priceAt50Margin: direct / 0.5,
    };
  });

  const techCapacityHours = techs * productivePerTech;
  return {
    members,
    fleetVehicles: fleet,
    iceVehicles: iceFleet,
    tiers,
    visitsPerMonth: agg.visits,
    detailsPerMonth: agg.details,
    techHours,
    detailHours,
    techs,
    detailers,
    detailerPaidHours,
    serviceVans,
    detailRigs,
    vehicles,
    techCapacityHours,
    techUtilizationPct: techCapacityHours > 0 ? (techHours / techCapacityHours) * 100 : 0,
    idleTechHours: Math.max(0, techCapacityHours - techHours),
    hoursPerMember: members > 0 ? techHours / members : 0,
    membersPerTech: members > 0 && techHours > 0 ? productivePerTech / (techHours / members) : 0,
    headcountIncludingOwner,
    workersCompRequired,
    revenue,
    costs,
    profitBeforeOwner,
    ownerDraw,
    profit: profitBeforeOwner - ownerDraw,
    materials,
    alaCarteRows: alaCarteRowsList,
    stockValue: materials.reduce((s, m) => s + (m.perMonth * i.weeksOfStock * m.unitCost) / (52 / 12), 0),
  };
}

export interface ProfitRange {
  from: number;
  to: number; // inclusive
  techs: number;
}

/** Member counts at which the model shows a profit (after owner pay), up to `max`. */
export function profitRanges(i: Inputs, max = 300): ProfitRange[] {
  const ranges: ProfitRange[] = [];
  for (let n = 1; n <= max; n++) {
    const r = runModel(i, n);
    if (r.profit >= 0) {
      const last = ranges[ranges.length - 1];
      if (last && last.to === n - 1 && last.techs === r.techs) last.to = n;
      else ranges.push({ from: n, to: n, techs: r.techs });
    }
  }
  return ranges;
}

/** First member count at which the model shows a profit, or null if none up to `max`. */
export function breakevenMembers(i: Inputs, max = 300): number | null {
  const first = profitRanges(i, max)[0];
  return first ? first.from : null;
}

export interface Scenario {
  name: string;
  apply: (i: Inputs) => Inputs;
}

export const SCENARIOS: Scenario[] = [
  { name: "Visits take 40% longer", apply: (i) => ({ ...i, hoursPerVisit: i.hoursPerVisit * 1.4 }) },
  { name: "Garage or valet handoff adds 15 min per visit", apply: (i) => ({ ...i, hoursPerVisit: i.hoursPerVisit + 0.25 }) },
  { name: "Prestige members use all 4 visits", apply: (i) => ({ ...i, tiers: i.tiers.map((t) => (t.name === "Prestige" ? { ...t, visitsPerMonth: 4 } : t)) }) },
  { name: "Members trade down (60 / 30 / 10 mix)", apply: (i) => ({ ...i, tiers: i.tiers.map((t, k) => ({ ...t, sharePct: [60, 30, 10][k] ?? t.sharePct })) }) },
  { name: "Wages 15% higher", apply: (i) => ({ ...i, leadTechWage: i.leadTechWage * 1.15, techWage: i.techWage * 1.15, detailerWage: i.detailerWage * 1.15 }) },
  { name: "Only 70% of paid hours are billable", apply: (i) => ({ ...i, utilizationPct: 70 }) },
  { name: "Nobody buys anything à-la-carte", apply: (i) => ({ ...i, alaCarte: [], otherAlaCartePerMemberMonth: 0 }) },
  { name: "Members add $60/mo of other repairs", apply: (i) => ({ ...i, otherAlaCartePerMemberMonth: i.otherAlaCartePerMemberMonth + 60 }) },
];

export interface CashRow {
  month: number;
  members: number;
  profit: number;
  capex: number;
  cumulative: number;
}

/** Members grow evenly from 0 to `membersAtEnd` over `months`; one-time spending is added as vehicles come online. */
export function cashRamp(i: Inputs, months: number, membersAtEnd: number): { rows: CashRow[]; peakNeed: number } {
  const vanCapex = i.serviceVanTools + i.vehicleWrap;
  const rigCapex = i.detailRigUpfit + i.vehicleWrap;
  const rows: CashRow[] = [];
  let cumulative = -i.startupCosts;
  let prev = { serviceVans: 0, detailRigs: 0 };
  for (let m = 1; m <= months; m++) {
    const r = runModel(i, Math.round((membersAtEnd * m) / months));
    const capex = Math.max(0, r.serviceVans - prev.serviceVans) * vanCapex + Math.max(0, r.detailRigs - prev.detailRigs) * rigCapex;
    cumulative += r.profit - capex;
    rows.push({ month: m, members: r.members, profit: r.profit, capex, cumulative });
    prev = { serviceVans: r.serviceVans, detailRigs: r.detailRigs };
  }
  const peakNeed = Math.max(0, -Math.min(-i.startupCosts, ...rows.map((x) => x.cumulative)));
  return { rows, peakNeed };
}
