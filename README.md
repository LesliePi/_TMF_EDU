# Thermodynamic Manifold (TMF)

Interactive, single-file HTML thermodynamic cycle simulators, built for teaching engineering thermodynamics — not for production engineering design.

Live demos (once GitHub Pages is enabled on this repo):

TMF_Rankine_Simulator_v32.html — steam power cycle (boiler, turbine, condenser, pump)
TMF_OttoDiesel_Simulator_v33.html — Otto & Diesel air-standard cycles, with a forced-induction / charge-air-cooling module
TMF_FullChain_Simulator_v19.html — a full biomass plant: combustion → boiler → Rankine turbine → generator, in one connected pipeline

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
breakdown. That breakdown holds regardless of the conjecture: at default settings
heat crossing the flame-to-steam gap destroys 70.8% of all work capacity lost —
207 kW against 206 kW of electrical output — while the turbine accounts for 16%.

Its scope, limitations, complete assumption register and a blunt list of known
inconsistencies are in `FullChain_audit.md` — read §2.6 and §2.7 before quoting
any number from it.

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
node FullChain_verify_v19.js
```

It sweeps 13 316 cycle states for Carnot-bound violations (0), checks second-law consistency and cycle closure, verifies the property tables against published IAPWS values, and stress-tests the log's hash chain. What it asserts is listed in `FullChain_audit.md` §4.

# Found a problem?

That is the point. Open an issue, or e-mail. The most useful reports say which epistemic category the defect falls in: a transcription error in a [PROVEN] quantity is a bug; an implausible [NUMERICAL] value is a calibration argument; a disagreement with a [CONJECTURE] is a disagreement with the framework — and that is the interesting one. `FullChain_audit.md` §5 lists, ranked, where I think the weakest points are.

# License
CC BY 4.0 — see LICENSE.md. Free to use, adapt, and redistribute, including in paid courses, provided attribution to Tatai László is kept (the on-page credit line and this file). See the license file for exactly what that means in practice.

# Contact
Tatai László — laszlo.tatai@outlook.com


