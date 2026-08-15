# The Thermodynamic Manifold Framework

## A distributional re-framing of classical plant thermodynamics, and one falsifiable conjecture

**Technical and theoretical white paper — version 1.0**

**Author:** Tatai László
**Software artefact:** TMF Full Chain Analyser v2.2 (`TMF_FullChain_Simulator_v22.html`)
**Date:** 15 August 2026
**Licence:** CC BY 4.0 (documentation and code)
**Repository:** https://github.com/LesliePi/_TMF_EDU

**Disclosure of method.** The simulator and this document were written by the author in an extended working session with an AI assistant (Anthropic Claude). All physics decisions, framing and scope choices are the author's. Numerical verification was executed by automated harness (Playwright/Chromium) against the shipped artefact; every number quoted in §7–§9 was read out of a run of the shipped file, not copied from an earlier draft. The reference list in §13 carries an explicit verification-status column: some citations were checked against a bibliographic record during preparation and some were not, and the two are distinguished rather than blended.

---

## 1. Abstract

Classical plant thermodynamics describes a working fluid by pointwise intensive properties — one temperature, one pressure, one density per station. Real control volumes are not pointwise: a furnace has a flame core and a wall boundary layer, a turbine stage has a hub and a tip, a fuel bed has dry and wet zones. The Thermodynamic Manifold Framework (TMF) is a representational proposal: describe each station not by a point on the state manifold but by a *distribution* over it, and carry the dispersion of that distribution — denoted σ — as an explicit state variable alongside the mean. The framework makes two claims of very different epistemic weight, and this paper keeps them apart on purpose. The first is a **change of representation**: the σ-vocabulary maps term-for-term onto quantities already standard in non-equilibrium thermodynamics, exergy analysis and heat-transfer network theory, and changes no prediction. §5 gives the translation table. The second is a **conjecture**: that the dispersion at a station degrades the work extractable at that station by a term quadratic in σ, δ = σ_μ²·κ·K, with a single free constant K, and that this degradation should be applied to the shaft work rather than reported as a decorative index. This second claim is not established, is not derived from first principles, and is tagged as conjecture throughout the software. The paper's contribution is to make it falsifiable: in v2.2 the σ-penalty is solved to a fixed point and multiplies the delivered mechanical work, so the conjecture produces a signed, measurable prediction — at fixed steam conditions and fixed nominal isentropic efficiency, raising σ_μ from 0 to 0.69 lowers delivered electrical power from 207.95 kW to 186.64 kW (−10.2 %) *while simultaneously raising* turbine exhaust steam quality from x₂ = 0.889 to 0.934. That co-signature — less work out, drier exhaust, same inlet — is what an experimenter would look for, and its absence would refute the conjecture as calibrated. The supporting artefact is a single-file HTML simulator implementing a biomass-fired Rankine plant on IAPWS steam-table data, with combustion, boiler, turbine, generator, exergy cascade, heat-transfer network, flue-gas recovery and sensitivity analysis, verified by 19 automated invariant checks including a 13 316-case sweep in which the classical efficiency never exceeded its Carnot bound, and a further 7 920-case sweep with the conjecture active in which it also never did.

**Keywords:** exergy analysis; entropy generation; Rankine cycle; finite-time thermodynamics; biomass combustion; non-equilibrium distribution; engineering education software

---

## 2. Executive summary

**What this is.** A free, single-file, browser-based teaching simulator for a small biomass-fired steam plant, plus a documented conjecture about how internal non-uniformity costs work.

**Who it is for.** Engineering students and instructors; practitioners who want a fast intuition pump for where plant losses actually live; and reviewers willing to attack a stated conjecture.

**What is standard and reliable.**

- The Rankine cycle is closed and entropy-consistent, on IAPWS-based saturation and superheat tables. Pump work heats the feedwater by the irreversible part only. Boiler duty equals ṁ·(h₁ − h₄) to machine precision.
- The correct Carnot reference for a Rankine cycle is taken at the **entropic mean temperature of heat addition**, T̄ = (h₁ − h₄)/(s₁ − s₄), not at peak superheat. At the nominal point T̄ = 252.8 °C, giving η_Carnot = 39.5 % against 57.8 % if peak temperature is used — the difference between an honest and a flattering benchmark.
- The exergy cascade is Gouy–Stodola accounting, not a discovery. It shows that of ~1 060 kW of fuel exergy, ~501 kW is destroyed in combustion alone, before the boiler is reached.
- The heat-transfer network is a proper circuit: radiation **in parallel with** convection on the gas side, wall conduction in series. v2.2 corrected this from a naive series sum. The correction changes the total resistance by a factor of 6.39 **and inverts the conclusion**: the old panel reported radiation as dominant at 82 %; the correct circuit gives 84 % of the heat flux through convection.

**What is conjecture.** The σ → work coupling, governed by one constant K = 0.15, tagged `[CONJECTURE]` on screen. At the default σ setting it costs 0.4 % of shaft work — below the resolution of most plant instrumentation, which the software says on screen. It becomes measurable only at σ_μ ≳ 0.35.

**Three findings a practitioner may care about.**

1. **The plant is tuned above its maximum-power point.** The Curzon–Ahlborn efficiency at maximum power for this cycle is 22.2 % (on T̄); the cycle runs at 32.3 %. It is trading output for efficiency, which is the correct choice when fuel is bought and capacity is not.
2. **The single largest entropy source is the boiler ΔT, at 70.8 % of in-cycle generation.** Not the turbine (16.2 %), not the condenser (12.8 %). The temperature drop from a 1 462 °C flame to 300 °C steam is the price of the whole plant.
3. **Marginal-gain ranking at the terminals is counter-intuitive.** +1 pp on the generator buys 3.15 kW; +1 pp on the boiler buys only 2.27 kW; −5 °C on the condenser buys 3.44 kW and is usually the cheapest. Sensitivity is computed by numerical forward difference through the whole chain, so clamps and phase changes are respected.

**Known defect, published rather than hidden.** The furnace heat flux computes to ≈ 2 348 kW/m², against a realistic furnace value of 100–300 kW/m². The cause is identified: the convective coefficient h = 1 500–2 025 W/m²K is a **water-side** value applied to the **gas** side, where 30–80 W/m²K would be right. It is flagged in red on the panel and has deliberately **not** been silently corrected, because the diagnostic is more instructive than a quiet fix. See §10.1.

**What would falsify the conjecture.** §11. Briefly: instrument a stage for inlet non-uniformity and exhaust quality simultaneously; the conjecture predicts they move in opposite directions at fixed inlet enthalpy. If exhaust quality does not rise as measured non-uniformity rises, the σ-coupling as calibrated is wrong.

---

## 3. Positioning: the known narrative in a different frame

This paper does not claim new physics. The author's stated aim is *the known narrative, in a different frame* — and it is worth being precise about what such a claim can and cannot buy.

A change of representation is not a change of content. Writing a cycle in (T, s) instead of (p, v) reveals areas as heat and hides them as work; the cycle is the same cycle. Writing a station as a distribution instead of a point is the same kind of move. It buys **salience**: quantities that were implicit become impossible to ignore. It costs **nothing in predictions**, and any framework that claims otherwise without new equations should be disbelieved.

Where TMF does more than re-describe is exactly one place: the σ → work coupling of §6. There, a term is added that classical cycle analysis does not contain, with a free constant, and the numbers move. That is a claim, not a re-description, and it is the only part of this work that can be wrong in the interesting sense.

Everything else in the artefact is ordinary engineering thermodynamics, done carefully, with its assumptions written down. The distinction is enforced in the software itself: the tabs are grouped, and the group named **TMF THEORY** carries the on-screen banner *"⚠ HYPOTHESIS, NOT RESULTS."*

### 3.1 Status marker convention

Every substantive statement in the code and documentation carries one of three tags.

| Tag | Meaning |
|---|---|
| `[PROVEN]` | Established physics or tabulated data. Wrong here means we made an implementation error. |
| `[NUMERICAL]` | A correlation, fit, or engineering rule of thumb. Right in range, approximate outside it, and the range is stated. |
| `[CONJECTURE]` | The author's proposal. Not established. May be wrong. Tagged so a reader can strip it out and still have a working plant model. |

---

## 4. Model architecture

### 4.1 The chain

The simulator models a serial energy chain, each stage consuming the previous stage's output:

```
fuel → combustion → boiler → Rankine cycle → generator → grid
              ↓          ↓          ↓            ↓
           flue gas   entropy    entropy      losses
              ↓       generation generation
        recovery / treatment train
```

Thirteen analysis panels are organised into four groups, a v2.1 change made because a flat tab bar had grown to 1 902 px in a 1 600 px window:

| Group | Panels | Epistemic character |
|---|---|---|
| **CHAIN** | Fuel, Combustion, Boiler, Turbine, Generator, Summary | Ordinary chain analysis |
| **ANALYSIS** | Sensitivity, Flue gas / Recovery, Impedance network | Numerical, done carefully |
| **TMF THEORY** | Entropy/κ, State trajectory | Hypothesis, not results |
| **LIVE DATA** | Data log, Acoustics | Instrumentation demonstration |

### 4.2 Property basis

Steam properties come from a 30-point saturation table with the Wagner saturation-pressure equation and a memoised bisection inverse (`tSatFromP`), plus superheat tables from 1 to 200 bar interpolated bilinearly. Above the dome and outside table coverage the model falls back to a constant-cₚ ideal-gas extension, which is stated as an approximation rather than silently blended.

Spot checks against published steam-table values:

| Condition | Model | Published | Deviation |
|---|---|---|---|
| 100 bar, 500 °C | h = 3 375.1 kJ/kg, s = 6.5993 kJ/kg·K | h ≈ 3 375.1, s ≈ 6.5994 | < 0.01 % |
| 40 bar, 400 °C | h = 3 214.4 kJ/kg, s = 6.7712 kJ/kg·K | h ≈ 3 213.6, s ≈ 6.7690 | 0.03 % |
| p_sat at 300 °C | 85.879 bar | 85.88 bar | < 0.01 % |
| p_sat at 100 °C | 1.0142 bar | 1.01325 bar | **+0.09 %** |

The last row is the largest deviation in the table and is stated rather than rounded away: the interpolated saturation pressure at the normal boiling point is 0.09 % high. That is immaterial for the condenser range this plant uses (0.096 bar at 45 °C) but a reader building on the property routines should know it is there.

### 4.3 The nominal operating point

Unless stated otherwise, every number in this paper is taken at these settings:

| Parameter | Value |
|---|---|
| Fuel | Wood chip, LHV_dry 18.5 MJ/kg, H 6.0 % |
| Fuel rate | 0.060 kg/s |
| Moisture | 15 % |
| Excess air λ | 1.20 |
| Boiler temperature | 300 °C (85.88 bar saturation) |
| Superheat | 480 °C |
| Condenser | 45 °C (0.096 bar) |
| η_turbine (isentropic, nominal) | 0.82 |
| η_pump | 0.75 |
| σ_T / σ_ρ / σ_v | 0.10 / 0.07 / 0.09 → σ_μ = 0.1517 |

---

## 5. The translation table

This section is the core of the "different frame" claim. Each row states a TMF term, the canonical quantity it corresponds to, and — critically — whether the mapping is exact (a pure renaming) or whether TMF adds something.

| TMF term | Canonical equivalent | Relation |
|---|---|---|
| **Thermodynamic manifold** | The thermodynamic state space; Gibbs' surface of equilibrium states (Gibbs, 1873) | Exact renaming. |
| **Distribution over the manifold** | The statistical distribution of intensive properties within a finite control volume; the departure from local equilibrium assumed by continuum thermodynamics | Exact renaming of an idea already present in non-equilibrium thermodynamics (de Groot & Mazur, 1962). |
| **σ_T, σ_ρ, σ_v** | Temperature, density and velocity non-uniformity within a station — a temperature profile, a density stratification, a velocity distribution across a blade passage | Exact renaming. These are measured quantities in real machines; nothing new is asserted by naming their spread. |
| **σ_μ** (combined dispersion) | Root-sum-square of the three, σ_μ = √(σ_T² + σ_ρ² + σ_v²) | A **definition** chosen by the author. The RSS combination assumes the three are independent; that assumption is not justified from first principles and is a weak point. |
| **Thermodynamic impedance Z** | Thermal resistance, 1/(UA) [K/W]; the reciprocal of conductance | Exact renaming. The circuit analogy is standard (Incropera et al., 2007); TMF adopts it wholesale. |
| **"Which path the energy chooses"** | Conductance-weighted parallel splitting: q_i/q = h_i/Σh | **Corrected by the framework's own model.** Energy does not choose. It takes every available path, in proportion to conductance. The simulator now displays this explicitly because the earlier "dominant path" language was misleading (§10.2). |
| **Transfer rate / τ** | Thermal time constant of the wall, τ = ρ·c·t/h; conduction time t²/2α; the Biot and Fourier numbers | Exact renaming. |
| **"Proper time" per stage** | *Nothing.* Explicitly withdrawn. | The author has stated this was used as a metaphor, not a relativistic claim, and it has been removed from the framework's vocabulary. It is listed here so that earlier drafts referring to it are not read as a live claim. |
| **State trajectory / helix** | The cycle path in (T, s) or (h, s) coordinates, rendered in a rotating 3-D projection | A **rendering**, not a result. The helix contains no information the T–s diagram does not. It is a visualisation aid and is labelled as such on the panel. |
| **"Ordered vs. disordered entropy"** | Exergy and anergy (Rant, 1956); available and unavailable energy | Exact renaming of a distinction formalised seventy years ago. TMF adds nothing here and should not be presented as though it does. |
| **Resonance / lock** | Mode locking in a driven oscillator; Arnold tongues (Arnol'd, 1961); the Rayleigh criterion for thermoacoustic instability (Rayleigh, 1878) | Exact renaming, applied to duct-junction reflection. |
| **η_TMF** | A penalty-modified isentropic efficiency: η_is,eff = η_is·(1 − δ), δ = σ_μ²·κ·K | **This is the addition.** Not a renaming. See §6. |

**Reading of the table.** Eleven of twelve rows are renamings or, in two cases, corrections that the canonical formulation forced on the TMF vocabulary. One row is a new term. That ratio is the honest summary of this work: it is a re-framing with a single conjecture attached, not a new thermodynamics. The value of the re-framing, if it has one, is pedagogical — it puts dispersion in the foreground where a pointwise model puts it out of sight — and pedagogical value is a legitimate thing to claim.

---

## 6. The conjecture, and its falsifiable form

### 6.1 Statement

Let a station be characterised by a mean state and a dispersion σ_μ. The conjecture is that the work extractable at that station is reduced relative to the uniform case by

> δ = σ_μ² · κ · K

where κ is a station-local drive factor computed from the cycle (κ_turb = 1.149 at nominal) and K is a single global constant, `KAPPA_SENS = 0.15`, tagged `[CONJECTURE]`.

The quadratic form is not derived. Its only defence is dimensional and symmetric: a first-order term would make the sign of the non-uniformity matter, and it should not — a station that is hot at the hub and cold at the tip should lose the same work as one cold at the hub and hot at the tip. The quadratic is the lowest order consistent with that symmetry. That is an argument for the *form*, not for the *magnitude*, and the magnitude is entirely carried by K, which is fitted to nothing.

### 6.2 Why this is not an index

Until v1.9, η_TMF was computed and displayed but did not affect any output. A number that changes nothing cannot be wrong, and therefore cannot be interesting. On the author's instruction the coupling was made load-bearing: the penalty now modifies the isentropic efficiency actually used to run the cycle, which changes h₂, which changes w_net, which changes shaft work, electrical output, plant efficiency and the entire sensitivity ranking.

Because δ depends on κ, which depends on the cycle, which now depends on δ, the system is implicit and is solved by fixed-point iteration:

```js
let delta = ref.delta_rel;
for (iters = 1; iters <= 8; iters++) {
  const eta_eff = Math.max(0.05, eta_t * (1 - delta));
  cy = rankineCycle(T_b, T_sh, T_c, eta_eff, eta_p, sig_mu);
  const nd = sig_mu * sig_mu * cy.kap_turb * KAPPA_SENS;
  last = Math.abs(nd - delta);
  delta = nd;
  if (last < 1e-10) break;
}
```

Convergence is fast and monotone across the operating envelope: 2–4 iterations to a residual below 10⁻¹⁰ over the full σ range tested.

| σ_μ | δ (%) | η reference (%) | η with TMF (%) | Δ work (%) | Iterations |
|---|---|---|---|---|---|
| 0.00 | 0.000 | 32.266 | 32.266 | 0.000 | 0 |
| 0.05 | 0.043 | 32.266 | 32.252 | −0.043 | 2 |
| 0.10 | 0.171 | 32.266 | 32.210 | −0.173 | 3 |
| 0.15 | 0.388 | 32.266 | 32.139 | −0.392 | 3 |
| 0.20 | 0.696 | 32.266 | 32.039 | −0.704 | 3 |
| 0.30 | 1.610 | 32.266 | 31.740 | −1.628 | 4 |
| 0.40 | 2.970 | 32.266 | 31.296 | −3.005 | 4 |

### 6.3 The predicted signature

Propagated to the terminals, with all three σ components swept together and everything else held fixed:

| σ (each component) | σ_μ | P_elec (kW) | η_total (%) | Exhaust quality x₂ |
|---|---|---|---|---|
| 0.00 | 0.000 | 207.95 | 22.565 | 0.8888 |
| 0.05 | 0.087 | 207.69 | 22.537 | 0.8894 |
| 0.10 | 0.173 | 206.89 | 22.451 | 0.8911 |
| 0.15 | 0.260 | 205.52 | 22.303 | 0.8939 |
| 0.20 | 0.346 | 203.51 | 22.084 | 0.8982 |
| 0.30 | 0.520 | 197.14 | 21.393 | 0.9115 |
| 0.40 | 0.693 | 186.64 | 20.253 | 0.9335 |

The last two columns are the point. **Power falls and exhaust quality rises together.** This is not arbitrary: work not extracted stays in the steam as enthalpy, and enthalpy retained at condenser pressure appears as reduced wetness. Any mechanism that degrades expansion work at fixed inlet must show this signature; a mechanism that merely wastes fuel upstream will not.

At the *default* σ setting the effect is 0.40 % of shaft work — 0.92 kW out of 228.80 kW. The software states on screen that this is below the resolution of most plant instrumentation, and that raising K to make the effect visible is itself a testable claim rather than a tuning convenience.

---

## 7. Results at the nominal point

### 7.1 Chain

| Station | Quantity | Value |
|---|---|---|
| Fuel | Energy input Q̇_in | 921.5 kW |
| Combustion | Adiabatic flame temperature | 1 462 °C |
| Combustion | Flue-gas exit temperature | 216.1 °C |
| Combustion | Efficiency (Siegert stack loss) | 87.44 % |
| Boiler | Duty available | 709.1 kW |
| Boiler | Steam mass flow | 0.2257 kg/s |
| Cycle | Boiler / condenser pressure | 85.88 / 0.096 bar |
| Cycle | h₁ / h₂ / h₃ / h₄ | 3 341.7 / 2 320.3 / 188.4 / 200.1 kJ/kg |
| Cycle | s₁ / s₂ | 6.6209 / 7.3413 kJ/kg·K |
| Cycle | Exhaust quality x₂ | 0.8905 |
| Cycle | Pump work | 11.75 kJ/kg |
| Cycle | Entropic mean temperature T̄ | 252.8 °C |
| Turbine | Shaft work | 227.9 kW |
| Generator | Efficiency | 90.9 % |
| Grid | Electrical output | 207.1 kW |
| Plant | Overall efficiency | 22.48 % |
| Plant | EROI (electrical) | 6.22 |

### 7.2 The four efficiency benchmarks

Reporting one efficiency and calling it "the" efficiency is the most common way plant analysis misleads. Four are computed and shown side by side:

| Benchmark | Value | What it means |
|---|---|---|
| η_Carnot at peak superheat (753 K) | 57.76 % | **Flattering and wrong** for a Rankine cycle. Heat is not added at 480 °C; it is added over a range starting at feedwater temperature. |
| η_Carnot at entropic mean T̄ (526 K) | 39.50 % | **The correct reversible bound.** T̄ = (h₁−h₄)/(s₁−s₄) is the temperature at which a reversible engine would receive the same heat with the same entropy. |
| η_Curzon–Ahlborn at T̄ | 22.22 % | Efficiency **at maximum power output** for an endoreversible engine, 1 − √(T_c/T_h) (Curzon & Ahlborn, 1975). |
| η actual (classical, this cycle) | 32.27 % | Where the plant runs. |

The plant sits **above** its Curzon–Ahlborn point and **below** Carnot. That is the normal and correct place for a fuel-fired plant: maximum power is not the design objective when fuel is a purchased input. A plant sitting *below* its Curzon–Ahlborn efficiency would be giving up both output and efficiency, which is a design error worth finding.

### 7.3 Entropy generation and exergy destruction

| Component | Ṡ_gen (kW/K) | Share | Ẋ_destroyed (kW) |
|---|---|---|---|
| **Boiler ΔT** | 3.149 | **70.8 %** | 208.3 |
| Turbine | 0.720 | 16.2 % | 47.7 |
| Condenser | 0.569 | 12.8 % | 37.7 |
| Pump | 0.009 | 0.2 % | 0.6 |
| **In-cycle total** | 4.448 | 100 % | 294.3 |

And the full cascade from fuel, using chemical exergy of biomass at β ≈ 1.10–1.20 · LHV (Szargut et al., 1988):

| Stage | Exergy (kW) |
|---|---|
| Fuel chemical exergy | 1 059.8 (range 1 013.7 – 1 105.8) |
| **Destroyed in combustion** | **500.8** |
| Remaining in products | 559.0 |
| Destroyed in boiler heat transfer | 208.3 |
| Destroyed in turbine | 47.7 |
| Destroyed in condenser | 37.7 |
| Lost up the stack | 35.5 |
| Lost in generator | 20.7 |
| Delivered as electricity | 207.1 |
| **Second-law efficiency** | **19.55 %** |

*Closure note:* the destruction and delivery terms below the products line sum to 557.7 kW against 559.0 kW of product exergy — a residual of 1.24 kW, 0.2 %. It is not zero because the boiler and stack terms are computed on slightly different reference states. The residual is small enough not to affect any conclusion and large enough that "the cascade closes exactly" would be an overstatement.

The single most important line is the third. **Nearly half the fuel's exergy is destroyed by combustion itself**, before any heat-transfer surface is reached. Burning is the conversion of a highly ordered chemical potential into a thermal potential at 1 462 °C, and that step is irreversible no matter how good the boiler is. No boiler improvement can recover it; only a different conversion route (fuel cell, chemical looping) can.

A distinction that is repeatedly muddled and is enforced in the software: **destroyed exergy is not lost energy.** The 500.8 kW destroyed in combustion is still present as energy in the flue gas — it has simply lost the ability to do work. The 35.5 kW *lost* up the stack is a separate, smaller quantity: energy that has left the system entirely. Confusing them makes recovery projects look far more attractive than they are.

### 7.4 Marginal gain: where a development budget pays back

Computed by numerical forward difference through the whole chain, restoring parameters exactly afterwards (verified side-effect-free).

**Efficiency improvements, +1 percentage point each — directly comparable:**

| Component | ΔP_elec (kW) | Δη_total (pp) |
|---|---|---|
| Generator | **3.153** | 0.342 |
| Turbine | 2.467 | 0.268 |
| Boiler | 2.270 | 0.246 |
| Pump | 0.021 | 0.002 |

The ranking is the opposite of intuition. The generator is the *last* component in the chain and therefore the only one whose improvement is not attenuated by everything downstream — its transmission coefficient is highest precisely because there is nothing after it. The pump is negligible because pump work is ~1 % of turbine work in a steam cycle.

**Operating-point changes — comparable to each other, but NOT to the block above,** because a degree of condenser temperature and a point of generator efficiency cost entirely different amounts of money and steel. The software has no cost model and says so.

| Change | ΔP_elec (kW) |
|---|---|
| Fuel moisture −2 % | 4.800 |
| Condenser T −5 °C | 3.440 |
| Boiler T +10 °C | 2.310 |
| Excess air λ −0.10 | 1.232 |
| Superheat T +10 °C | 0.766 |
| cos φ +0.02 | 0.588 |

Two observations worth teaching from. First, **drier fuel is the largest single lever** on delivered power — but note that Δη_total for that row is *negative* (−0.090 pp) even though ΔP_elec is strongly positive (+4.80 kW), because drier fuel raises the fuel's usable energy input Q̇_in faster than it raises output. Reporting only efficiency would hide a real gain in power; reporting only power would hide a real dilution of efficiency. This is the clearest case in the model of why a single headline number is never enough. Second, **superheat is a weak lever** here — +10 °C of superheat buys a fifth of what −5 °C of condenser temperature buys, because superheat raises T̄ only slightly while condenser temperature moves the cold end directly.

### 7.5 Flue gas and recovery

| Quantity | Value |
|---|---|
| Flue-gas mass flow | 0.528 kg/s |
| Water dew point | 47.4 °C |
| Sensible thermal energy / exergy | 119.1 kW / 27.9 kW |
| Latent (recoverable below dew point) / exergy | 89.2 kW / 7.6 kW |
| Chemical (CO) / exergy | 0.83 kW / 0.79 kW |
| Kinetic / exergy | 0.028 kW / 0.028 kW |
| LHV_wet / HHV_wet | 15.36 / 16.85 MJ/kg (ratio 1.097) |

The energy/exergy split in this table is the "112 % condensing boiler" explained. There really are 89.2 kW of latent heat in the flue gas, and a condensing boiler really can recover a large part of it — which is why an LHV-referenced efficiency can legitimately exceed 100 %. Referenced against HHV it cannot exceed 100 %, ever. The ratio HHV_wet/LHV_wet = 1.097 for this fuel is precisely the size of the accounting artefact. But note the exergy column: those 89.2 kW carry only 7.6 kW of work potential, because they are available at 47 °C. **Recoverable is not the same as valuable.** Latent heat at dew point is excellent for space heating or greenhouse use and nearly worthless for making electricity.

---

## 8. The heat-transfer network — and a correction worth publishing

### 8.1 What was wrong

Through v2.1 the model summed the three thermal resistances in series:

> Z_series = Z_rad + Z_conv + Z_cond

This is wrong. Radiation and convection are two *parallel* paths from the same gas to the same wall; only the wall conduction is in series with them. The correct circuit is

> Z_gas = (1/Z_rad + 1/Z_conv)⁻¹ ,  Z_total = Z_gas + Z_cond

### 8.2 What the correction changes

| Quantity | v2.1 (series) | v2.2 (correct) | Ratio |
|---|---|---|---|
| Total resistance (K/W) | 3.163 × 10⁻³ | 4.947 × 10⁻⁴ | **6.39× overstated** |
| Reported dominant mechanism | Radiation, 82 % of resistance | Convection, **84 % of heat flux** | **inverted** |

The conclusion did not merely shift; it reversed. Both values are still displayed side by side in the software so a reader can audit the change rather than take it on trust.

The reason the conclusion inverts is instructive. In a series circuit the *largest* resistance dominates, so Z_rad = 2.589 × 10⁻³ looked decisive. In a parallel circuit the *smallest* resistance dominates the flux, and Z_conv = 4.938 × 10⁻⁴ is five times smaller. Radiation carries 16.0 % of the flux and convection 83.9 %. On the resistance side, the gas film accounts for 83.8 % and the wall 16.2 %.

### 8.3 Rates

The author's request was to display transfer *rates* alongside impedance, on the reasoning that the speed at which one energy form becomes another is as informative as the resistance to it. Wall response time constants, τ = ρ·c·t/h with steel at ρ = 7 850 kg/m³, c = 490 J/kg·K, t = 4 mm:

| Path | h (W/m²K) | Flux share | τ (s) |
|---|---|---|---|
| Radiation | 386 | 16.0 % | 39.8 |
| Convection | 2 025 | 83.9 % | 7.6 |
| Conduction through wall (t²/2α) | — | series | 0.62 |

The three time constants span two orders of magnitude, and that spread is the physical content of the "which path" question. Conduction equilibrates in under a second; the convective film in seconds; the radiative coupling in tens of seconds. A transient — a load change, a fuel-feed interruption — therefore propagates through these three channels at visibly different speeds, and the slowest one sets the plant's thermal inertia.

The on-panel formulation of the corrected picture: **energy does not choose a route — it takes both, split by conductance.**

---

## 9. Verification

The artefact is verified by an automated Playwright/Chromium harness (`FullChain_verify_v22.js`) executed against the shipped file. Nineteen checks; the substantive ones:

| Check | Result |
|---|---|
| All 13 panels render without console error | 13/13 pass, 0 errors |
| **η_classic ≤ η_Carnot(T̄)** over the full slider space | 13 316 cases, **0 violations** |
| **Same, with the TMF coupling live** | 7 920 cases, **0 violations** |
| Independent re-sweep with the coupling live (σ ∈ {0, 0.15, 0.35}, coarser grid, separate script) | 10 800 cases, **0 violations** |
| Entropy rises through the turbine (s₂ ≥ s₁) | 0 violations |
| η_TMF ≤ η_classic always | 0 violations |
| Cycle closure: Q̇_boiler = ṁ(h₁ − h₄) | residual < 10⁻⁹ kW |
| Feedwater enthalpy = pump exit enthalpy | exact |
| Pump work continuous across the 180 °C table boundary | jump < 0.3 kJ/kg |
| Previously dead sliders (η_gen, cos φ, slip, λ) respond | all respond, correct sign |
| IAPWS spot checks vs. published values | agree to table precision |
| SHA-256 log hash chain under write stress | chain intact |
| Sensitivity analysis leaves parameter state unmodified | exact restore |
| Siegert stack loss monotone in flue temperature and λ | monotone |
| Exergy cascade closes within tolerance | residual 0.2 % (see §7.3) |
| Treatment-stage ordering changes the result | confirmed order-dependent |

The second and third rows are the ones that matter. The most common failure mode in a hand-built cycle model is an efficiency that quietly exceeds its Carnot bound in some corner of the parameter space, and the only way to know it does not is to sweep the space. It has been swept, including with the conjecture active — the σ-coupling is one-signed and cannot manufacture a second-law violation.

**Reproducing:**

```bash
npm install playwright
node FullChain_verify_v22.js
```

---

## 10. Limitations and known defects

The author's instruction for this document was to publish known errors rather than conceal them. The full register is in `FullChain_audit.md`; the material items follow.

### 10.1 The furnace heat flux is implausible by an order of magnitude

The model computes q̇ = (T_flame − T_boil)/Z_total ≈ **2 348 kW/m²**. A real furnace waterwall runs at 100–300 kW/m². The cause is identified: the convective coefficient in use (h_straight = 1 500 W/m²K, 2 025 W/m²K after the Dean curvature correction) is a **water-side** boiling coefficient applied to the **gas** side, where a furnace gas film is nearer 30–80 W/m²K. Correcting it would reduce the convective branch by roughly 25–60×, which would restore radiation to dominance and reverse the §8.2 conclusion a second time.

It has not been corrected. The value is flagged in red on the panel with the diagnosis attached. The reasoning: the error is a textbook example of the most common mistake in heat-transfer network modelling — using a coefficient from the wrong side of a wall — and a reader who finds it by inspection has learned more than one who is handed a corrected number. It is listed first here so that no one mistakes it for an oversight.

### 10.2 The impedance panel's earlier "dominant path" language was wrong

Corrected in v2.2 (§8). Recorded here because the framework's own vocabulary — "which path does the energy choose" — invited the error. Energy takes all available paths simultaneously. The vocabulary has been amended.

### 10.3 σ_μ is a definition, not a measurement

The root-sum-square combination of σ_T, σ_ρ and σ_v assumes independence. In a real turbine stage temperature and density non-uniformity are strongly correlated through the equation of state, so RSS almost certainly overstates the combined dispersion. No attempt has been made to fix this because there is no data to fix it against.

### 10.4 K = 0.15 is fitted to nothing

The conjecture's single constant was chosen so that the effect at plausible σ is small but non-zero. It has no experimental basis. Everything downstream of the coupling — η_total, EROI, the entire sensitivity ranking — inherits that arbitrariness whenever σ > 0.

### 10.5 The state-trajectory panel computes nothing new

The helix is a projection of the cycle path already computed in (T, s). It contains no information the T–s diagram does not. It is a visualisation.

### 10.6 The OTDD operator is not implemented

The panel is retained and marked. It computes no result.

### 10.7 The rolling history is not a time series

The live-data panels re-evaluate a steady state at intervals and plot the results in sequence. There is no dynamic model — no thermal masses, no lags, no controller. The τ values of §8.3 are computed but not integrated. A genuine transient model is the single largest missing capability.

### 10.8 The Siegert coefficients are fitted per fuel, not tabulated

The stack-loss correlation q_A = (T_fg − T_air)·(A₂/(21 − O₂) + B) is standard, but the per-fuel A₂ values used (0.66–0.76) are the author's, chosen for plausible behaviour across the fuel set. Published tables give A₂ values in a comparable range for solid fuels but the exact numbers here are not from a standard.

### 10.9 EROI is first-order

Electrical output divided by an assumed upstream investment of 3 % of delivered LHV. A rigorous figure requires a full life-cycle inventory. The 3 % assumption is at least bracketed by published woodchip figures (Colla et al., 2024, report fuel-level EROI 20–37 for woodchips, implying invested fractions of 2.7–5 %), and the resulting electrical EROI of 6.22 sits where η_elec × EROI_fuel would predict.

### 10.10 No cost model

The sensitivity ranking is thermodynamic payback only. It cannot and does not rank by cost-effectiveness.

---

## 11. How to falsify the conjecture

A conjecture that cannot be killed is not worth stating. Three routes, in increasing order of difficulty.

**Route 1 — the co-signature test (§6.3).** Instrument a turbine stage for inlet non-uniformity (temperature traverse across the inlet annulus, radial velocity profile) and for exhaust steam quality, simultaneously, at fixed inlet enthalpy and fixed mass flow. The conjecture predicts that as measured non-uniformity rises, shaft power falls *and* exhaust quality rises. If power falls while exhaust quality is flat or falls, the loss is happening somewhere other than in the expansion, and the σ-coupling as formulated is wrong. This is the cleanest test because the two measurements are independent instruments and the predicted correlation is signed.

**Route 2 — the magnitude test.** Fit K from a stage with known inlet profile distortion and known efficiency deficit. If the fitted K varies by more than an order of magnitude between machines, the single-constant form is wrong even if the quadratic form is right.

**Route 3 — the form test.** Measure the efficiency deficit against σ_μ across a range wide enough to distinguish quadratic from linear or quartic. The quadratic is an assumption from symmetry, not a result.

**What would count as support rather than refutation:** a measured deficit that scales as σ² with a K consistent across at least two dissimilar machines. That is a demanding bar and it should be.

**What would not count:** agreement of the simulator with plant data at default settings. At default σ the conjecture contributes 0.4 % of shaft work, which is inside the uncertainty of every term around it. Agreement there tests nothing.

---

## 12. Conclusion

The Thermodynamic Manifold Framework, stripped of vocabulary, consists of one representational proposal and one physical conjecture.

The representational proposal — carry the dispersion of a station's state distribution alongside its mean — is not new physics and this paper does not claim it is. §5 maps it term-for-term onto quantities that exergy analysis, non-equilibrium thermodynamics and heat-transfer network theory have carried for decades. Its defence is pedagogical: it makes non-uniformity structurally visible in a model where a pointwise formulation makes it invisible, and in two places during this work the re-framing forced a correction to the model rather than the reverse (the parallel-path topology of §8, the withdrawal of the "path selection" language of §10.2). A frame that corrects its own author is doing some work.

The conjecture — that dispersion costs extractable work as σ² with a single constant — is unestablished and is labelled as such wherever it appears. Its one virtue is that it has been made to bite. It scales the delivered shaft work, so it produces a signed, measurable, refutable prediction, complete with a co-signature that distinguishes it from generic inefficiency. It may well be wrong. It is now the kind of thing that can be shown to be wrong, which is the only property this paper claims for it.

The supporting artefact is offered as an educational tool with its errors published rather than hidden, including one order-of-magnitude defect deliberately left in place and flagged, because finding it teaches more than being spared it.

---

## 13. References

APA 7th edition. The **Status** column records whether the citation was checked against a bibliographic record during preparation of this document. Entries marked *unverified* are cited in good faith but the reader should confirm them before relying on them or reproducing them in a submitted work. Entries marked *withdrawn* were cited in earlier versions of the software and have been removed; they are listed so that older copies can be corrected.

| # | Reference | Status |
|---|---|---|
| 1 | Arnol'd, V. I. (1961). Small denominators. I. Mapping of the circumference onto itself. *Izvestiya Akademii Nauk SSSR, Seriya Matematicheskaya, 25*(1), 21–86. (English translation: *American Mathematical Society Translations, Series 2, 46*, 213–284, 1965.) | Verified (title, author, journal); translation volume **unverified** |
| 2 | Bejan, A. (1996). Entropy generation minimization: The new thermodynamics of finite-size devices and finite-time processes. *Journal of Applied Physics, 79*(3), 1191–1218. https://doi.org/10.1063/1.362674 | **Verified** |
| 3 | Colla, M., deChambost, E., Merceron, L., Blondeau, J., Jeanmart, H., & Boissonnet, G. (2024). Estimating the energy return on investment of forestry biomass: Impacts of feedstock, production techniques and post-processing. *GCB Bioenergy, 16*(6), e13146. https://doi.org/10.1111/gcbb.13146 | **Verified** |
| 4 | Curzon, F. L., & Ahlborn, B. (1975). Efficiency of a Carnot engine at maximum power output. *American Journal of Physics, 43*(1), 22–24. https://doi.org/10.1119/1.10023 | **Verified** |
| 5 | de Groot, S. R., & Mazur, P. (1962). *Non-equilibrium thermodynamics*. North-Holland. | Unverified (edition/publisher not checked) |
| 6 | Dean, W. R. (1927). XVI. Note on the motion of fluid in a curved pipe. *The London, Edinburgh, and Dublin Philosophical Magazine and Journal of Science, 4*(20), 208–223. https://doi.org/10.1080/14786440708564324 | **Verified** |
| 7 | Dittus, F. W., & Boelter, L. M. K. (1930). Heat transfer in automobile radiators of the tubular type. *University of California Publications in Engineering, 2*(13), 443–461. | **Verified** |
| 8 | Gibbs, J. W. (1873). A method of geometrical representation of the thermodynamic properties of substances by means of surfaces. *Transactions of the Connecticut Academy of Arts and Sciences, 2*, 382–404. | Unverified (volume/pages not checked) |
| 9 | Gouy, G. (1889). Sur l'énergie utilisable. *Journal de Physique Théorique et Appliquée, 8*(1), 501–518. https://doi.org/10.1051/jphystap:018890080050101 | **Verified** |
| 10 | Incropera, F. P., DeWitt, D. P., Bergman, T. L., & Lavine, A. S. (2007). *Fundamentals of heat and mass transfer* (6th ed.). Wiley. | Unverified (edition not checked) |
| 11 | Kotas, T. J. (1985). *The exergy method of thermal plant analysis*. Butterworths. ISBN 0-408-01350-8 | **Verified** |
| 12 | Murray, C. D. (1926). The physiological principle of minimum work: I. The vascular system and the cost of blood volume. *Proceedings of the National Academy of Sciences, 12*(3), 207–214. https://doi.org/10.1073/pnas.12.3.207 | **Verified** |
| 13 | Petr, V., & Kolovratník, M. (2014). Wet steam energy loss and related Baumann rule in low pressure steam turbines. *Proceedings of the Institution of Mechanical Engineers, Part A: Journal of Power and Energy, 228*(2), 206–215. https://doi.org/10.1177/0957650913512314 | **Verified** |
| 14 | Rant, Z. (1956). Exergie, ein neues Wort für "technische Arbeitsfähigkeit". *Forschung auf dem Gebiete des Ingenieurwesens, 22*, 36–37. | **Unverified** — the attribution of the term *exergy* to Rant (1956) is well established, but the volume and page numbers here could not be confirmed against a bibliographic record |
| 15 | Rayleigh, J. W. S. (1878). The explanation of certain acoustical phenomena. *Nature, 18*(455), 319–321. https://doi.org/10.1038/018319a0 | **Verified** |
| 16 | Stodola, A. (1905). *Steam turbine* (L. C. Loewenstein, Trans.). D. Van Nostrand. | Partially verified (author, year, publisher); the specific derivation underpinning the Gouy–Stodola theorem was **not** located in this edition |
| 17 | Szargut, J., Morris, D. R., & Steward, F. R. (1988). *Exergy analysis of thermal, chemical, and metallurgical processes*. Hemisphere. | **Verified** |
| 18 | Wagner, W., & Pruß, A. (2002). The IAPWS formulation 1995 for the thermodynamic properties of ordinary water substance for general and scientific use. *Journal of Physical and Chemical Reference Data, 31*(2), 387–535. https://doi.org/10.1063/1.1461829 | **Verified** |
| 19 | Wagner, W., et al. (2000). The IAPWS industrial formulation 1997 for the thermodynamic properties of water and steam. *Journal of Engineering for Gas Turbines and Power, 122*(1), 150–184. | Partially verified (title and journal confirmed); **full author list, volume and pages unverified** |
| 20 | Siegert stack-loss correlation — **no primary source located.** The correlation q_A = (T_fg − T_air)·(A/(21 − O₂) + B) is universally attributed to Siegert in combustion-analyser documentation and in DIN-derived practice, but a citable primary publication was not found during preparation. Treat as folk-standard engineering practice until a primary source is identified. | **Unverified — primary source not located** |
| 21 | IEC 60045-1:2020, *Steam turbines — Part 1: Specifications*. International Electrotechnical Commission. | Standard exists and title is **verified**; the attribution of the x₂ ≥ 0.88 wetness limit to this standard is **unverified** and has been downgraded in the software from `[PROVEN]` to `[NUMERICAL]`. Use reference 13 for the Baumann rule instead. |
| 22 | Röder, M., et al. (2019). *Biomass and Bioenergy* — cited in earlier code comments for a woodchip EROI range of 3–12. | **Withdrawn.** Could not be located. Replaced by reference 3. Correct this in any copy of the source predating v2.2. |

---

## Appendix A — Nomenclature

| Symbol | Meaning | Unit |
|---|---|---|
| h | Specific enthalpy | kJ/kg |
| s | Specific entropy | kJ/kg·K |
| x₂ | Turbine exhaust steam quality (vapour mass fraction) | — |
| T̄ | Entropic mean temperature of heat addition, (h₁−h₄)/(s₁−s₄) | K |
| Ṡ_gen | Entropy generation rate | kW/K |
| Ẋ | Exergy rate | kW |
| Z | Thermal impedance (resistance) | K/W |
| h_rad, h_conv | Radiative / convective heat-transfer coefficient | W/m²K |
| τ | Thermal time constant | s |
| α | Thermal diffusivity | m²/s |
| σ_T, σ_ρ, σ_v | TMF dispersion of temperature, density, velocity | — (normalised) |
| σ_μ | Combined dispersion, √(σ_T²+σ_ρ²+σ_v²) | — |
| δ | TMF work-degradation fraction, σ_μ²·κ·K | — |
| κ | Station drive factor (cycle-dependent) | — |
| K | `KAPPA_SENS` = 0.15, the conjecture's free constant | — |
| λ | Excess-air ratio | — |
| q_A | Siegert stack loss | % |
| β | Biomass chemical-exergy factor, Ẋ_fuel/LHV | — |

## Appendix B — Reproducing every number in this paper

```bash
git clone https://github.com/LesliePi/_TMF_EDU
cd _TMF_EDU
npm install playwright
node FullChain_verify_v22.js     # the 19 invariant checks of §9
node harvest_paper.js            # the tables of §6, §7, §8
```

Both scripts run headless Chromium against the shipped `TMF_FullChain_Simulator_v22.html`. No number in §6–§9 was written by hand.

## Appendix C — Document history

| Version | Date | Change |
|---|---|---|
| 1.0 | 2026-08-15 | First issue, against simulator v2.2. |
