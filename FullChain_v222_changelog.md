# TMF Full Chain Analyser — v2.2.2 changelog

**Date:** 15 August 2026 · **Author:** Tatai László · CC BY 4.0
**Scope:** closes the last two open items of the v2.2 line (roadmap items 3 and 4).
**Files touched:** `TMF_FullChain_Simulator_v22.html` only. One function, one panel.

---

## What changed

Both changes live in tab 6 (IMPEDANCE), panel `svg-imp-breakdown`, plus the
removal of two dead exports in `calcImpedance()`.

### Item 3 — log ladder + linear bar (replaces the numeric table)

The `Z / h / flux / τ` table is gone. In its place:

**A horizontal log axis**, 1e-5 … 1e-1 m²K/W, carrying four markers:

| marker | value | position | note |
|---|---|---|---|
| `Z_cond` | 8.00e-5 | alone, two decades left | label sits under its own tick |
| `Z_gas` | 4.91e-3 | dashed | the **parallel result**, not a fourth path |
| `Z_rad` | 8.15e-3 | | |
| `Z_conv` | 1.23e-2 | | |

The three gas-side values fall inside 0.4 decades, so their labels cannot sit
under their own ticks. They stack as a left-aligned legend with a leader line to
each tick. **The crowding is not a drawing problem — it is the result:** at the
corrected coefficients the two films are nearly the same size and the wall is
two decades away.

**Gap annotations, each named by the dimensionless group that *is* that gap:**

- `1/Bi = 61` on the cond ↔ Z_gas gap, annotated in place.
- `h_conv/h_rad = 0.66` reported in the header line, **not** in place — that gap
  is 0.18 decades wide and no label fits between the two ticks.
- `span 2.19 decades`, header line.

**τ is retired into the marker labels**, as agreed. Justification, re-measured on
the shipped file rather than asserted: on both film paths τ = ρ·c·t/h, so
τ_rad/τ_conv = 0.6603 and Z_rad/Z_conv = 0.6603 — identical to four figures. Only
τ_cond (0.62 s) carries independent information.

`h` is **not** printed on the markers. On the film paths h ≡ 1/Z exactly, so it
would be the same number written twice.

**Below the axis, a thin linear stacked bar**: `Z_gas 98.4 % | Z_cond 1.6 %`,
captioned with `Z_total = 4.99e-3 m²K/W`. This is the only additive
decomposition in the circuit. A log axis shows ratios and cannot show a sum;
keeping the two separate is the point.

### Item 4 — percentage denominators

`Z_rad_pct` and `Z_conv_pct` are **removed**, not relabelled.

Two findings from reading the shipped code rather than the roadmap:

1. They were already **dead exports**. Both were computed in `calcImpedance()`
   and carried in the returned object, but neither was rendered anywhere in the
   UI. The "four percentages side by side" the roadmap describes had already
   stopped being visible; only `Z_gas_pct` / `Z_cond_pct`, both against
   `Z_total`, reached the screen.
2. More importantly, **the quantity itself has no meaning in the corrected
   circuit.** A "share of resistance" is only defined for resistances in series.
   Radiation and convection are in parallel: they divide *conductance*, and that
   share is already carried, correctly, by `flux_rad` / `flux_conv` (60 % / 40 %).
   Unifying the denominator on `Z_total` would have produced two numbers summing
   to 410 % — mathematically consistent and physically meaningless.

The legacy series sum survives as `Z_series_legacy` and stays on the panel in
red, so the v2.1 defect remains auditable. A new line states the distinction
plainly: *"Energy takes both routes at once — parallel branches divide
CONDUCTANCE (flux 60/40), not resistance."*

### Correction to the roadmap text

The roadmap placed `1/Bi` on the cond ↔ conv gap. The Biot number is defined on
the **total** external film, Bi = h_gas·t/k, so 1/Bi = Z_gas/Z_cond = 61.4 and it
names the **cond ↔ Z_gas** gap. The cond ↔ conv ratio is 154.3, which is 1/Bi
computed with the convective film alone. The panel and this changelog use the
standard definition. `[PROVEN]` — definition, not a fit.

### Incidental

- Circuit sketch tightened by 10 units to make vertical room. Geometry only.
- Linear-bar caption baseline moved clear of the bar's bottom border stroke; the
  underscores in `Z_gas` / `Z_total` were being erased by it.
- Marker leader lines are inserted **before** their labels in document order, so
  that when a slider re-orders the ladder the leader passes behind the glyphs
  instead of through them.
- Version strings bumped `v2.2` → `v2.2.2` (title, header, footer).

---

## Verification

### Physics — unchanged, and proved unchanged

`node FullChain_verify_v22.js`

| check | result |
|---|---|
| tabs | 13/13 ok |
| Carnot sweep | 13 316 cases · **0 violations** |
| Carnot sweep with σ live | 7 920 cases · 0 violations · 0 η_TMF > η_cl · 0 convergence failures |
| second law | 408 cases · 0 failures |
| console errors | 0 |
| nominal point | Q_boiler 709.1 kW · ṁ 0.2257 kg/s · T̄ 252.8 °C · η_cl 32.27 % · η_C 39.50 % · P_elec 207.1 kW · η_total 22.48 % · EROI 6.22 |

`node harvest_paper.js`, diffed field by field against the pre-change run:
**every numeric value is bit-identical** except `Z_rad_pct` and `Z_conv_pct`,
which are the two removed by design. That is the whole diff.

### UI — no regression against the v2.2.1 baseline

`node FullChain_qa.js all`, run against `_baseline.html` and the new file:

| metric | baseline | v2.2.2 | reference |
|---|---|---|---|
| overlapping label pairs | 10 | **10** | 10 |
| overflowing panels | 8 | **8** | 8 |
| distorted panels | 8 | **8** | 8 (deferred) |
| min rendered px @1600 | 10.2 | **10.2** | — |
| min rendered px @1280 | 8.0 | **8.0** | — |
| labels under 10 px @1280 | 32 (5.7 %) | **31 (5.5 %)** | — |
| capped by width @1600 | 18 | **16** | — |

No panel in tab 6 appears in the overflow or collide lists. Two intermediate
drafts *did* raise overflow to 9 — the first wording of the conductance line was
138 characters and could not fit at any size above the floor. It was shortened
rather than allowed to shrink below the floor.

### Re-ordering test — the defect state still demonstrates the defect

With `h_gas = 2025` and `ε_gas = 0.85` dialled back in (the v2.2 defect, both
values still reachable at the top of their slider ranges):

- the ladder **re-orders** — Z_conv 3.66e-4 crosses to the left of Z_rad 2.88e-3
- span collapses 2.19 → **0.66 decades**; h_conv/h_rad flips 0.66 → **7.86**
- 1/Bi drops 61 → **4**; the wall's share of the linear bar jumps 1.6 % → **19.8 %**
- q = 2872 kW/m², the red warning fires
- panel-local check in that state: **0 collisions, 0 overflow, 0 page errors**

The re-ordering the roadmap predicted is now something you watch happen on one
axis instead of something you infer from a table.

---

## Still open after this release

Unchanged from `FullChain_audit.md` §2.6 and the context card §4b:
SVG aspect distortion (8 panels, deferred) · pre-existing overflow (8 panels,
2 pathological) · 10 overlapping label pairs · 35 sub-10 px labels at 1280 ·
Dean factor side-of-wall question · no gas-emissivity correlation ·
σ_μ = RSS independence · K = 0.15 fitted to nothing · no dynamic model ·
first-order EROI · no cost model.

Next line is v2.3 (Δp ↔ h trade, UA allocation, cyclone ash) — unstarted.
