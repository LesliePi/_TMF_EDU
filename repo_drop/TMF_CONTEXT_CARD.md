# TMF — CONTEXT CARD

**Purpose:** everything a fresh session needs to continue without re-reading the chat.
**State as of:** 15 August 2026 · artefact **v2.2.1** · verified, packaged, **not yet published**
**Author:** Tatai László · repo `https://github.com/LesliePi/_TMF_EDU` · CC BY 4.0

---

## 0. READ THESE FIRST, IN THIS ORDER

1. `TMF_CONTEXT_CARD.md` ← you are here
2. `TMF_Roadmap.md` — agreed plan, decisions and their rationale
3. `FullChain_audit.md` §2.6 — known defects, items 1–16
4. `TMF_WhitePaper_v1_0.md` §13 — reference list **with verification-status column**

---

## 1. FILES — KEEP vs. DISCARD

### Essential — I cannot work without these

| File | Why |
|---|---|
| `TMF_FullChain_Simulator_v22.html` | **The artefact.** ~343 kB, single file, v2.2.1 inside. Everything else describes this. |
| `FullChain_verify_v22.js` | Physics harness, 19 checks. Run before and after every change. |
| `FullChain_qa.js` | UI/legibility harness (measure/stats/collide/overflow/distort/shots). Written after the typography pass; **the modes encode the reference counts**, so regressions are visible. |
| `harvest_paper.js` | Regenerates every number in white paper §6–§9 from the shipped file. No figure is typed by hand. |
| `TMF_WhitePaper_v1_0.md` | Technical + theoretical paper, APA refs with verification status. |
| `FullChain_audit.md` | Scope, limitations, assumption register, 16 known defects. |
| `TMF_Roadmap.md` | The agreed plan and why each decision was taken. |
| `TMF_CONTEXT_CARD.md` | This file. |

### Repo files — keep, but I rarely touch them

`README.md` · `index.html` · `LICENSE.md` · `FullChain_v22_changelog.md`

### Other simulators — keep for the repo, I do not work on them

`TMF_Rankine_Simulator_v32.html` · `TMF_OttoDiesel_Simulator_v31/32/33.html`
`Rankine_audit.md` · `Rankine_v31_audit.md` · `OttoDiesel_audit.md`
`OttoDiesel_v31/v32_changelog.md` · `OttoDiesel_v33_turbo.md` · `v32_changelog.md`

> The Full Chain simulator inherited its Rankine core from `TMF_Rankine_Simulator_v32`
> in v1.7. Keep that file as provenance even though it is not edited.

### Safe to discard

Old screenshots (`v17_*.png`, `v18_*.png`, `v2x_*.png`, `typo_*.png`, `shot_*.png`,
`mobile_*.png`), superseded HTML (`TMF_FullChain_v1_6/1_7.html`, `app.js`,
`verify17.js`, `smoke.js`), any `_baseline.html`, and every zip older than
`TMF_EDU_v221_files.zip`. All regenerable.

### Environment note

Chromium is preinstalled at `/opt/pw-browsers/chromium`. **Do not run
`playwright install`.** `npm install playwright` only.

---

## 2. WHAT IS DONE

- **v1.6–v1.9** — 14 defect fixes; Rankine core replaced with the validated v32 implementation; sensitivity tab; OTDD marked as unimplemented; **σ-coupling made load-bearing** (this is what makes the conjecture falsifiable).
- **v2.0–v2.2** — Siegert stack loss (λ finally live); flue-gas/recovery tab; tab groups; treatment-stage order selector; **heat-transfer topology corrected** (parallel, not series); transfer rates and τ; Curzon–Ahlborn benchmark.
- **White paper v1.0** — abstract, executive summary, translation table, falsifiability argument, verification, limitations, APA references with verification status. **Three citations were found unverified or wrong and corrected** (Röder 2019 withdrawn → Colla 2024; IEC 60045-1 wetness → Baumann/Petr 2014; Siegert primary source not located).
- **v2.2.1 — typography** — contrast `#3d5268 → #6b86a0` (2.43:1 → **5.17:1**); an 11 px **rendered-pixel** floor enforced centrally in `txt()` with a width guard, so smallest text went 8.4 → 11.0 px at 1600 and **6.7 → 11.0 px at 1280** with **zero new overflow**; duplicate CSS/SVG panel headers de-duplicated (pre-existing, exposed not caused).
- **v2.2.1 — furnace physics** — **both** film coefficients corrected. See §3.

---

## 3. THE MOST IMPORTANT RECENT RESULT

Two errors were hiding each other for eight versions:

| | h_rad | h_gas | radiation's flux share | q |
|---|---|---|---|---|
| v2.2 as shipped | 386 | 2025 | 16 % | 2349 kW/m² |
| convective film only | 386 | 60 | 87 % | 501 |
| emissivity only | 131 | 2025 | 6 % | 2137 |
| **both (v2.2.1 default)** | **123** | **81** | **60 %** | **233 kW/m²** |

Realistic band is 100–300 kW/m². `h_straight = 1500` was a **water-side** coefficient on the gas side; `eps_flame = 0.85` implied a gas emissivity of **0.88**, i.e. a near-black-body flue gas. Both are now sliders; the old values remain reachable and labelled so the defect is still demonstrable.

**The ladder re-ordered:** `Z_conv = 1.23e-2` is now **larger** than `Z_rad = 8.15e-3`. Gas film is **98 %** of total resistance, wall **2 %**.

**Consequence for the user's earlier observation:** the near-geometric impedance ratios (6.5 / 6.17 / 40) existed *only* under the defect. At the corrected values they are 1.51 and 102. The pattern was an artefact.

**Deliberate design constraint, set by the author:** only citable, known constants. Gas emissivity is therefore an **explicit input**, not a correlation — the Hottel/Leckner/WSGG coefficient tables could not be obtained from an open source, and inventing an absorption coefficient was refused. The model computes p·L (0.165 bar·m at nominal) and says which chart to read ε from. Everything below ε is exact algebra.

---

## 4. NOT YET FIXED — the open list

### 4a. v2.2 close-out, still queued

| # | Item | Notes |
|---|---|---|
| **3** | **Log ladder + linear bar** | One horizontal log axis (~1e-5…1e-1 K·m²/W) with the three resistance markers; **gaps annotated with the named dimensionless group** (`1/Bi`, `h_conv/h_rad`) and the span in decades. τ becomes **labels, not its own chart** — on the two film paths τ_rad/τ_conv ≡ Z_rad/Z_conv, so only conduction adds information. Below it a thin **linear** stacked bar for the additive budget (`Z_gas ǀ Z_cond`). Log shows ratios, linear shows sums — a log axis cannot show a sum. Design goal: the panel ends with **fewer** charts. |
| **4** | **Percentage denominators** | Four percentages, **two denominators**: `Z_rad_pct`/`Z_conv_pct` divide by the superseded series sum, `Z_gas_pct`/`Z_cond_pct` by the correct `Z_total`. They sit side by side and look comparable. Unify on `Z_total`; keep the legacy figure explicitly labelled *"legacy (v2.1, superseded)"*. |

### 4b. Defects deliberately left open

| Item | Detail |
|---|---|
| **SVG aspect distortion — DEFERRED** | `preserveAspectRatio="none"` squashes glyphs to **0.64×** in 8 of 40 panels (worst: tab4 `svg-sys-cascade`/`svg-sys-eroi`, tab2 turbine panels). Fixing needs the viewBox **and every hard-coded coordinate** in the draw function — that is a redraw, not typography. `node FullChain_qa.js distort` lists them with suggested viewBox heights. |
| **Pre-existing overflow, 8 panels** | Two are pathological and predate everything: `tab7 svg-otdd-phase` (worst 69 722 units — almost certainly a NaN or runaway coordinate) and `tab3 svg-gen-loss` (1 578). **Not investigated.** The other 6 are ≤ 38 units and cosmetic. |
| **10 overlapping label pairs** | Down from 12; baseline was 5. Four are on tab 7 (OTDD, already marked unimplemented). The rest are header-vs-curve-peak labels — chart design, not typography. |
| **35 labels (6.2 %) still under 10 px at 1280** | Long explanatory footnotes that physically cannot be 11 px and fit. Fix is text wrapping, not a bigger floor. |
| **Dean factor may be on the wrong side of the wall** | ×1.35 describes flow *inside* a curved tube (Dean 1927); it is applied to the furnace-side gas film. Flagged, not removed. Audit item 15. |
| **No gas-emissivity correlation** | By choice — see §3. Correct fix: obtain Leckner 1972 or Smith/Shen/Friedman 1982 coefficient tables from the primaries and implement. Audit item 14. |
| **σ_μ = RSS assumes independence** | T and ρ non-uniformity are coupled through the equation of state, so RSS almost certainly overstates. No data to fix against. |
| **K = 0.15 fitted to nothing** | The conjecture's only constant. Everything downstream inherits its arbitrariness whenever σ > 0. |
| **No dynamic model** | τ values are computed but never integrated. **The largest missing capability.** The live-data panels re-evaluate a steady state; they are not a time series. |
| **EROI is first-order** | 3 % upstream assumption; bracketed by Colla et al. 2024 (fuel-level 20–37 for woodchips) but not a life-cycle inventory. |
| **No cost model** | The sensitivity ranking is thermodynamic payback only and cannot rank cost-effectiveness. |

### 4c. v2.3 — the design line (agreed, not started)

All three "established physics" items were approved. They are not novel; they are the credibility the one real claim gets read under.

- **A. Δp ↔ h trade (Bejan EGM)** — **prerequisite, not optional.** The Dean h-enhancement is in; the pressure-drop cost is not. A one-sided model always optimises to a boundary. Nothing spiral-shaped may be built before this.
- **B. UA allocation slider** — split a fixed total conductance between boiler and condenser; this **does** have an interior optimum (finite-time thermodynamics, same family as the Curzon–Ahlborn line already shipped). Cheapest of the three — both conductances and the CA reference already exist in the code.
- **C. Cyclone ash separation** — centrifugal capture plus the slagging limit. `ash_T` per fuel already exists (wood 1200 °C, straw 780 °C — straw hits the limit immediately, which is a real result). Serves the **no-waste** constraint directly.

### 4d. v2.4 — the spiral, and the only genuinely new claim

**Prerequisite: σ propagation along the chain.** `sig_mu_comb` and the turbine σ are currently **separate, unconnected numbers**. Build a spiral chamber today and it would lower the combustion σ while nothing downstream moved — repeating exactly the mistake η_TMF made before v1.9.

The spiral matters because, in the framework's own vocabulary, **a swirl chamber is a σ-reducing machine.** That makes it a test bed for the conjecture, not just a design idea.

### 4e. Launch — still open

- **GitHub Pages not confirmed live.** Blocks the Reddit launch.
- **Reddit post** (r/MechanicalEngineering) and **YouTube video** — drafted, discussed, not finalised.

---

## 5. WORKING RULES — do not rediscover these

1. **I do not push to the user's GitHub repo.** Deliverables go as a zip so the commit and authorship stay his. No credentials are configured.
2. **Plan first.** Discuss and agree before coding.
3. **Only citable, known constants.** If a coefficient table cannot be obtained, say so and make the quantity an explicit input — never invent a plausible number. This rule has already killed one emissivity correlation and one EROI citation.
4. **Publish known errors.** *"Nyílt lapokkal szeretek játszani."* Defects go on the panel in red and in the audit, not into a quiet fix.
5. **Every claim carries a tag:** `[PROVEN]` / `[NUMERICAL]` / `[CONJECTURE]` / `[OPEN]`.
6. **Separate representation from claim.** The author's positioning is *"az ismert narratíva, más keretben"* — the known narrative in a different frame. He does **not** want novelty claims. The white paper's translation table is the model: eleven rows of renaming, one row of claim.
7. **Baseline before you change anything visual.** `cp` the file, run `FullChain_qa.js` against both. A change is acceptable when counts do not rise — not when they are zero.
8. **Never claim a number from memory.** Re-run `harvest_paper.js`.
9. Output: Markdown, English documents, APA references. Conversation in Hungarian.

---

## 6. A PATTERN WORTH REMEMBERING

Three separate geometry instincts have now landed on **monotone** functions with no interior optimum:

- wall thickness (flux monotone decreasing in t)
- furnace surface area at fixed volume (ε·A monotone increasing in A)
- "hold the radiant heat longer" (steady state: storage changes nothing; a hotter wall re-radiates *more*)

**In this system the real optima come from trade-offs between two competing costs — Δp ↔ h, hot-end ↔ cold-end conductance — not from tuning one knob.** Expect the next geometry idea to be monotone too, and check before building a slider for it.

Corollary that did survive: *residence time depends on volume alone* (τ = V/V̇), and shape enters radiation **only** through S/V via Hottel's L = 3.6 V/A. The gas is what you can hold longer — not the heat.

---

## 7. NOMINAL OPERATING POINT (for sanity-checking any future run)

Wood chip, 0.060 kg/s, 15 % moisture, λ = 1.20, T_boil 300 °C, T_sh 480 °C, T_cond 45 °C, η_turb 0.82, σ_μ 0.1517.

| | |
|---|---|
| Q_in / T_flame / T_fluegas | 921.5 kW · 1462 °C · 216.1 °C |
| Q_boiler / ṁ_steam | 709.1 kW · 0.2257 kg/s |
| P_boil / P_cond | 85.88 / 0.096 bar |
| T̄ (entropic mean) | 252.8 °C |
| η_Carnot(T̄) / η_CA(T̄) / η actual | 39.50 % / 22.22 % / 32.27 % |
| W_mech / P_elec / η_total / EROI | 227.9 kW · 207.1 kW · 22.48 % · 6.22 |
| Exergy destroyed in combustion | **500.8 kW = 47.3 % of fuel exergy** |
| Boiler ΔT share of entropy generation | **70.8 %** |
| Second-law efficiency | 19.55 % |
| Impedance | Z_rad 8.15e-3 · Z_conv 1.23e-2 · Z_cond 8.0e-5 |
| q_flux / radiation share | 233 kW/m² · 60 % |
| L_beam / p·L / ε_eff | 0.74 m · 0.165 bar·m · 0.27 |

Verification reference: 13 tabs ok · 13 316 + 7 920 cases · **0 Carnot violations** · 0 console errors · 8 overflowing panels · 10 overlapping label pairs · 8 distorted panels.
