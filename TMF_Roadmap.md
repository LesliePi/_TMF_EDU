# TMF — agreed roadmap

**Status:** planning only. No code written against this yet.
**Agreed:** 15 August 2026, Tatai László
**Current artefact:** TMF Full Chain Analyser v2.2, verified, packaged, not yet published.

---

## Standing decisions

| Decision | Choice | Rationale |
|---|---|---|
| The furnace `h_gas` defect | **Slider, 30–2025 W/m²K, default ≈ 60** | The physically correct gas film becomes the default; the known-wrong water-side value stays reachable as the top of the range, labelled. The defect becomes a teaching instrument instead of either vanishing or festering. |
| Impedance panel layout | **Fewer charts, not more** | One composite log figure replaces the separate ladders; the τ ladder is retired into labels because on the two film paths τ carries the same information as Z. |
| Typography | **Size floor *and* contrast** | Measured: 81 % of SVG text is ≤ 8 px; the dominant label colour scores 2.43:1 against a 4.5:1 minimum. |
| Scope of the new "design" line | **After v2.2 closes** | v2.2 ships in a releasable state first. The Reddit/Pages launch is not blocked by the new line. |
| Wall-thickness "impedance matching" | **Dropped — no interior optimum** | q is monotone in t. At the correct h_gas the wall carries 3.45 % of total resistance; doubling it moves flux by −3.3 %. Not a tunable variable. |

---

## v2.2 close-out — four items, in this order

### 1. Typography

- Dim label colour `#3d5268` → **`#6b86a0`** (2.43:1 → **5.17:1**, passes 4.5:1, same hue family so the visual character survives).
- Size floor **11 px**; 9–10 px → 12 px; headers → 13–14 px.

**Risk — the largest edit made to this file so far.** Moving 81 % of the text from ~8 px to 11 px is ~1.4× linear growth. Panel layouts will not survive it unattended: labels will collide and overflow. Cannot be done by global find-and-replace. Must be done panel by panel, all 13, each verified by screenshot.

Do the colour first (cheap, no layout impact), then the size.

### 2. `h_gas` slider

Range 30–2025 W/m²K, default ≈ 60, top of range labelled *"water-side value — the known defect (v2.1 and earlier)"*.

What moves as it is dragged, and what makes this worth building:

| | h_gas = 2025 (old) | h_gas = 60 (default) |
|---|---|---|
| Z_conv | 4.94e-4 | 1.67e-2 |
| Radiation's share of flux | 16.0 % | **86.6 %** |
| q | 2349 kW/m² | **501 kW/m²** |
| 1/Bi | 6.2 | 208 |
| Z_cond share of total | 16.2 % | **3.45 %** |

The ladder does not shift — it **re-orders**. Z_conv crosses to the far side of Z_rad and radiation takes back the dominance that physical intuition expects of a furnace.

**Consequence to state on the panel:** the geometric-looking progression of the three impedances (ratios ≈ 6.5 / 6.17) exists *only* at the old, wrong h. At the correct value the ratios are 0.155 and 208. The defect was not only distorting a number — it was distorting the design intuition, by making the wall look like a lever it is not.

**Doc impact:** white paper §8 and §10.1, audit §2.6 item 13. Carry them together after this item, not piecemeal.

### 3. Log ladder + linear bar

One horizontal log axis (~1e-5 … 1e-1 K·m²/W) carrying the three resistance markers.

- **Gaps annotated with the named dimensionless group:** `1/Bi` between cond and conv, `h_conv/h_rad` between conv and rad; total span in decades.
- **τ gets labels, not its own chart** — 39.8 s / 7.6 s / 0.62 s under the markers, plus one line: *on the two film paths the τ ratio equals the Z ratio; only conduction adds new information.*
- **Below it, a thin linear stacked bar** = the actual, additive budget: `Z_gas | Z_cond` (two segments, because that is the real series structure). A second thin bar for the parallel flux split.

Log shows structure and ratios; linear shows the budget that actually adds up. Keeping them separate is the point — a log axis cannot show a sum.

### 4. Percentage denominators

Currently four percentages against **two different denominators**: `Z_rad_pct` / `Z_conv_pct` divide by the superseded series sum, `Z_gas_pct` / `Z_cond_pct` by the correct `Z_total`. They sit side by side and look comparable. They are not.

Fix: one denominator (`Z_total`); the legacy figure kept but explicitly labelled *"legacy (v2.1, superseded)"* so the audit trail survives without inviting the comparison.

---

## v2.3 — the design line

Agreed to build all three established items. They are established physics, not novelty — and that is the point: they are the credibility that the one genuine claim gets read under.

### A. Δp ↔ h trade (entropy generation minimisation)

**The missing half of a model we already half-have.** The Dean factor (1.35) is in on the heat-transfer-enhancement side; the pressure-drop cost is not. A one-sided model always optimises to a boundary — exactly the failure mode as the wall thickness. Any geometry optimiser run against the current code would conclude "more curvature is always better", which is false.

**This is a prerequisite, not an option, for anything spiral-shaped.**

### B. UA allocation slider

Given a fixed total conductance, how to split it between the hot end (boiler) and the cold end (condenser) to maximise power. This *does* have an interior optimum — classic finite-time thermodynamics, the same family as the Curzon–Ahlborn line already in v2.2.

Cheapest of the three: both ends' conductances and the CA reference already exist in the code.

### C. Cyclone ash separation

Centrifugal separation of ash to the wall, plus the slagging limit. Fuel-specific ash melting temperature is already carried (`ash_T`: wood chip 1200 °C, straw 780 °C). Straw would hit the limit immediately — which is a real and instructive result, not a modelling failure.

Serves the standing design constraint directly: **no waste streams.**

---

## v2.4 — the spiral, and the one thing that is actually new

### Prerequisite: σ propagation along the chain

**The model does not currently propagate σ.** `sig_mu_comb` (combustion) and the turbine's σ are separate, unconnected numbers. Build a spiral chamber today and it would lower the combustion σ while **nothing downstream moved** — the conjecture would not be tested at all.

This repeats the exact mistake η_TMF made before v1.9: a number that changes nothing cannot be wrong, and therefore cannot be interesting.

**So: σ propagation first, spiral second.** Otherwise the spiral panel is decoration.

### The spiral chamber

Four real effects, all in existing technology (cyclone furnaces and helically coiled steam generators are operating machines, not speculation):

1. Dean vortices → higher h *(already in the model)*
2. Longer residence time per unit volume → better burnout, lower CO
3. Centrifugal ash separation to the wall → **the no-waste constraint**
4. Counter-effect: wall slagging when the wall runs hot

**And the reason it matters to TMF specifically:** a swirl chamber is, in the framework's own vocabulary, a **σ-reducing machine**. Mixing is what swirl is for. So the spiral is not merely a design idea — it is a **test bed for the conjecture**: reduce σ_T by mixing, predict a work gain, measure whether it appears.

---

## What is established and what is the claim

The same ratio the white paper's translation table reports, and it should be stated the same way:

| | Status |
|---|---|
| Dean / helical-coil h enhancement | **Well-trodden.** Correlations exist; testable against literature. Not novel. |
| Cyclone ash separation | **Existing technology.** Not novel. |
| UA allocation optimum | **Established theorem.** Testable in-model today. Not novel. |
| Δp ↔ h optimum (Bejan EGM) | **Established.** Not novel. |
| **σ propagation along the chain + the spiral as a σ-reducer → measurable work gain** | **The claim. This one is the author's, and this one can be wrong.** |

Four rows of known physics carrying one row of claim. That is the structure that gets the claim read seriously.

---

## Literature to check before building v2.3/v2.4

Not yet verified to the standard of the white paper's §13 — treat as leads, confirm before citing:

- Bejan's optimal allocation of heat-exchange equipment (finite-time / irreversible power plant theory) — for item B.
- Bejan, entropy generation minimisation applied to duct flow, for the Δp ↔ h optimum — for item A.
- Cyclone furnace / cyclone boiler literature on ash capture and slagging — for item C.
- Helically coiled steam generator heat-transfer correlations — for the spiral.

---

## Open

- GitHub Pages not confirmed live; still blocks the Reddit launch.
- Reddit post and YouTube video: discussed, not finalised.
- Dynamic/transient model: τ values computed but not integrated. Still the largest missing capability.
