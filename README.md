# Thermodynamic Manifold (TMF)

Interactive, single-file HTML thermodynamic cycle simulators, built for teaching engineering thermodynamics — not for production engineering design.

Live demos (once GitHub Pages is enabled on this repo):

TMF_Rankine_Simulator_v32.html — steam power cycle (boiler, turbine, condenser, pump)
TMF_OttoDiesel_Simulator_v33.html — Otto & Diesel air-standard cycles, with a forced-induction / charge-air-cooling module

Open index.html for a landing page linking both.

What makes these different from a typical cycle-diagram demo
Real property data, not textbook shortcuts: IAPWS-IF97 steam tables (Rankine), NASA 7-coefficient polynomials for N₂/O₂/H₂O/CO₂/Ar (Otto/Diesel) — so specific heat actually varies with temperature instead of being held constant.
Every number is tagged by epistemic status in the source comments: [PROVEN] (table physics), [NUMERICAL] (a fitted/heuristic estimate), [CONJECTURE] (a relation asserted but not derived) — so a student can see what to trust and what to question.

Explicit physical-limit checks baked into the UI: Carnot-bound violations, spark-knock limit (Otto), adiabatic flame-temperature ceiling, condensation under boost — the model tells you when a parameter combination has left the physically sensible range, instead of silently returning a number.
The air-standard cycles are explicitly documented as an upper bound, not a predictive model — no wall heat transfer, no friction, no finite combustion time. This is intentional and stated on-page, not a hidden limitation.
Verification
Every release has been checked against independent references before publishing: IAPWS-IF97 (via the Python iapws library) for steam properties, literature c_p values for the NASA polynomials, closed-form energy balances cross-checked against the rendered P–V integrals, and full parameter-space sweeps (thousands of points) confirming zero Carnot-bound violations. Details are in each version's changelog, kept alongside the simulator files.

# License
CC BY 4.0 — see LICENSE.md. Free to use, adapt, and redistribute, including in paid courses, provided attribution to Tatai László is kept (the on-page credit line and this file). See the license file for exactly what that means in practice.

# Contact
Tatai László — laszlo.tatai@outlook.com


