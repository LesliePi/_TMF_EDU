# TMF Full Chain Analyser v1.7 — audit, scope & limitations

**Scope & Limitations, assumption register, and verified invariants.**

This document exists so that someone who did not write the code can find the
weak points quickly. It is deliberately blunt about what is unproven. If you
only read one section, read **§2 Scope & Limitations** — it lists what this tool
is *not*, which is where most misreadings would start.

- Artefact: `TMF_FullChain_Simulator_v19.html` — single file, no build step, no network
  dependency except a Google Fonts stylesheet (the app works offline without it).
- Author of the model: Tatai László, 2026. Project: Thermodynamic Manifold (TMF).
- Lineage: v1.5 → v1.6 (14 defect fixes) → v1.7 (Rankine core replaced with the
  separately validated `TMF_Rankine_Simulator_v32` implementation). Inline
  `[FIX v1.6]` / `[FIX v1.7]` comments state what each change was and why.

---

## 1. Status marker convention

Every constant and relation in the source carries one of three markers. Please
respect the distinction when reviewing — the three deserve different scrutiny.

| Marker | Meaning | Reviewer's question |
|---|---|---|
| `[PROVEN]` | Standard, externally verifiable physics or published tabulated data | Is it transcribed correctly and used inside its validity range? |
| `[NUMERICAL]` | Engineering estimate or calibration constant; plausible, not derived | Is the value defensible, and how much does the output move if it is wrong? |
| `[CONJECTURE]` | Part of the TMF hypothesis itself; not established | Is it at least internally consistent and clearly labelled as a hypothesis? |

**The single most important thing to understand:** the σ_μ → Δη relation is a
`[CONJECTURE]`. It is the claim the framework exists to test. Nothing in this
tool validates it — the tool *assumes* it and shows consequences. Treat every
η_TMF number as conditional on that assumption.

---

## 2. Scope & Limitations

### 2.1 What this tool is

A **steady-state, single-point design explorer** for a small biomass-fired
Rankine plant (nominal ~200 kW electrical), plus an instrumentation layer:
thermodynamic impedance matching, an acoustic resonance model, a composite
"chaos" health metric, a hash-chained data log, and a marginal-gain sensitivity
view that ranks every lever by what it is actually worth at the terminals.

It is intended for **exploring parameter sensitivity and for arguing about the
TMF hypothesis**. Numbers are self-consistent to within the assumptions listed
in §3.

### 2.2 What this tool is *not*

Please do not use it for any of the following, and treat any claim that it
supports them as unfounded:

1. **Not a plant design or sizing tool.** No component is dimensioned. Heat
   exchanger area, tube count, turbine stage geometry, condenser duty and
   cooling water flow do not exist in the model.
2. **Not transient.** Everything is steady state. There is no start-up,
   shutdown, load-following, thermal inertia or controller dynamics. The
   "LIVE ANIMATION" tab animates a *path through a fixed cycle*, not a
   time-domain simulation. The "CHAOS K" tab's rolling history is a repeated
   evaluation of the same steady state, not a time series of a dynamic system.
3. **Not a safety, certification or emissions tool.** The HCl and slagging flags
   are two-line heuristics on fuel chlorine and ash-fusion temperature. There is
   no NOx, CO, particulate or dioxin model at all.
4. **Not validated against a physical plant.** No measurement from a real
   machine has been compared to any output. The IAPWS property layer is
   validated (§4.4); nothing downstream of it is.
5. **Not an economic model.** EROI is a first-order energy ratio with one
   assumed upstream factor (§3.6). There is no cost, no capex/opex, no price.
6. **The σ inputs are not computed.** σ_T, σ_ρ, σ_v are *user-set sliders*, not
   derived from geometry, Reynolds number or CFD. The tool cannot tell you what
   σ_μ your machine has; you must supply it. This is the largest practical gap
   between the framework and an application.

### 2.3 Modelling simplifications inside the Rankine cycle

- Single-stage expansion. **No reheat, no regenerative feedwater heating, no
  bleed extraction, no deaerator.** A real plant of this class would likely have
  at least one of these, and each would raise η by several points.
- **No pressure drop anywhere** — not in the boiler tubes, the superheater, the
  piping or the condenser. Boiler pressure is exactly `P_sat(T_boil)` and
  turbine exit pressure is exactly `P_sat(T_cond)`.
- **No heat loss from piping or casing**, other than the lumped `f_rad` factor
  in the combustion step and the boiler efficiency slider.
- Turbine and pump are represented **only** by isentropic efficiencies. No
  partial-admission, windage, leakage or off-design behaviour.
- Above the saturation dome the superheated-steam property tables cover
  **1–200 bar and up to 650 °C**. Requests outside that box are clamped to the
  edge of the table, not extrapolated. At `T_boil > 365 °C` the cycle is close to
  the critical point and the constant-cp assumptions degrade.
- The exhaust "dry" branch uses a constant-cp ideal-gas extension above the dome
  (`CP_VAP`, §3.3). That is a good approximation at condenser pressure
  (~0.1 bar) and a poor one at high pressure — it is only used at condenser
  pressure.

### 2.4 Layers that are illustrative rather than quantitative

Be sceptical of these; they are presented as visualisations of a framework, not
as predictions:

- **Tab 2, "UPHTT κ(μ) photon-coupling curve"** — the plotted curve is a
  synthetic sine shape, not evaluated from the model. Only the σ_μ_boiler figure
  beneath it is computed.
- **Tab 8, OTDD/DOTDD** — the operator T_θ = N∘S_ε∘E_η∘W∘D_α is *not*
  implemented. The convergence trace, kernel classification and ODI are
  illustrative renderings of the concept, driven by simple functions of σ_μ and
  N_branches. The spectral gap `gap = 1 − σ_μ/0.3` is a definition of
  convenience, not a computed spectral property of any operator.
- **Tab 9, K_hydro** — despite the name there is no hydraulic calculation. It is
  a weighted blend of a ΔT proxy, σ_v and a combustion-inhomogeneity term.
- The **σ_μ decomposition σ_μ² = σ_T² + σ_ρ² + σ_v²** assumes the three
  inhomogeneities are statistically independent. In a real duct they are
  strongly coupled (a temperature gradient *causes* a density gradient). This
  is a known, unaddressed weakness.


### 2.6 Known inconsistencies — things we know are wrong and have not fixed

Listed because a reviewer will find them anyway, and it is better that the list
comes from us. None of these is hidden in the code; the simulator says all of
them on screen.

**1. ~~The σ_μ layer does not feed the power chain.~~ RESOLVED in v1.9 — and read
what it cost.**

Through v1.8, `η_TMF` was computed, displayed, logged and charted, while shaft
work came from the real enthalpies alone. `∂P_elec/∂σ` was exactly zero: the
framework's central quantity had no effect on the framework's central output.

v1.9 closes it. The penalty is applied where the argument says it belongs — the
turbine's own irreversibility, since `κ_drive = κ_turbine`:

```
η_is,effective = η_is · (1 − Δ),    Δ = σ_μ² · κ_turb · KAPPA_SENS
```

solved as a fixed point (Δ → κ_turb → x₂ → Δ), which converges in 3–5 passes.
Applying it there rather than as a multiplier on `W_mech` keeps the downstream
state self-consistent: less work out ⇒ higher h₂ ⇒ drier exhaust ⇒ more heat
rejected ⇒ more entropy generated, all automatically.

**What it buys.** σ_μ now moves real output — 10.7 kW, 5.2% of P_elec, across the
slider range, monotonically. That is above the resolution of decent plant
instrumentation, so the conjecture is now falsifiable end to end: a σ-vs-output
experiment could confirm or refute it. Tab 12 draws exactly what such an
experiment would have to detect.

**What it costs, and this is not a footnote.** Every downstream number —
P_elec, η_total, EROI, the entire Sensitivity ranking — now inherits
`KAPPA_SENS = 0.15`, a `[CONJECTURE]` constant with no independent derivation. If
that constant is wrong, the plant output this tool reports is wrong with it. The
model has traded "safe but untestable" for "testable and possibly wrong", which
is the right trade for a hypothesis and the wrong one for a design tool. Anyone
using the numbers for engineering rather than for argument should set the σ
sliders to their minimum, which reduces Δ to ~1e-6 and recovers the classical
cycle to five decimals.

Verified after the change: 7 920-case sweep with the penalty live gives 0 Carnot
violations, 0 cases of η_TMF exceeding the classical reference, and 0
fixed-point convergence failures.

**2. Excess air λ has no effect on efficiency.**

`η_comb` depends only on fuel moisture. In reality more excess air means more
mass to heat and a larger stack loss, so η_comb should fall with λ. In the model
λ changes the flame temperature and the flue-gas temperature but not the
efficiency, so the Sensitivity tab correctly reports 0.00 kW for it. A stack-loss
term (Siegert-type) would fix this.

**3. `uphtt_eta` is displayed but never used.**

The boiler tab shows an "η_UPHTT" figure derived from the spiral-geometry bonus.
The energy balance uses the `eta_boil` slider instead. The displayed number
therefore overstates its own role — it looks like a result and behaves like
decoration.

**4. Two different, inconsistent numbers for the same physical claim.**

The spiral-geometry advantage appears as `geo_factor = 1.12` in the boiler and as
`dean_factor = 1.35` in the impedance module. Both are `[NUMERICAL]`, neither is
measured, and they cannot both be right about the same tube geometry.

**5. `AFR = 6.5` kg air/kg fuel is applied to every fuel.**

It is about right for dry wood. It is applied unchanged to straw, pellets and
biogas, where it is wrong — most severely for biogas.

**6. `d0 = 0.05 m` is hard-coded with no slider.**

Every geometric and acoustic result in tabs 7 and 8 scales off a header diameter
the user cannot change.

**7. Tab 8 (OTDD) computes nothing.**

The T_θ operator is not implemented. The tab is labelled CONCEPT, carries a
permanent warning bar, and every sidebar figure is marked ⚠ — but the charts
still look like output, and that is a presentation risk we are accepting rather
than removing the tab.

**8. The Chaos tab's rolling history is not a time series.**

It is the same steady state re-evaluated at animation rate. Nothing in the model
evolves in time.

**9. No mobile layout.**

Fixed 220 px control column plus dense panels at 7–9 px type. Below ~900 px a
notice is shown instead, because the alternative was a page that looks broken.

**10. Sensitivity ranking has no cost model.**

Tab 11 ranks by thermodynamic payback. "−2 % fuel moisture" and "+1 pp turbine
efficiency" appear side by side, and they cost wildly different amounts of money.
The tool cannot tell you which is the better investment, only which produces more
kilowatts.


### 2.7 The trajectory tab (tab 12) — what it is and is not claiming

On the (s, T) plane a steady-state cycle is a closed loop. It has to be; that is
what steady state means. There is no spiral there and drawing one would be
decoration.

The spiral in tab 12 comes from adding the coordinate the closed loop hides:
cumulative entropy exported to the surroundings. The working fluid returns to its
starting state every revolution; the universe does not. Plotted as
(s, T, ΣS_gen) the trajectory is a helix, and its pitch is the entropy generated
per revolution — expressed in the same kJ/kgK as the horizontal axis, so it can
be read off rather than admired.

**This is a change of representation, not new physics.** Every number in it is
ordinary second-law bookkeeping: turbine and pump irreversibility from the state
points, boiler and condenser irreversibility from heat crossing a finite
temperature difference, and Gouy–Stodola (X = T₀·Ṡ_gen) for the exergy. A
reviewer who checks the arithmetic will find nothing exotic, and that is
deliberate.

What the representation adds is comparability: the operating helix and the
classical σ-free helix are drawn together, so "inhomogeneity widens the spiral"
becomes something you look at instead of something you assert. Whether the
geometry carries explanatory power beyond the bookkeeping — whether the spiral is
a picture of the accounting or a picture of the mechanism — is precisely the open
question. The tab makes the question visible. It does not answer it, and it
should not be cited as if it did.

One result worth noting because it is robust and does not depend on any
conjecture: at default settings the largest single irreversibility is heat
crossing the flame-to-steam temperature gap — 70.8% of all entropy generated,
207 kW of destroyed work capacity against 206 kW of electrical output. The
turbine accounts for 16.2%. That ordering is an argument for recuperation and
lower excess air before it is an argument for better blades, and it holds
whatever KAPPA_SENS turns out to be.

### 2.5 Layers that are quantitative and worth attacking hardest

These make real, checkable claims:

- The **IAPWS property layer** and the closed Rankine cycle (§4).
- The **junction reflection coefficient** `R = (A₀ − ΣA_i)/(A₀ + ΣA_i)` and its
  consequence that Leonardo's d² law is exactly area-matched (R ≡ 0 for all N)
  while Murray's d³ law is not (ΣA_i/A₀ = N^⅓). This is standard 1-D duct
  acoustics and should be either confirmed or refuted cleanly.
- The **harmonic lock prediction**: under geometric self-similarity (constant
  L/d), Murray locks at N = k³ and Leonardo at N = k². The self-similarity
  assumption is the soft part — if L/d is not constant across header and
  branches, the frequency ratio is not d₀/d_i and the whole lock map moves.
- The **hash chain** in the DataLog (§4.5).

---

## 3. Assumption register

Every `[NUMERICAL]` and `[CONJECTURE]` constant, with what it does and how much
it matters. Search the source for the name to find it.

### 3.1 Combustion (`calcCombustion`)

| Constant | Value | Role | Sensitivity / attack surface |
|---|---|---|---|
| `AFR` (in `m_fg`) | 6.5 kg air/kg fuel | Stoichiometric air demand | ~Right for dry wood; wrong for biogas, where it is reused unchanged. **Known weakness: the same 6.5 is applied to every fuel in the database.** |
| `cp_fg` | 1.15 kJ/kgK | Mean flue-gas specific heat | T_flame ∝ 1/cp_fg. Real cp rises with temperature; a fixed value overestimates T at high load |
| `f_rad` | 0.95 | Fraction of heat release retained in the gas | Direct linear scaling of T_flame. Pure calibration |
| T_flame cap | 1900 °C | Ceiling | Only binds near λ = 1 with dry fuel |
| `eta_c` base / moisture slope | 0.87 / 1.4 | Combustion efficiency | Clamped to [0.55, 0.93]. Piecewise-linear fit, no physical derivation |
| `eta_heat_recovery` | 0.88 − 0.08·(λ−1) | Sets flue-gas exit temperature | Drives the HCl dew-point flag |
| `sig_mu_comb` | 0.25 + 1.2·mc + 0.15·(λ−1) | `[CONJECTURE]` combustion inhomogeneity | Feeds K_hydro only |

### 3.2 Boiler (`calcBoiler`)

| Constant | Value | Role | Note |
|---|---|---|---|
| `geo_factor` | 1.12 (helical) | UPHTT spiral bonus | Asserted, not measured. This is the central UPHTT claim and has no support in the tool |
| `uphtt_eta` | min(0.98, 0.85·geo) | Displayed efficiency | **Display only — it does not feed the energy balance.** Q_avail uses the `eta_boil` slider |
| `sig_mu_boil` | 0.08 + ΔT_sh/5000 | `[CONJECTURE]` | Display only |

### 3.3 Rankine core (`rankineCycle`)

| Constant | Value | Role | Note |
|---|---|---|---|
| `CP_VAP` | 1.95 kJ/kgK | Ideal-gas extension above the dome | Used only at condenser pressure, where it is a good approximation |
| `KAPPA_SENS` | 0.15 | `[CONJECTURE]` Δη sensitivity | **The core free parameter of the framework.** Δη scales linearly with it |
| `kap_sh` | 1 + 0.3·ΔT_sh/200 | `[NUMERICAL]` | |
| `kap_turb` | 1 + 0.5(1−η_t) + 0.4(1−x₂) + 0.6σ² | `[NUMERICAL]` — this is `kap_drive` | Every coefficient is asserted |
| `kap_cond`, `kap_pump`, `kap_boil` | see source | `[NUMERICAL]` | Computed and displayed, but only `kap_turb` scales Δη |
| η_TMF floor | 0.55 | Prevents Δη from eating the whole cycle | Arbitrary guard |

`kap_drive = kap_turb` is a deliberate choice: `kap_peak` is essentially always
`kap_boil` (1.72 vs 1.15 at defaults), i.e. it is dominated by the boiler's
latent heat, whereas the entire σ_μ argument is about the turbine inlet. Set
`kap_drive = kap_peak` in the source to see the alternative.

### 3.4 Generator (`calcGenerator`)

| Constant | Value | Role |
|---|---|---|
| `K_LOAD` / `K_FIX` | 0.55 / 0.45 | Split of rated loss into load-dependent (copper) and fixed (iron + windage + stray) |
| Fixed-loss sub-split | 0.55 / 0.36 / 0.09 | Fe / windage / fixed stray |
| Stray-load coefficient | 0.10·P_Cu | Stray load loss tracks copper |
| Droop | `P.slip` slider | f = 50·(1 − slip·(P/P_nom − 1)) |

This is a **loss-budget model, not a machine-equation model**. There is no
equivalent circuit, no reactance, no excitation. cos φ enters only through
S = P/cos φ in the copper term.

### 3.5 Impedance and acoustics (`calcImpedance`)

| Constant | Value | Note |
|---|---|---|
| `eps_flame` | 0.85 | Combustion-gas emissivity |
| `T_wall` | T_boil + 50 K | Furnace wall temperature |
| `h_straight` | 1500 W/m²K | Baseline convective coefficient |
| `dean_factor` | 1.35 (helical) | Second, independent UPHTT bonus — **note this is a different number from the boiler's 1.12 for the same physical claim** |
| wall / λ_steel | 4 mm / 50 W/mK | `[PROVEN]` material data |
| `d0` | 0.05 m | Header diameter — **hard-coded, no slider**. Everything geometric scales off it |
| `lambda_imp`, ΔS coefficient | 0.8, 3.5 | `[CONJECTURE]` entropy penalty |
| `eta_taper` (step) | 0.94 | Step-reducer penalty |
| Node limit | ≤5 OK, ≤8 WARN | TMF "junction catastrophe" claim, asserted |
| `W0_TONGUE` | 0.12 | Arnold-tongue base capture width. Calibrated so 2:1 captures broadly and orders beyond ~5:4 do not |
| `thermal_drive` | (T_flame − 700)/700, clamped | Rayleigh drive term |
| RI thresholds | 0.08 / 0.20 | LOW / MEDIUM / HIGH bands |

### 3.6 Chaos metric and EROI

| Constant | Value | Note |
|---|---|---|
| `SIGMA_MAX` | 0.55 | Normalisation for K_thermal = σ_μ/σ_max |
| K_hydro weights | 0.45 / 0.35 / 0.20 | ΔT proxy, σ_v, combustion term |
| `dT_ref` | 280 K | K_hydro ΔT normalisation |
| K_gen weights | 0.40 / 0.35 / 0.25 | Δf, slip, loss |
| K_gen normalisers | 2.5 Hz, 0.08, 0.12·P_nom | |
| K thresholds | 0.2 / 0.5 | STABLE / WARNING / CRITICAL |
| `upstream_factor` | 0.03 | Fossil energy invested ÷ delivered fuel LHV. **Sets EROI almost single-handedly** — EROI ≈ η_total/0.03. Published inventories put it at roughly 2–5% for wood chips; if you prefer 0.05, EROI drops from ~6 to ~3.7 |

---

## 4. Verified invariants

These are machine-checked in `FullChain_verify_v19.js` (headless Chromium). Re-run it to
reproduce. Results at the time of writing:

### 4.1 η_classic never exceeds its Carnot bound — 13 316 cases, 0 violations

Swept T_boil 100–340 °C × T_sh (T_boil+20)–560 °C × T_cond 20–90 °C × η_is
{0.60, 0.75, 0.85, 0.95}. 8 165 cases end wet, 5 151 end dry/superheated.

The reference is the **entropic mean temperature of heat addition**,
T̄ = (h₁ − h₄)/(s₁ − s₄), not T_sat(boiler). T_sat is *not* an upper bound once
the steam is superheated — using it is what let an earlier build report
efficiencies above "Carnot". The gap between η_Carnot(T̄) = 39.5% and
η_Carnot(T_sh) = 57.8% at defaults is the non-isothermal heat-input loss and is
displayed on the turbine tab.

### 4.2 Second law and cycle closure — 408 cases

- Entropy never decreases through the turbine: 0 failures.
- η_TMF ≤ η_classic everywhere: 0 failures.
- q_in > 0 everywhere: 0 failures.
- Boiler duty closes exactly: `Q_avail − m_steam·(h₁ − h₄) = 0.000 kW`, and the
  feedwater enthalpy equals the pump outlet to machine precision.

### 4.3 Pump work is continuous

v1.6 used a step function (40 bar above T_boil = 180 °C, 20 bar below). Across
that boundary the pump work is now 1.329 → 1.360 → 1.392 kJ/kg at 179/180/181 °C.

### 4.4 Property tables match published IAPWS values

| Quantity | This build | Published |
|---|---|---|
| h(100 bar, 500 °C) | 3375.1 kJ/kg | 3375.1 |
| s(100 bar, 500 °C) | 6.5993 kJ/kgK | 6.5994 |
| h(40 bar, 400 °C) | 3214.4 kJ/kg | 3214.5 |
| P_sat(300 °C) | 85.88 bar | 85.88 |
| P_sat(100 °C) | 1.0142 bar | 1.0142 |

### 4.5 DataLog hash chain

Each record embeds the SHA-256 of the previous one. Under a 40-writer burst
mixing timer ticks and WebSocket injections: **0 broken links, 32 unique
hashes** (8 dropped by the back-pressure valve, reported in the UI). The same
burst against the pre-v1.6 unserialised call pattern breaks the chain at record
2 and produces only 3 distinct hashes out of 40.

To verify an exported record externally: remove the `hash` field, re-serialise
with the original key order, and SHA-256 the result.

### 4.6 Cross-implementation agreement

The animation tab and the analysis tabs now call the same `rankineCycle()` and
agree to 1e-9. They were separate implementations through v1.6 and had already
diverged — that is how a sign error survived in one while the plots used the
other.

---

## 5. Where to start poking

Ranked by how much a defect there would matter:

1. **`KAPPA_SENS` and the κ formulas (§3.3).** Since v1.9 this constant is
   load-bearing: it now scales the plant's actual electrical output, not just a
   displayed index. It is the single most consequential unproven number in the
   tool. The whole TMF efficiency claim rests on it and on the κ formulas,
   and none is derived.
   Is there *any* independent way to pin κ_turb?
2. **The independence assumption in σ_μ² = σ_T² + σ_ρ² + σ_v² (§2.4).** If the
   three are correlated, the resultant is wrong in a direction that is easy to
   determine analytically.
3. **`upstream_factor = 0.03` (§3.6).** EROI is roughly η_total divided by this
   number. Everything else in the chain barely matters to it.
4. **The two different UPHTT bonuses** — 1.12 in the boiler and 1.35 (Dean) in
   the impedance module, for the same physical claim about spiral geometry. At
   least one is wrong; possibly both are unjustified.
5. **`d0 = 0.05 m` hard-coded (§3.5).** All acoustic and geometric results scale
   off a header diameter the user cannot change.
6. **The acoustic self-similarity assumption.** f_i/f₀ = d₀/d_i only if L/d is
   constant across header and branches. Relax it and the lock map changes.
7. **The `AFR = 6.5` reused for every fuel (§3.1)**, including biogas.
8. **`uphtt_eta` is displayed but not used** in the energy balance (§3.2). Either
   it should feed Q, or the label overstates its role.
9. **The OTDD tab (§2.4)** presents an operator formalism that is not
   implemented. Either implement or relabel.

## 6. Reproducing the verification

```
node --check <extracted script>      # syntax
node FullChain_verify_v19.js         # invariants + sweeps + screenshots
```

`FullChain_verify_v19.js` needs Playwright and a Chromium binary. It loads the HTML from a
`file://` URL, runs the sweeps in-page, and prints JSON. Everything it asserts
is listed in §4; add your own checks to the same file.

## 7. Reporting

Please report findings against a specific `[marker]` and location. The most
useful report says which of the three categories the defect is in: a
transcription error in a `[PROVEN]` quantity is a bug; an implausible
`[NUMERICAL]` value is a calibration argument; a disagreement with a
`[CONJECTURE]` is a disagreement with the framework, and that is the interesting
one.
