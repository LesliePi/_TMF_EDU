# TMF Full Chain Analyser — changelog v1.5 → v2.1

Scope, limitations and the full assumption register live in `FullChain_audit.md`.
Every change below is marked in the source with a `[FIX v1.6]` / `[FIX v1.7]` /
`[v1.8]` / `[v1.9]` comment stating what the old code did and why it was wrong.

Verification harness: `FullChain_verify_v21.js` (headless Chromium). Results
quoted here are from that script.

---

## v2.1 — grouped tabs, and a treatment train that shows order decides

### Tab groups

The flat bar had reached 13 tabs and needed **1902 px in a 1600 px window**, so
tabs 12 and 13 — the two most useful additions — were simply off-screen unless
you knew to scroll. They are now grouped:

| Group | Tabs | What it is |
|---|---|---|
| CHAIN | 6 | the cycle itself, the teaching material |
| ANALYSIS | 3 | sensitivity, flue gas, impedance — ordinary physics done carefully |
| TMF THEORY | 2 | the hypothesis. Not results. Carries a group-level warning. |
| LIVE DATA | 2 | instrumentation demo — a product feature, not a lesson |

Putting the epistemic status at group level is stronger than repeating it per
tab, and a visitor can now see the shape of the tool before clicking anything.
Jumping straight to a hidden tab (the header DataLog widget does this) brings its
group with it. Verified: all 13 tabs covered exactly once, no duplicates.

### Flue-gas treatment train

Three orderable stages — economiser, dry sorbent + filter, wet scrubber,
condensing scrubber — with the gas state carried through in sequence. The point
is that **order decides**:

| Sequence | Heat recovered | HCl removed | Stack out |
|---|---|---|---|
| Economiser only | 99.4 kW | 0% | 52 °C |
| Economiser → dry sorbent | 99.4 kW | 88% | 44 °C |
| **Economiser → condensing scrubber** | **153.3 kW** | 97% | 35 °C |
| **Wet scrubber → economiser** | **4.4 kW** | 97% | 52 °C |

Putting the scrubber first quenches the gas to its adiabatic saturation
temperature, and the economiser downstream then recovers **4 kW instead of 99** —
a 95% loss caused purely by sequencing. The panel flags that arrangement in red.

The condensing scrubber is the arrangement that does both jobs: it takes the gas
below the dew point and recovers sensible *and* latent heat into the liquid while
scrubbing the acid gases. That is standard practice in Scandinavian biomass
district heating, for exactly this reason.

Lime demand is computed from the chlorine actually captured — 0.04 kg/h here,
about 0.3 t/year, plus the chloride residue that comes with it.

---

## v2.0 — the model finally sees the biggest loss, and λ finally costs something

### Combustion efficiency reworked onto Siegert

Through v1.9, `η_comb` depended on fuel moisture and nothing else. Excess air and
flue-gas temperature — the two things an operator can actually change day to day
— had no effect on the energy balance at all. That is why the Sensitivity tab
reported **0.00 kW** for λ, and why the `T_air` slider (air preheat) did nothing.

Replaced with the Siegert stack-loss correlation, the standard field method built
into flue-gas analysers:

```
q_A = (T_fg − T_air) · ( A / (21 − O₂) + B ),    O₂ [%] = 21 · (1 − 1/λ)
```

plus explicit casing (1.5%) and unburnt/ash (1.0% + moisture) terms instead of a
single fudge factor. The moisture slope drops from 1.4 to 0.15, because most of
what the old slope was doing is now handled properly by `LHV_wet` and by the
stack term.

| λ | O₂ | stack loss | η_comb |
|---|---|---|---|
| 1.05 | 1.0% | 9.25% | 88.25% |
| 1.20 | 3.5% | 10.06% | 87.44% |
| 1.80 | 9.3% | 13.31% | 84.19% |
| 2.50 | 12.6% | 17.14% | 80.36% |

Sensitivity now reports **+1.23 kW** for λ −0.10. Nominal η_comb barely moves
(87.0% → 87.4%), so nothing downstream was recalibrated by accident.

### Tab 13: FLUE GAS / RECOVERY

**The fuel exergy cascade.** The chain used to begin at `Q_in = m_fuel · LHV`,
treating chemical energy as if it were already heat — and so skipping the single
largest irreversibility in the plant. Combustion destroys **501 kW, 47.3% of the
fuel's exergy**, before any heat transfer happens: more than double the boiler's
temperature gap (208 kW), and more than the whole plant produces (207 kW). The
cascade closes to within 0.2%. Second-law efficiency: **19.5%**, against a
first-law figure of 22.5%.

No improvement to the boiler, turbine or generator touches that 501 kW. Only a
different conversion route does.

**Flue-gas potentials, on a log scale because they are not comparable.** At the
default point: thermal sensible 119.1 kW, thermal latent 89.2 kW, chemical
(CO at 200 mg/Nm³) 827 W, kinetic 28 W. Three to four orders of magnitude apart.
The decomposition earns its place precisely by saying *ignore the last two*.

EM/radiation is deliberately absent from the list: thermal radiation is a
transfer mechanism already inside the thermal term, and listing it separately
would double-count. Flame ionisation is real but ppm-level — a **sensing** and
combustion-control channel, not an energy source. That distinction is stated on
the panel.

**The stack cooling window is set by corrosion, not by thermodynamics.** How far
you may cool the flue gas depends on the fuel's chlorine, because HCl condensing
with the water attacks the exchanger. Same plant, same hardware:

| Fuel | Cl | dew point | practical limit | recoverable | locked away |
|---|---|---|---|---|---|
| Wood chip | 0.02% | 47.4 °C | 52 °C | **99 kW** | 92 kW |
| Pellet | 0.08% | 47.9 °C | 90 °C | 80 kW | 117 kW |
| Straw | 0.35% | 46.2 °C | 130 °C | **44 kW** | 135 kW |

Switching from wood chip to straw more than halves what you may take back, with
no change to the equipment. `[NUMERICAL]` — these bands are engineering guidance,
not a corrosion model.

**The drying loop.** The best use of low-grade stack heat here is not more steam,
it is drying the fuel — evaporating water needs only ~100 °C-grade heat, and the
Sensitivity tab already showed drier fuel is the highest-payback lever in the
model. With 99 kW available above the corrosion limit:

| Target moisture | Heat needed | Electrical gain | Fits? |
|---|---|---|---|
| 13% | 4.8 kW | +4.8 kW | yes |
| 11% | 9.4 kW | +9.6 kW | yes |
| 9% | 13.8 kW | +14.3 kW | yes |
| 7% | 18.1 kW | +18.9 kW | yes |

Roughly one kilowatt of electricity per kilowatt of otherwise-wasted heat. That
ratio is not a violation of anything — it is what happens when you send the
lowest-grade heat in the plant to the one job where grade does not matter, and it
feeds back into the highest-leverage input. Dryer inefficiency is included at
+30% `[NUMERICAL]`.

---

## v1.9 — the conjecture becomes falsifiable

### η_TMF now scales the shaft work

Through v1.8 this was the model's central inconsistency, documented in
`FullChain_audit.md` §2.6 and reported in red inside the simulator itself:
`η_TMF` was computed, displayed, logged and charted, and then ignored. Shaft work
came from the real enthalpies alone, so `∂P_elec/∂σ` was **exactly zero**. The
framework's central quantity had no effect on the framework's central output,
which meant the claim could not be wrong — and therefore could not be right
either.

It is now applied where the argument says it belongs. `κ_drive` is `κ_turbine`,
so the loss is the turbine's own irreversibility:

```
η_is,effective = η_is · (1 − Δ),    Δ = σ_μ² · κ_turb · KAPPA_SENS
```

Δ depends on κ_turb, κ_turb depends on the exhaust quality x₂, and x₂ depends on
Δ — so it is solved as a fixed point. Converges in 3–5 passes at every setting
tested; the iteration count and convergence flag are shown in the sidebar so a
reviewer can check the loop actually settles.

Applying the penalty to the isentropic efficiency rather than as a multiplier on
`W_mech` matters: the whole downstream state then follows automatically and stays
self-consistent. Less work extracted ⇒ higher h₂ ⇒ **drier** exhaust ⇒ more heat
rejected in the condenser ⇒ more entropy generated. A cosmetic multiplier on
`W_mech` would have left h₂ disagreeing with the work actually taken out.

`m_steam` is unaffected — it depends on h₁ and h₄, neither of which involves the
turbine. Only the work extracted from that steam changes.

**Measured effect.** Sweeping all three σ components together:

| σ (each component) | P_elec |
|---|---|
| 0.01 | 206.92 kW |
| 0.15 | 204.52 kW |
| 0.30 | 196.17 kW |

A 10.74 kW spread, 5.19% of output, monotonically decreasing. That is above the
resolution of decent plant instrumentation, which is the point: **a σ-vs-output
experiment can now confirm or refute the conjecture.**

**The price, stated plainly.** Every downstream number — P_elec, η_total, EROI,
the entire Sensitivity ranking — now inherits `KAPPA_SENS = 0.15`, a
`[CONJECTURE]` constant with no independent derivation. If it is wrong, the plant
output this tool reports is wrong with it. The model has traded "safe but
untestable" for "testable and possibly wrong". That is the right trade for a
hypothesis and the wrong one for a design tool; anyone using the numbers for
engineering rather than for argument should set the σ sliders to minimum, which
recovers the classical cycle to five decimals.

**Verified after the change.** A 7 920-case sweep with the penalty live — boiler,
superheat and condenser temperature × four σ levels × three turbine efficiencies
— gives **0 Carnot violations, 0 cases of η_TMF exceeding the classical
reference, and 0 fixed-point convergence failures.** The exhaust also gets drier
with σ, as it must.

### Tab 12: STATE-SPACE TRAJECTORY

On the (s, T) plane a steady-state cycle is a closed loop — it has to be. There
is no spiral there, and drawing one would be decoration.

The spiral appears when you add the coordinate the closed loop hides: cumulative
entropy exported to the surroundings. The working fluid returns to its starting
state every revolution; the universe does not. Plotted as (s, T, ΣS_gen) the
trajectory is a helix whose **pitch is the entropy generated per revolution**, in
the same kJ/kgK as the horizontal axis — so it can be read off rather than
admired. The operating helix and the classical σ-free helix are drawn together,
which turns "inhomogeneity widens the spiral" into something you look at instead
of something you assert.

This is a **change of representation, not new physics** — see audit §2.7. Every
number in it is ordinary second-law bookkeeping. Whether the geometry carries
explanatory power beyond the accounting is exactly the open question; the tab
makes the question visible and does not answer it.

The projection is auto-fitted, uniformly, because the drift length depends on
S_gen and therefore on every slider — a fixed viewport let the helix walk out of
the panel at high σ.

**One result that does not depend on any conjecture.** The Gouy–Stodola
breakdown at default settings:

| Irreversibility | Share | Exergy destroyed |
|---|---|---|
| Boiler ΔT (flame → steam) | **70.8%** | 207.3 kW |
| Turbine | 16.2% | 47.4 kW |
| Condenser | 12.8% | 37.5 kW |
| Pump | 0.2% | 0.6 kW |

Total 292.8 kW of work capacity destroyed against 206 kW of electrical output.
Heat crossing the flame-to-steam temperature gap destroys more useful work than
the entire plant produces. That ordering is an argument for recuperation and
lower excess air before it is an argument for better blades — and it holds
whatever KAPPA_SENS turns out to be.

---

## v1.8 — marginal gain, energy basis, and an honest label on tab 8

### Tab 11: SENSITIVITY — what is a given improvement actually worth?

The motivation: everyone quotes a big number for their own component, and at the
end of the chain very little of it survives. The tool could show *that* a change
matters, but not *which* change matters most. Now it can.

Method: numerical forward difference. Perturb one parameter, re-run the entire
chain, measure ΔP_elec and Δη_total, restore. No analytical derivatives — the
chain contains clamps, table lookups and phase changes, and a numerical
difference respects all of them. Verified to restore the parameter set exactly.

Ranking at the default operating point:

| Lever | Step | ΔP_elec |
|---|---|---|
| Fuel moisture | −2 % | **+5.44 kW** |
| Condenser temperature | −5 °C | +3.44 kW |
| η_generator | +1 pp | +3.15 kW |
| η_turbine | +1 pp | +2.46 kW |
| Boiler temperature | +10 °C | +2.31 kW |
| η_boiler | +1 pp | +2.27 kW |
| Superheat temperature | +10 °C | +0.76 kW |
| cos φ | +0.02 | +0.59 kW |
| η_pump | +1 pp | +0.02 kW |
| Excess air λ, σ_T, σ_ρ, σ_v | — | **0.00 kW** |

Two things fall out of that table immediately, and both are the point of the tab:
drying the fuel by two percentage points beats **any** single-point efficiency
improvement in the plant — and four of the levers do nothing at all (see below).

**Chain transmission.** A +1 pp gain at a component does not arrive intact at the
terminals: η_boiler transmits 24.6 %, η_turbine 26.7 %, η_generator 34.2 %. A
component late in the chain keeps more of what it gains; an early one has to push
its improvement through everything downstream. This is why "our boiler is 3 %
better" almost never means 3 % more power.

**LHV vs HHV — the "112 % boiler".** The fuel database gained a hydrogen mass
fraction, so the model can now compute the higher heating value (HHV = LHV plus
the latent heat of the water formed from that hydrogen, 9 kg water per kg H₂ at
2.442 MJ/kg) and the flue-gas water dew point, using the same Wagner inverse the
cycle already uses.

For wood chip at 15 % moisture: HHV/LHV = 1.097, so **100 % on HHV is 109.7 % on
LHV** — that is the hard ceiling. A boiler advertised at 112 % LHV would be
102.1 % HHV, which is impossible. For biogas the ceiling is 111.4 %.

And the number that makes the whole tab worth building: at default settings the
flue gas leaves at 216 °C against a dew point of 47 °C, so **192 kW — 20.8 % of
the fuel energy — is still in the stack**, of which 102 kW is sensible heat above
the dew point and 89 kW is latent heat that no non-condensing boiler can reach.
Compare that with the 5.44 kW available from the best single-component step.

### Tab 8 (OTDD) relabelled CONCEPT

The T_θ = N∘S_ε∘E_η∘W∘D_α operator is not implemented and never was. The tab is
now labelled "8. OTDD ⚠ CONCEPT", carries a permanent warning bar above the
charts stating that nothing on it is computed, and every sidebar figure is marked
⚠ with an [ILLUSTRATIVE] section header. The tab is kept rather than deleted
because it shows where the framework is going — but it can no longer be mistaken
for output.

### Two structural gaps that the new tab exposed on its first run

Both are now documented in `FullChain_audit.md` §2.6 and reported in red inside
the simulator:

1. **∂P_elec/∂σ = 0, exactly.** `η_TMF` is computed, displayed, logged and
   charted, but shaft work is `W_mech = m_steam · w_net` built from the real
   enthalpies alone — `η_TMF` never multiplies anything. The σ sliders move a
   number on screen and produce no electricity. Either η_TMF should scale the
   shaft work, or it should be relabelled a diagnostic index rather than an
   efficiency. Unresolved modelling decision, not an oversight.
2. **Excess air λ does not affect efficiency.** `η_comb` depends only on fuel
   moisture, so λ changes the flame and flue-gas temperatures but not the energy
   balance. A stack-loss term would fix it.

---

## v1.7 — real pressure, closed cycle, dead controls wired

### A. IAPWS property layer replaces the linear superheat approximation

v1.6 and earlier had **no pressure anywhere in the model**. Superheated steam was
approximated as `h = h_g + 2.1·ΔT`, entropy as `s = s_g + c_p·ln(T₂/T₁)`, and the
feed pump saw a **step-function** ΔP — 40 bar above `T_boil = 180 °C`, 20 bar
below, so the pump work jumped discontinuously as the boiler slider crossed 180.

Replaced with the property layer from the separately validated
`TMF_Rankine_Simulator_v32`:

- `SAT` — 30-point saturated-water table plus the Wagner saturation-pressure
  equation and liquid specific volume `v_f`
- `SH_TABLE` — superheated-steam `h` and `s` at 1…200 bar
- `tSatFromP` — inverse Wagner, memoised bisection
- `superheatProps(T, P_bar)` — bilinear interpolation
- `isobarSH` — a real isobar for the T-s plots instead of a straight chord

Spot checks against published IAPWS values:

| Quantity | v1.7 | Published |
|---|---|---|
| h(100 bar, 500 °C) | 3375.1 kJ/kg | 3375.1 |
| s(100 bar, 500 °C) | 6.5993 kJ/kgK | 6.5994 |
| h(40 bar, 400 °C) | 3214.4 kJ/kg | 3214.5 |
| P_sat(300 °C) | 85.88 bar | 85.88 |
| P_sat(100 °C) | 1.0142 bar | 1.0142 |

Pump work is now continuous across the old discontinuity: 1.329 → 1.360 → 1.392
kJ/kg at T_boil = 179/180/181 °C.

### B. The cycle is now closed

`calcBoiler()` used a hard-coded feedwater enthalpy of **80 kJ/kg** while the
pump actually delivered ≈200 kJ/kg. The boiler duty and the cycle therefore
disagreed by ~120 kJ/kg in the denominator of

```
m_steam = Q_avail / (h₁ − h_fw)
```

and the steam mass flow — which multiplies straight into `W_mech`, `P_elec`,
`η_total` and `EROI` — was systematically wrong. Feedwater is now the pump outlet
`h₄`. Residual: `Q_avail − m_steam·(h₁ − h₄) = 0.000 kW`.

### C. One shared cycle core

v1.6 carried **two independent cycle implementations**: `calcBoiler`+`calcTurbine`
for the analysis tabs, and `animCalcCycle()` for the animation tab. They had
already drifted apart — different superheat approximation, different pump work.
That divergence is how the v1.5 entropy sign error (§v1.6-F) survived in one of
them while the plots were driven by the other.

Both now call `rankineCycle()`. Agreement verified to 1e-9.

### D. Isentropic exit may be superheated

When `s₁ > s_g(T_cond)` the isentropic end state is superheated and its enthalpy
lies **above** `h_g`. Clamping the quality to 1 understates `h₂ₛ`, overstates the
turbine work, and lets `η_classic` exceed its own Carnot bound. The dome is now
extended with a constant-`c_p` ideal-gas leg (`CP_VAP = 1.95` kJ/kgK, used only
at condenser pressure).

### E. Carnot reference is the entropic mean temperature of heat addition

`T_sat(boiler)` is **not** an upper bound once the steam is superheated. The
reference is now

```
T̄ = (h₁ − h₄)/(s₁ − s₄),    η_Carnot = 1 − T_cond/T̄
```

Sweep over T_boil 100–340 °C × T_sh (T_boil+20)–560 °C × T_cond 20–90 °C × η_is
{0.60, 0.75, 0.85, 0.95}: **13 316 cases, 0 Carnot violations** (8 165 wet
exhaust, 5 151 dry). The gap between η_Carnot(T̄) = 39.5 % and η_Carnot(T_sh) =
57.8 % at defaults is the non-isothermal heat-input loss, now displayed.

### F. Δη is scaled by κ_turbine, not κ_peak

`κ_peak` is essentially always `κ_boiler` (1.72 vs 1.15 at defaults), i.e. it is
dominated by the boiler's latent heat — while the entire σ_μ argument is about
the **turbine inlet**. Set `kap_drive = kap_peak` in the source to restore the
old behaviour.

### G. Excess-air λ was counted twice in the flame temperature

`m_fg` already contains it (`m_fg = m_fuel·(1 + λ·6.5)`); the old code divided by
λ a second time, so raising the excess air cooled the flame roughly twice as fast
as it should. The `0.95` fudge also sat in the denominator, where it **raised**
the temperature — the opposite of the loss it was named after. It is now an
explicit radiative-loss factor in the numerator, and the ceiling was raised from
1600 to 1900 °C because the corrected nominal case (1462 °C) would otherwise have
been clipped.

λ = 1.0 → 1712 °C, λ = 1.2 → 1462 °C, λ = 2.5 → 756 °C.

### H. Three dead sliders wired

`eta_gen`, `cos_phi` and `slip` changed nothing. The loss split was hard-coded as
fixed fractions of the mechanical input, so generator efficiency was pinned at
94.5 % wherever the user put the slider, and cos φ affected nothing at all.

Now: the rated efficiency sets the **total loss at the rated point**, split into
load-dependent (copper) and load-independent (iron + windage + stray) parts.
Copper loss scales as `(P/P_nom/cos φ)²`, because a poorer power factor means
more current for the same real power. `slip` became the governor droop
coefficient it was always labelled as — its range, 0.005–0.08, is exactly the
usual 0.5–8 % droop range.

### I. Saturation-curve panel used an ambient-temperature formula

The pressure/saturation chart was drawn with the Magnus–Tetens vapour-pressure
fit, which is only usable to roughly 50 °C. At the default 300 °C it returned
**1052 bar** against a true 85.9 bar, and the marker sat pinned to the top of the
frame. Now Wagner, so the chart agrees with the pressure the cycle uses.

### J. Two charts were not connected to the model

- **κ(μ) "entropy birth locus"** was a hard-coded shape — the array
  `[0.8, 3.5, 1.2, 0.6]` plus a sine bump — that did not respond to any slider.
  It now plots the model's actual κ per station and marks which one drives Δη.
- **η vs σ_μ** still used the pre-v1.7 subtractive formula, plotted on a 0–100 %
  axis where a few-percent effect is about 2 px tall. It looked like a horizontal
  line under every setting. Now the current model, on an axis zoomed to its range.

### Nominal operating point after v1.7

| | |
|---|---|
| P_boiler / P_cond | 85.88 / 0.096 bar |
| h₁ / s₁ | 3341.7 kJ/kg / 6.6209 kJ/kgK |
| h₄ (feedwater) | 200.1 kJ/kg |
| w_pump | 11.75 kJ/kg |
| m_steam | 225 g/s |
| x₂ (exhaust quality) | 0.889 |
| η_classic / η_TMF | 32.27 % / 32.14 % |
| η_Carnot(T̄) / η_Carnot(T_sh) | 39.50 % / 57.76 % |
| T̄ heat input | 252.8 °C |
| W_mech → P_elec | 227.6 → 206.9 kW |
| η_total | 22.45 % |

---

## v1.6 — 14 defect fixes

| # | Defect | Effect |
|---|---|---|
| 1 | **Async race in the data logger.** `dlBuildRecord()` is async because `crypto.subtle.digest()` is; the read-modify-write of `DL._prevHash` therefore spanned an `await` boundary | Two overlapping writers read the **same** `prev_hash` and the SHA-256 chain forked. Reachable via the 1 s critical interval, WebSocket injection, or `dlStart()` racing its own timer. Reproduced: 40 concurrent writes broke the chain at record 2 and produced 3 distinct hashes out of 40. Fixed with a serialised write queue — same test now gives 0 broken links, 32 unique hashes, 8 dropped by a reported back-pressure valve |
| 2 | Branch diagram hard-capped at `Math.min(N,8)` while the slider goes to 10 | N = 9 and N = 10 drew identically to N = 8; the picture silently disagreed with the maths and with its own node-status badge |
| 3 | **Pythagorean-triple "resonance"** scored `d_i/d₀` against the a/c and b/c ratios of Pythagorean triples | Those ratios form an arbitrary dense set in (0.2, 0.98), so the distance was always small, the score always high, and the derived η pinned at 0.9996–1.0000 — a constant printed to four decimals. It also conflated Pythagorean *triples* (number theory) with Pythagorean *tuning* (acoustics). Replaced with the junction reflection coefficient `R = (A₀−ΣA_i)/(A₀+ΣA_i)`, Arnold-tongue harmonic locking, and a Rayleigh index — see `FullChain_audit.md` §2.5 |
| 4 | `switchTab()` looped only to `panel8` | **Tab 10 (DATALOG) showed a blank content area**, including from the header widget |
| 5 | Raw newline inside a string literal in the NDJSON/CSV export | A parse error that disabled the **entire script** in the affected copy |
| 6 | Superheat entropy **sign error** in `calcBoiler` (`s_g − 0.002·ΔT`) while every plot used `+0.0018·ΔT` | Sat upstream of `calcTurbine`, so exhaust quality came out far too wet and the blade-erosion warning fired on healthy states. Magnitude was also ~40 % low |
| 7 | Exhaust quality reported the **isentropic** value | The real exhaust is drier (h₂ > h₂ₛ); 0.749 CRITICAL was reported where the true value was 0.835 WARN |
| 8 | Chaos history threshold bands shifted one band up | Green covered 0.2–0.5 and yellow 0.5–0.8 — the exact opposite of the legend. K = 0.45 drew inside the green zone while the gauge beside it read WARNING |
| 9 | `dlDrawMiniChart(..., yMax = null)` → `Math.min(null, v) = 0` | The P_electric chart rendered as a flat line along the axis |
| 10 | `validateParams()` clamp wrote to `sl-…`/`lv-…` IDs; `addSlider()` creates `s-…`/`v-…` | The slider handle stayed at the rejected value while the model used the clamped one |
| 11 | `Z_rad` went negative when `T_flame ≤ T_wall` | Negative percentages in the impedance breakdown that did not sum to 100 % |
| 12 | EROI used **thermal** output and a 0.50 upstream factor | Reduced algebraically to `2·η_comb·(LHV_wet/LHV_dry)` — bounded above by ~1.6 regardless of boiler, turbine or generator, so the metric could not respond to the plant. Reformulated as electrical output ÷ invested energy with a documented 0.03 factor |
| 13 | `ch.turb.sig_mu` — `calcChaos()` has no `.turb` field | TypeError; the whole CHAOS sidebar render aborted |
| 14 | `ch.bearing_df` did not exist either | Same aborted render |
