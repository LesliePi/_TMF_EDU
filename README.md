# Thermodynamic Manifold (TMF)

Interactive, single-file HTML thermodynamic cycle simulators, built for teaching engineering thermodynamics — not for production engineering design.

Live demos (once GitHub Pages is enabled on this repo):

TMF_Rankine_Simulator_v32.html — steam power cycle (boiler, turbine, condenser, pump)
TMF_OttoDiesel_Simulator_v33.html — Otto & Diesel air-standard cycles, with a forced-induction / charge-air-cooling module
TMF_FullChain_Simulator_v22.html — a full biomass plant: combustion → boiler → Rankine turbine → generator, in one connected pipeline

Open index.html for a landing page linking all three.

The Full Chain simulator extends the Rankine core to the whole plant and adds the
instrumentation layers the TMF framework is really about: thermodynamic impedance
matching (Leonardo d² vs Murray d³ branch scaling), junction acoustics and a
Rayleigh instability index, a composite σ_μ-based instability metric, and a
SHA-256 hash-chained audit log with CSV/NDJSON export.

Its most useful tab is probably the last one. **Sensitivity** perturbs each
parameter in turn, re-runs the whole chain, and reports what the change is
actually worth in kilowatts at the terminals — plus how much of a local +1 pp
survives the cascade (η_boiler transmits ~25 %, η_generator ~34 %). At the
default operating point, drying the fuel by two percentage points beats every
single-component efficiency improvement in the plant, and 20.8 % of the fuel
energy is still in the flue gas. That is the argument for building the tool: the
biggest number on the screen is usually not the one being optimised.

As of v1.9 the σ_μ inhomogeneity penalty is **load-bearing**: it degrades the
turbine's effective isentropic efficiency, so it moves real kilowatts (10.7 kW,
5.2% of output, across the slider range). That makes the framework's central
claim falsifiable end to end — a σ-vs-output measurement could confirm or refute
it — and it means every downstream number now inherits `KAPPA_SENS`, a constant
tagged [CONJECTURE]. That trade is deliberate and is stated on screen wherever it
matters. If you want the classical cycle back, set the σ sliders to minimum.

Tab 12 draws the cycle in (s, T, ΣS_gen), where it is a helix whose pitch is the
entropy generated per revolution, alongside a Gouy–Stodola exergy-destruction
breakdown.

Tab 13 goes one step further back, to the part the model could not previously
see at all. Combustion — turning ordered chemical free energy into random thermal
motion in one step — destroys **47% of the fuel's exergy before any heat transfer
happens**: 501 kW against the plant's 207 kW of electrical output, and more than
double the boiler's temperature gap. No better boiler, turbine or generator
touches it. The same tab shows why you may not simply cool the stack to recover
what is left: the limit is the fuel's chlorine, not thermodynamics. Wood chip
allows 99 kW of recovery, straw only 44 kW, with identical hardware. And it
closes the loop that the sensitivity view opened — sending ~14 kW of otherwise
wasted stack heat to a fuel dryer returns ~14 kW of electricity, because drying
needs no exergy and dry fuel is the highest-payback lever in the plant.

As of v2.0 combustion efficiency runs on the Siegert stack-loss correlation, so
excess air and flue-gas temperature finally affect the energy balance — λ was a
dead control through v1.9.

**v2.2 corrected the heat-transfer network and the correction inverted the
conclusion.** Radiation and convection are two *parallel* paths from the gas to
the wall; only the wall conduction is in series with them. Through v2.1 the model
summed all three. The old sum overstated total resistance by **6.39×** and named
the wrong mechanism as dominant: the series view said "radiation, 82 % of
resistance", the correct circuit gives **84 % of the heat flux through
convection**. Both are still displayed side by side so you can audit the change.
Alongside the impedances the panel now shows the transfer *rates* — h per route,
flux share, and wall response times (τ_rad 39.8 s, τ_conv 7.6 s, τ_cond 0.62 s) —
because how fast one energy form becomes another says as much as how hard it is.
The panel's own summary of the corrected picture: **energy does not choose a
route, it takes both, split by conductance.**

v2.2 also adds the **Curzon–Ahlborn** benchmark — efficiency at maximum power,
1 − √(T_c/T_h). This plant runs at 32.3 % against a Curzon–Ahlborn point of
22.2 % and a Carnot bound of 39.5 %: it is deliberately tuned above maximum
power, trading output for efficiency, which is the right call when fuel is bought
and capacity is not.

**Read this before quoting a number:**

- `TMF_WhitePaper_v1_0.md` — the technical *and* theoretical summary. Abstract,
  executive summary, model architecture, a translation table mapping every TMF
  term onto its canonical thermodynamics equivalent (eleven of twelve rows are
  renamings — that ratio is the honest summary of this work), the falsifiability
  argument, verification results, limitations, and APA references **with a
  verification-status column** distinguishing citations that were checked from
  those that were not. Three attributions turned out to be unverified or wrong
  and are corrected there.
- `FullChain_audit.md` — scope, limitations, the complete assumption register and
  a blunt list of known inconsistencies. Read §2.6 and §2.7.

One known defect is worth naming here rather than burying: the furnace heat flux
computes to **2 348 kW/m²** against a realistic 100–300. The cause is identified
(a water-side heat-transfer coefficient applied to the gas side) and it is
flagged in red on the panel — and deliberately **not** silently fixed, because
finding it teaches more than being spared it. See audit §2.6 item 13.

What makes these different from a typical cycle-diagram demo
Real property data, not textbook shortcuts: IAPWS-IF97 steam tables (Rankine), NASA 7-coefficient polynomials for N₂/O₂/H₂O/CO₂/Ar (Otto/Diesel) — so specific heat actually varies with temperature instead of being held constant.
Every number is tagged by epistemic status in the source comments: [PROVEN] (table physics), [NUMERICAL] (a fitted/heuristic estimate), [CONJECTURE] (a relation asserted but not derived) — so a student can see what to trust and what to question.

Explicit physical-limit checks baked into the UI: Carnot-bound violations, spark-knock limit (Otto), adiabatic flame-temperature ceiling, condensation under boost — the model tells you when a parameter combination has left the physically sensible range, instead of silently returning a number.
The air-standard cycles are explicitly documented as an upper bound, not a predictive model — no wall heat transfer, no friction, no finite combustion time. This is intentional and stated on-page, not a hidden limitation.
Verification
Every release has been checked against independent references before publishing: IAPWS-IF97 (via the Python iapws library) for steam properties, literature c_p values for the NASA polynomials, closed-form energy balances cross-checked against the rendered P–V integrals, and full parameter-space sweeps (thousands of points) confirming zero Carnot-bound violations. Details are in each version's changelog, kept alongside the simulator files.

The Full Chain simulator ships its verification harness so you can re-run it, and add to it:

```
npm i playwright && npx playwright install chromium
node FullChain_verify_v22.js
```

It sweeps 13 316 cycle states for Carnot-bound violations (0), re-sweeps 7 920 with the σ-conjecture active (also 0), checks second-law consistency and cycle closure, verifies the property tables against published IAPWS values, and stress-tests the log's hash chain — 19 checks in all. What it asserts is listed in `FullChain_audit.md` §4.

A second script regenerates every table in the white paper straight out of the shipped file, so no figure in it was typed by hand:

```
node harvest_paper.js
```

# Found a problem?

That is the point. Open an issue, or e-mail. The most useful reports say which epistemic category the defect falls in: a transcription error in a [PROVEN] quantity is a bug; an implausible [NUMERICAL] value is a calibration argument; a disagreement with a [CONJECTURE] is a disagreement with the framework — and that is the interesting one. `FullChain_audit.md` §5 lists, ranked, where I think the weakest points are.

# License
CC BY 4.0 — see LICENSE.md. Free to use, adapt, and redistribute, including in paid courses, provided attribution to Tatai László is kept (the on-page credit line and this file). See the license file for exactly what that means in practice.

# Contact
Tatai László — laszlo.tatai@outlook.com


