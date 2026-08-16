# TMF — agreed roadmap

**Status:** the v2.2 close-out is **complete**. All four items shipped.
**Agreed:** 15 August 2026, Tatai László
**Current artefact:** TMF Full Chain Analyser **v2.2.2**, verified, packaged, not yet published.

---

## Standing decisions

| Decision | Choice | Rationale |
|---|---|---|
| The furnace `h_gas` defect | **Slider, 5–2025 W/m²K, default ≈ 60** | The physically correct gas film becomes the default; the known-wrong water-side value stays reachable as the top of the range, labelled. The defect becomes a teaching instrument instead of either vanishing or festering. |
| Impedance panel layout | **Fewer charts, not more** | One composite log figure replaces the numeric ladder; the τ ladder is retired into labels because on the two film paths τ carries the same information as Z. |
| Typography | **Size floor *and* contrast** | Measured: 81 % of SVG text was ≤ 8 px; the dominant label colour scored 2.43:1 against a 4.5:1 minimum. |
| Scope of the new "design" line | **After v2.2 closes** | v2.2 ships in a releasable state first. The Reddit/Pages launch is not blocked by the new line. |
| Wall-thickness "impedance matching" | **Dropped — no interior optimum** | q is monotone in t. At the correct h_gas the wall carries 1.6 % of total resistance; doubling it moves flux by ~3 %. Not a tunable variable. |
| Parallel-branch "% of resistance" | **Removed, not relabelled** | A resistance share is only defined for resistances in series. Parallel branches divide conductance — already carried, correctly, by `flux_rad` / `flux_conv`. |

---

## v2.2 close-out — four items — ALL DONE

### 1. Typography — DONE in v2.2.1

Dim label colour `#3d5268` → `#6b86a0` (2.43:1 → **5.17:1**). An 11 px
**rendered-pixel** floor enforced centrally in `txt()` with a width guard:
smallest text 8.4 → 11.0 px at 1600 and 6.7 → 11.0 px at 1280, with **zero new
overflow**. Duplicate CSS/SVG panel headers de-duplicated (pre-existing, exposed
not caused).

### 2. `h_gas` slider — DONE in v2.2.1

Both film coefficients were wrong and were hiding each other. `h_straight = 1500`
was a **water-side** coefficient on the gas side; `eps_flame = 0.85` implied a gas
emissivity of 0.88, a near-black-body flue gas. Corrected defaults give
h_rad 123 · h_gas 81 · radiation 60 % of flux · **q = 233 kW/m²**, inside the
realistic 100–300 band. Both are sliders; the old values remain reachable and
labelled.

### 3. Log ladder + linear bar — DONE in v2.2.2

One horizontal log axis, 1e-5…1e-1 m²K/W, four markers (`Z_cond`, `Z_gas`
dashed as the parallel result, `Z_rad`, `Z_conv`). Below it a thin **linear**
stacked bar for the additive budget `Z_gas | Z_cond`. Log shows ratios, linear
shows sums — a log axis cannot show a sum. The numeric table is gone; the panel
ends with fewer objects, not more.

τ became labels, as agreed, and the justification was re-measured rather than
asserted: τ_rad/τ_conv = 0.6603 and Z_rad/Z_conv = 0.6603, identical to four
figures. Only τ_cond adds information. `h` is not printed at all — on the film
paths h ≡ 1/Z exactly.

**Correction to this document's earlier wording.** `1/Bi` was placed on the
cond ↔ conv gap. Bi is defined on the **total** external film, Bi = h_gas·t/k, so
`1/Bi = Z_gas/Z_cond = 61.4` and it names the **cond ↔ Z_gas** gap. The
cond ↔ conv ratio is 154.3, which is 1/Bi with the convective film alone. The
panel uses the standard definition. `h_conv/h_rad = 0.66` could not be annotated
in place — that gap is 0.18 decades wide — so it is reported in the header line
alongside the 2.19-decade span.

### 4. Percentage denominators — DONE in v2.2.2

Two findings on inspection of the shipped code:

- `Z_rad_pct` / `Z_conv_pct` were already **dead exports** — computed and
  returned, never rendered. The "four percentages side by side" had already
  stopped being visible on screen.
- The quantity itself is meaningless in the corrected circuit. Unifying on
  `Z_total` would give two numbers summing to 410 %.

So they are **removed**. `Z_series_legacy` stays on the panel in red, so the v2.1
defect remains auditable, and a new line states the distinction plainly.

---

## v2.3 — the design line (agreed, not started)

All three "established physics" items were approved. They are not novel; they
are the credibility the one real claim gets read under.

### A. Δp ↔ h trade (entropy generation minimisation)

**The missing half of a model we already half-have.** The Dean factor (1.35) is
in on the heat-transfer-enhancement side; the pressure-drop cost is not. A
one-sided model always optimises to a boundary — exactly the failure mode as the
wall thickness. Any geometry optimiser run against the current code would
conclude "more curvature is always better", which is false.

**This is a prerequisite, not an option, for anything spiral-shaped.**

### B. UA allocation slider

Given a fixed total conductance, how to split it between the hot end (boiler) and
the cold end (condenser) to maximise power. This *does* have an interior optimum
— classic finite-time thermodynamics, the same family as the Curzon–Ahlborn line
already in v2.2. Cheapest of the three: both ends' conductances and the CA
reference already exist in the code.

### C. Cyclone ash separation

Centrifugal separation of ash to the wall, plus the slagging limit. Fuel-specific
ash melting temperature is already carried (`ash_T`: wood chip 1200 °C, straw
780 °C). Straw would hit the limit immediately — a real and instructive result,
not a modelling failure. Serves the standing design constraint directly:
**no waste streams.**

---

## v2.4 — the spiral, and the one thing that is actually new

### Prerequisite: σ propagation along the chain

**The model does not currently propagate σ.** `sig_mu_comb` (combustion) and the
turbine's σ are separate, unconnected numbers. Build a spiral chamber today and
it would lower the combustion σ while **nothing downstream moved** — the
conjecture would not be tested at all.

This repeats the exact mistake η_TMF made before v1.9: a number that changes
nothing cannot be wrong, and therefore cannot be interesting.

**So: σ propagation first, spiral second.** Otherwise the spiral panel is
decoration.

### The spiral chamber

Four real effects, all in existing technology (cyclone furnaces and helically
coiled steam generators are operating machines, not speculation):

1. Dean vortices → higher h *(already in the model)*
2. Longer residence time per unit volume → better burnout, lower CO
3. Centrifugal ash separation to the wall → **the no-waste constraint**
4. Counter-effect: wall slagging when the wall runs hot

**And the reason it matters to TMF specifically:** a swirl chamber is, in the
framework's own vocabulary, a **σ-reducing machine**. Mixing is what swirl is
for. So the spiral is not merely a design idea — it is a **test bed for the
conjecture**: reduce σ_T by mixing, predict a work gain, measure whether it
appears.

---

## What is established and what is the claim

| | Status |
|---|---|
| Dean / helical-coil h enhancement | **Well-trodden.** Correlations exist; testable against literature. Not novel. |
| Cyclone ash separation | **Existing technology.** Not novel. |
| UA allocation optimum | **Established theorem.** Testable in-model today. Not novel. |
| Δp ↔ h optimum (Bejan EGM) | **Established.** Not novel. |
| **σ propagation along the chain + the spiral as a σ-reducer → measurable work gain** | **The claim. This one is the author's, and this one can be wrong.** |

Four rows of known physics carrying one row of claim. That is the structure that
gets the claim read seriously.

---

## Literature to check before building v2.3/v2.4

Not yet verified to the standard of the white paper's §13 — treat as leads,
confirm before citing:

- Bejan's optimal allocation of heat-exchange equipment (finite-time /
  irreversible power plant theory) — for item B.
- Bejan, entropy generation minimisation applied to duct flow, for the Δp ↔ h
  optimum — for item A.
- Cyclone furnace / cyclone boiler literature on ash capture and slagging — for
  item C.
- Helically coiled steam generator heat-transfer correlations — for the spiral.

---

## Open

- **`FullChain_audit.md` has not yet been updated for v2.2.2.** It still carries
  the v2.2.1 header and lineage, and §2.6 does not mention the removal of the
  parallel-branch percentages. Small edit, not yet made.
- GitHub Pages not confirmed live; still blocks the Reddit launch.
- Reddit post and YouTube video: discussed, not finalised.
- Dynamic/transient model: τ values computed but not integrated. Still the
  largest missing capability.
