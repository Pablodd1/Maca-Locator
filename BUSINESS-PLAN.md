# MACALOCATOR — Business Plan

*Luxury mobile auto service · Miami & Miami Beach · revised 2026-11-24*

This replaces the first version (2026-11-23), which contained wrong figures. Section 10 lists what changed.

Every number below is printed by `npm run plan:figures` from `src/lib/businessModel.ts`, the same model behind **Mission Control → Business Plan**. `npm test` checks the arithmetic. Change an input on that tab and the plan moves with it.

Each input carries one of three evidence levels:

- **Verified** — taken from a primary source that was opened. Listed in Section 11.
- **Reported** — appears in widely published secondary sources. Not independently opened.
- **Assumption** — an estimate.

## 1. Where the product stands

Built and working: a client app (live service tracker, trilingual concierge with voice, reminders over SMS, WhatsApp, voice call and email, emergency dispatch) and Mission Control (tasks with check-in and check-out, staff radio, inventory, CRM export, Jev decision layer).

Not real yet:

- Technician location, staff movement and stock levels are simulated in the browser.
- Notification channels compose messages but send nothing until provider keys are added.
- Sign-in for staff and for the APIs is still to be built. It has to be in place before any real client's name, phone, address, location or insurance details go in.
- The concierge has no price list. It has quoted the same tire rotation at $75, $85 and $95, while the app's built-in replies and the client deck say $39.
- No written estimate or customer authorization flow, which Florida law requires above a threshold (Section 7).

## 2. Market

Verified:

| Fact | Figure | Source |
|---|---|---|
| Mobile automotive repair services market, worldwide | $4.27B (2025) → $4.65B (2026) → $7.09B (2031), 8.82% a year | Mordor Intelligence |
| North America share of that market | 42.18% | Mordor Intelligence |
| Automotive service technician pay, Miami metro, May 2025 | median $23.82/hr, mean $26.85, 75th percentile $31.08, 90th $39.18 | BLS |
| Same occupation, Florida / U.S. mean | $25.84 / $27.13 an hour | BLS |
| YourMechanic diagnostic fee | starts at $130, varies by market | YourMechanic |

Not verified:

- **Size of the target segment.** The first version said about 22% of Miami Beach households earn over $200,000. That came from a search summary and no source was opened. The Census API now requires a key and Census Reporter blocked automated access. Closing this takes one free key and one query (ACS table B19001 for the target ZIP codes). Until then there is no measured figure for how many households can afford these tiers.
- **A comparable membership price.** No published Miami mobile-maintenance membership was found. Express car-wash unlimited plans run about $20–50 a month (search summary). The "$100–700 a month concierge band" quoted earlier is withdrawn.

## 3. Tiers and pricing

Prices are proposals, not a benchmark. Under Assumptions on the tab they can be changed.

| | Essential | Privé | Prestige |
|---|---|---|---|
| Price per month | $119 | $269 | $549 |
| Visits included per month | 1 | 2 | 2 (fair-use cap 4) |
| Details included per month | 0 | quarterly | 1 |
| Assumed share of members | 40% | 44% | 16% |
| Labor cost per member | $55 | $132 | $177 |
| Materials per member | $12 | $25 | $44 |
| Direct cost per member | $66 | $157 | $221 |
| Contribution per member | $53 | $112 | $328 |
| Margin | 44% | 42% | 60% |
| Price for a 50% margin | $133 | $314 | $441 |

Blended contribution is $123 per member per month before any fixed cost.

Two things follow:

- All three tiers cover what they cost to deliver. The first version said Essential was sold at cost. That came from assuming every monthly visit used an oil change.
- Privé has the thinnest margin and is assumed to be the largest tier. At $314 it would reach 50%. Whether to raise it is a pricing decision, not a finding.

## 4. What 50 members need

### Demand

80 membership visits and 15.3 details a month, across 57 member vehicles (43 not electric, 25% electric assumed), plus about 5.5 à-la-carte jobs.

### Staff and capacity

| Role | Count | Load |
|---|---|---|
| Lead technician | 1 | 76% of billable hours booked, 33.9 hours a month unbooked |
| Detailer | 1, part-time | 46.2 paid hours a month |
| Dispatcher | Owner | unpaid in this model |

One technician covers about 66 members, at 2.11 technician hours per member per month. A second is needed from 67 members.

Headcount including the owner is 3, so workers' compensation is not required at this size. It becomes required at the second technician.

### Fleet and tools

| Item | Count | Monthly | One-time |
|---|---|---|---|
| Service van (per technician) | 1 | $750 lease + $420 fuel and upkeep | $9,700 tools + $1,500 wrap |
| Detailing rig (per detailer) | 1 | $550 lease + $420 fuel and upkeep | $5,700 upfit + $1,500 wrap |

The first version had no vehicle for the detailer. Tool and upfit prices were not checked with suppliers; the item lists are on the tab.

### Materials to keep on hand, per month at 50 members

| Item | Used | Cost | Keep on hand (3 weeks) | Paid by |
|---|---|---|---|---|
| Full synthetic oil | 21.6 qt | $162 | 14.9 qt | membership |
| Oil filter | 3.6 | $43 | 2.5 | membership |
| Cabin air filter | 3.2 | $48 | 2.2 | membership |
| Engine air filter | 1.2 | $22 | 0.8 | membership |
| Wiper set | 4.8 | $120 | 3.3 | membership |
| Shop supplies | 80.0 visits | $320 | 55.4 | membership |
| Detailing products | 15.3 details | $429 | 10.6 | membership |
| AGM 12V battery | 1.2 | $210 | 0.8 | member, à-la-carte |
| Brake pad set, one axle | 1.9 | $211 | 1.3 | member, à-la-carte |
| Tire patch kit | 2.4 | $24 | 1.7 | member, à-la-carte |

About $1,587 a month in materials, and $1,099 of stock on the shelf. The first version listed 160 quarts of oil and 8 batteries a month. Quantities here follow vehicle wear rates instead.

### À-la-carte work at 50 members

| Job | Jobs / mo | Price | Revenue / mo |
|---|---|---|---|
| 12V battery replacement | 1.20 | $433 | $518 |
| Brake pads, one axle | 1.92 | $407 | $780 |
| Tire patch or plug | 2.40 | $103 | $246 |

Parts are billed at 2.0–2.2 times cost and labor at $110 an hour, both assumptions. PartsTech publishes a benchmark matrix of 1.7× to 4× depending on part price and says shop coaches recommend a 58% gross margin on parts. Repairs beyond these three items are not counted. The first version assumed $5,250 a month of à-la-carte revenue with nothing behind it.

## 5. The money

Profit is before any pay for the owner.

| Members | 25 | 50 | 75 | 100 | 125 |
|---|---|---|---|---|---|
| Membership revenue | $6,345 | $12,690 | $19,035 | $25,380 | $31,725 |
| À-la-carte revenue | $772 | $1,544 | $2,316 | $3,088 | $3,859 |
| Technician pay | $6,527 | $6,527 | $12,165 | $12,165 | $12,165 |
| Detailer pay | $520 | $1,039 | $1,559 | $2,078 | $2,598 |
| Workers' comp | $0 | $0 | $549 | $570 | $591 |
| Vehicles | $2,140 | $2,140 | $3,310 | $3,310 | $3,310 |
| Insurance | $800 | $800 | $950 | $950 | $950 |
| Overhead | $1,500 | $1,500 | $1,500 | $1,500 | $1,500 |
| Materials and parts | $794 | $1,587 | $2,382 | $3,176 | $3,970 |
| **Profit / (loss)** | **($5,163)** | **$640** | **($1,064)** | **$4,718** | **$10,501** |
| Technicians | 1 | 1 | 2 | 2 | 2 |
| Hours booked | 38% | 76% | 57% | 76% | 95% |

Profitable member counts are 48–66 and 80 and up. The gap from 67 to 79 is the second technician arriving before the work has grown to fill the time.

### What changes the answer at 50 members

| Change | Profit / mo | Difference | Technicians |
|---|---|---|---|
| As entered | +$640 | — | 1 |
| Visits take 40% longer | −$6,847 | −$7,487 | 2 |
| Members trade down to 60 / 30 / 10 | −$1,149 | −$1,789 | 1 |
| Wages 15% higher | −$495 | −$1,135 | 1 |
| Nobody buys anything à-la-carte | −$459 | −$1,099 | 1 |
| Only 70% of paid hours are billable | +$447 | −$193 | 1 |
| Prestige members use all 4 visits | +$576 | −$64 | 1 |
| Garage or valet handoff adds 15 min per visit | +$640 | $0 | 1 (90% booked) |
| Members add $60/mo of other repairs | +$2,590 | +$1,950 | 1 |

**One unmeasured number decides 50 members.** At up to 1.67 hours per visit, one technician suffices and the month is about +$640. At 1.75 hours a second is needed and the month is about −$6,847, a swing of roughly $7,500.

At 75 members the same line sits between 1.0 and 1.25 hours: +$6,443 with one technician, −$1,064 with two.

## 6. Cash to get there

Members grow evenly from zero, a technician is hired from the first month, and vehicles are set up as the model needs them.

| Time to reach 50 members | Most cash needed | Running total on arrival |
|---|---|---|
| 6 months | $47,217 | −$46,577 |
| 9 months | $62,708 | −$62,068 |
| 12 months | $77,966 | −$77,326 |
| 18 months | $109,178 | −$108,539 |

One-time spending is $21,400 to open ($3,000 set-up plus $18,400 for the first van and rig) and $11,200 more when the second van is added.

The first version put the capital need at $45–60K with three or four months of runway. That understated it: reaching 50 members in 12 months costs about $78K and is still not paid back on arrival. Early months lose $5,000–10,000 each because a full technician, two vehicles, insurance and overhead are paid before the members exist.

## 7. Rules that apply (Florida, verified)

- **The Motor Vehicle Repair Act covers this business.** It names "mobile motor vehicle repair shops" and defines repair as "all maintenance of and modifications and repairs to motor vehicles, and diagnostic work incident thereto" (§559.903).
- **Written estimates.** Above $150 a written estimate has to be prepared before any diagnostic or repair work, and the customer signs a disclosure choosing to request an estimate, decline one or set a dollar cap (§559.905).
- **Overruns.** A shop may not "charge more than the written estimate plus $10 or 10 percent, whichever is greater, but not to exceed $50" without the customer's authorization (§559.909).
- **Workers' compensation** is required at four or more employees, counting owners who are corporate officers or LLC members.
- **Building access.** Associations commonly require a certificate of insurance before a vendor starts, often with the association as additional insured, at limits around $1M per occurrence. Some restrict vehicle maintenance on their premises.

Not checked, and worth a lawyer and an accountant: how the estimate rules apply to work included in a membership, local business tax receipts, and sales tax on parts and labor.

## 8. Risks

1. **Visit time is unknown**, and at 50 members it decides between a small profit and a large loss. Garage and valet handoff in condo towers may add time that a driveway job does not.
2. **Segment size is unmeasured** (Section 2).
3. **Tier mix.** A shift toward Essential costs about $1,800 a month at 50 members.
4. **Buildings can refuse access** or bar fluid work in garages, which would remove oil changes from the at-home promise.
5. **The launch is the expensive part.** Every month spent below 48 members costs money.
6. **The owner is unpaid** throughout these figures.

## 9. What to do next

1. Run a paid pilot with 10–15 founding members and one van, with the owner or one technician. Measure four things on every visit: technician time including access and travel, visits booked per tier, which tier people choose, and what members buy beyond the membership.
2. Put those four numbers into Assumptions. The model then becomes a forecast instead of a range.
3. Agree the second technician only when the first is above about 85% booked.
4. Before any real client data: sign-in for the admin console and APIs, one price list that the app, the concierge and the deck all read, and a written estimate and authorization step.

## 10. Corrections to the first version

| First version said | Corrected |
|---|---|
| U.S. mobile repair market $4.27B → $7.09B | Worldwide. North America is 42% of it |
| Essential sold at cost ($112 cost vs $119) | Direct cost $66, margin 44% |
| 50 members need 2 technicians, 85 jobs, about $6,300 of materials | 1 technician, 80 visits plus 15 details, about $1,590 |
| À-la-carte revenue $5,250 a month at 50 members | $1,544, from wear rates |
| Loss of about $4,228 a month at 50; profit $1,200 at 100 | +$640 at 50; +$4,718 at 100 |
| "Levers" that would add $4–6K a month | Withdrawn. They were never computed |
| Capital need $45–60K | About $78K for a 12-month ramp to 50 |
| Materials list of fixed quantities | Quantities derived from vehicles and wear rates |
| No vehicle for the detailer | One detailing rig per detailer |
| Miami Beach 22% over $200K; luxury sales stat; concierge price band | Withdrawn as unverified or outdated |

## 11. Sources

Opened and read:

- Mordor Intelligence, [Mobile Automotive Repair Services Market](https://www.mordorintelligence.com/industry-reports/mobile-vehicle-repair-service-market)
- U.S. Bureau of Labor Statistics, OEWS May 2025, occupation 49-3023, public API. Miami metro series `OEUM0033100000000493023xx`, Florida `OEUS1200000000000493023xx`, national `OEUN0000000000000493023xx`. Which series is which percentile was inferred from the values; the hourly mean and the annual mean agree at 2,080 hours.
- [YourMechanic support](https://www.yourmechanic.com/support)
- [PartsTech, parts markup matrix](https://www.partstech.com/parts-markup-matrix)
- Florida Statutes [§559.903](https://www.leg.state.fl.us/statutes/index.cfm?App_mode=Display_Statute&URL=0500-0599/0559/Sections/0559.903.html), [§559.905](https://www.flsenate.gov/laws/statutes/2025/559.905), [§559.909](https://www.flsenate.gov/laws/statutes/2025/559.909)
- [Florida Division of Workers' Compensation, coverage requirements](https://www.myfloridacfo.com/division/wc/employer/coverage-requirements)
- [The HOA Guide, vendor insurance requirements](https://www.thehoaguide.com/hoa-insurance-reserves/hoa-vendor-insurance-requirements)

Search summaries only, not opened: battery life 3–5 years; brake pads 30,000–70,000 miles; cabin filter about 15,000 miles; on-site oil change 20–45 minutes and diagnostics 30–60 minutes; Miami detailer pay $15–20 an hour; cargo-van leases $700–850 a month; express car-wash memberships $20–50 a month; insurance about $180–360 a month for a solo operator. Indeed, ZipRecruiter and Insureon's cost figures could not be opened, so they are not used.

Everything else in the model is an assumption and is labelled as one on the tab.
