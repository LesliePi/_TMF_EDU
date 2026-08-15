// TMF Full Chain Analyser v1.7 — verification harness
// Author: László Tatai (2026) — Thermodynamic Manifold (TMF) project · CC BY 4.0
//
// Checks the invariants listed in FullChain_audit.md §4 and prints JSON.
//   npm i playwright && npx playwright install chromium
//   node FullChain_verify_v18.js
// Add your own checks here — that is the point of shipping it.
const { chromium } = require('playwright');
require('fs').mkdirSync('_verify_out', { recursive: true });

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
  const errors = [];
  page.on('console', m => { if (m.type() === 'error' && !/TUNNEL|ERR_/.test(m.text())) errors.push('CONSOLE: ' + m.text()); });
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  await page.goto('file://' + require('path').resolve('TMF_FullChain_Simulator_v19.html'));
  await page.waitForTimeout(700);

  const R = {};

  // 1. Tabs still all render
  R.tabs = await page.evaluate(async () => {
    const out = [];
    for (let i = 0; i < 12; i++) {
      switchTab(i);
      await new Promise(r => setTimeout(r, 60));
      const p = document.getElementById('panel' + i);
      out.push(`${i}:${p && p.classList.contains('active') ? 'ok' : 'FAIL'}`);
    }
    switchTab(0);
    return out.join(' ');
  });

  // 2. THE key invariant: eta_classic must never exceed its Carnot bound,
  //    swept over the whole slider space of the cycle.
  R.carnotSweep = await page.evaluate(() => {
    let n = 0, viol = 0, worst = null, wetN = 0, dryN = 0;
    for (let Tb = 100; Tb <= 340; Tb += 10)
      for (let Tsh = Tb + 20; Tsh <= 560; Tsh += 20)
        for (let Tc = 20; Tc <= 90; Tc += 10)
          for (const et of [0.60, 0.75, 0.85, 0.95]) {
            if (Tc > Tb - 20) continue;
            const cy = rankineCycle(Tb, Tsh, Tc, et, 0.75, 0.15);
            n++;
            if (cy.dryExhaust) dryN++; else wetN++;
            const slack = cy.eta_carnot_mean - cy.eta_cl;
            if (slack < -1e-9) {
              viol++;
              if (!worst || slack < worst.slack) worst = { Tb, Tsh, Tc, et, slack: +slack.toFixed(5), eta_cl: +cy.eta_cl.toFixed(4), eta_C: +cy.eta_carnot_mean.toFixed(4) };
            }
          }
    return { cases: n, violations: viol, worst, wetExhaust: wetN, dryExhaust: dryN };
  });

  // 3. Second law: entropy must rise through the turbine, and eta_TMF <= eta_cl
  R.secondLaw = await page.evaluate(() => {
    let n = 0, sBad = 0, tmfBad = 0, qBad = 0;
    for (let Tb = 120; Tb <= 340; Tb += 20)
      for (let Tsh = Tb + 20; Tsh <= 560; Tsh += 40)
        for (let Tc = 20; Tc <= 80; Tc += 20) {
          if (Tc > Tb - 20) continue;
          const cy = rankineCycle(Tb, Tsh, Tc, 0.82, 0.75, 0.15);
          n++;
          if (cy.s2 < cy.s1 - 1e-9) sBad++;          // real expansion generates entropy
          if (cy.eta_tmf > cy.eta_cl + 1e-12) tmfBad++;
          if (cy.q_in <= 0) qBad++;
        }
    return { cases: n, entropyDropInTurbine: sBad, etaTmfAboveClassic: tmfBad, nonPositiveQin: qBad };
  });

  // 4. Closed loop: boiler duty must equal m_steam*(h1 - h4)
  R.closedLoop = await page.evaluate(() => {
    _pipeParamHash = '';
    const { boil, turb } = runPipeline();
    const duty = boil.m_steam * (boil.h_in - boil.h_fw);
    return {
      Q_avail_kW: +boil.Q_avail.toFixed(3),
      m_steam_x_dh: +duty.toFixed(3),
      residual_kW: +(boil.Q_avail - duty).toFixed(9),
      h_feedwater: +boil.h_fw.toFixed(2),
      h_pump_exit: +turb.h4.toFixed(2),
      feedwater_equals_pump_exit: Math.abs(boil.h_fw - turb.h4) < 1e-9
    };
  });

  // 5. Pump work: continuous across T_boil = 180 (v1.6 had a step function there)
  R.pumpContinuity = await page.evaluate(() => {
    const w = t => rankineCycle(t, 480, 45, 0.82, 0.75, 0.15).w_pump;
    const a = w(179), b = w(180), c = w(181);
    return { at179: +a.toFixed(3), at180: +b.toFixed(3), at181: +c.toFixed(3),
             jump: +Math.abs(b - a).toFixed(4), smooth: Math.abs(b - a) < 0.3 };
  });

  // 6. Sliders that were dead in v1.6 must now move the outputs
  R.sliderWiring = await page.evaluate(() => {
    const snap = () => { _pipeParamHash = ''; const { gen } = runPipeline();
      return { eta: +gen.eta_gen.toFixed(5), P: +gen.P_elec.toFixed(3), f: +gen.f_actual.toFixed(4) }; };
    const save = { g: P.eta_gen, c: P.cos_phi, s: P.slip, l: P.lambda };
    const base = snap();
    P.eta_gen = 0.80; const lowEta = snap(); P.eta_gen = 0.97; const hiEta = snap(); P.eta_gen = save.g;
    P.cos_phi = 0.70; const lowPf = snap(); P.cos_phi = 1.00; const hiPf = snap(); P.cos_phi = save.c;
    P.slip = 0.005; const loSlip = snap(); P.slip = 0.08; const hiSlip = snap(); P.slip = save.s;
    P.lambda = 1.0; _pipeParamHash = ''; const l1 = runPipeline().comb.T_flame;
    P.lambda = 2.5; _pipeParamHash = ''; const l25 = runPipeline().comb.T_flame;
    P.lambda = save.l; _pipeParamHash = '';
    return {
      eta_gen: { at080: lowEta.eta, base: base.eta, at097: hiEta.eta, responds: lowEta.eta < base.eta && base.eta < hiEta.eta },
      cos_phi: { at070: lowPf.P, at100: hiPf.P, responds: lowPf.P < hiPf.P },
      slip_droop: { at0005: loSlip.f, at008: hiSlip.f, responds: Math.abs(loSlip.f - hiSlip.f) > 1e-3 },
      lambda_Tflame: { at1_0: +l1.toFixed(1), at2_5: +l25.toFixed(1), coolsWithExcessAir: l25 < l1 }
    };
  });

  // 7. Nominal operating point, before/after comparison values
  R.nominal = await page.evaluate(() => {
    _pipeParamHash = '';
    const { comb, boil, turb, gen } = runPipeline();
    return {
      T_flame_C: +comb.T_flame.toFixed(0),
      P_boiler_bar: +turb.P_bar.toFixed(2),
      P_cond_bar: +turb.P_cond_bar.toFixed(4),
      h1_kJkg: +boil.h_in.toFixed(1), s1_kJkgK: +boil.s1 || +boil.s_in.toFixed(4),
      h4_kJkg: +turb.h4.toFixed(1),
      w_pump_kJkg: +turb.w_pump.toFixed(2),
      m_steam_kgs: +boil.m_steam.toFixed(4),
      x2: +turb.x2.toFixed(4),
      eta_cl_pct: +(turb.eta_cl * 100).toFixed(2),
      eta_tmf_pct: +(turb.eta_tmf * 100).toFixed(2),
      eta_C_mean_pct: +(turb.eta_carnot_mean * 100).toFixed(2),
      eta_C_max_pct: +(turb.eta_carnot_max * 100).toFixed(2),
      T_mean_C: +(turb.T_mean - 273.15).toFixed(1),
      W_mech_kW: +turb.W_mech.toFixed(1),
      P_elec_kW: +gen.P_elec.toFixed(1),
      eta_gen_pct: +(gen.eta_gen * 100).toFixed(2),
      eta_total_pct: +(PIPE.eta_total * 100).toFixed(2),
      EROI: +PIPE.EROI.toFixed(2)
    };
  });

  // 8. Animation tab and analysis tab must agree (they were separate impls)
  R.animAgreement = await page.evaluate(() => {
    _pipeParamHash = '';
    const { turb } = runPipeline();
    animJSON.active = false;
    const ap = animGetCycleParams(), cy = animCalcCycle(ap);
    return { analysis_eta_cl: +turb.eta_cl.toFixed(6), anim_eta_cl: +cy.eta_cl.toFixed(6),
             identical: Math.abs(turb.eta_cl - cy.eta_cl) < 1e-9,
             analysis_h1: +turb.h1.toFixed(3), anim_h1: +cy.h1.toFixed(3) };
  });

  // 9. Table sanity vs published steam-table values
  R.tableSpotChecks = await page.evaluate(() => {
    const p = superheatProps(500, 100);   // 100 bar, 500 C → h≈3375.1, s≈6.5993
    const q = superheatProps(400, 40);    // 40 bar, 400 C  → h≈3214.4, s≈6.7712
    const s300 = satProps(300);
    return {
      sh_100bar_500C: { h: +p.h.toFixed(1), s: +p.s.toFixed(4) },
      sh_40bar_400C: { h: +q.h.toFixed(1), s: +q.s.toFixed(4) },
      Psat_300C_bar: +(s300.P_kPa / 100).toFixed(2),   // published 85.88 bar
      Psat_100C_bar: +(satProps(100).P_kPa / 100).toFixed(4), // published 1.0142 bar
      vf_45C: +satProps(45).vf.toFixed(6)
    };
  });


  // 10. Sensitivity engine [v1.8] — must not leave side effects, and the chain
  //     transmission must match the cascade expectation.
  R.sensitivity = await page.evaluate(() => {
    _pipeParamHash = '';
    const before = JSON.stringify(P);
    const S = calcSensitivity();
    const after = JSON.stringify(P);
    const eff = S.items.filter(i => i.grp === 'eff');
    const base = runPipeline();
    const expect = {
      eta_boil: PIPE.eta_total / P.eta_boil,
      eta_turb: PIPE.eta_total / base.turb.eta_cl,
      eta_gen: PIPE.eta_total / base.gen.eta_gen
    };
    return {
      restoresParamsExactly: before === after,
      allFinite: S.items.every(i => isFinite(i.dP) && isFinite(i.dEta)),
      allOk: S.items.every(i => i.ok),
      baseline_P_elec: +S.base.P_elec.toFixed(2),
      ranked: S.items.slice().sort((a, b) => b.dP - a.dP)
        .map(i => `${i.lbl} ${i.unit}: ${i.dP >= 0 ? '+' : ''}${i.dP.toFixed(2)} kW`),
      transmission: eff.map(e => `${e.lbl}: ${(e.transmission * 100).toFixed(1)}%`),
      transmission_vs_cascade_expectation: {
        eta_boiler: { measured: +(eff.find(e => e.k === 'eta_boil').transmission).toFixed(4),
                      cascade_estimate: +expect.eta_boil.toFixed(4) }
      }
    };
  });

  // 11. Fuel energy basis [v1.8]
  R.energyBasis = await page.evaluate(() => {
    const out = {};
    const save = P.fuel, saveMc = P.mc;
    for (const f of ['wood_chip', 'straw', 'pellet', 'biogas']) {
      P.fuel = f; P.mc = f === 'biogas' ? 1 : 15; _pipeParamHash = '';
      const fe = fuelEnergy(), dp = flueGasDewPoint();
      out[f] = { LHV_wet: +fe.LHV_wet.toFixed(2), HHV_wet: +fe.HHV_wet.toFixed(2),
                 ratio: +fe.ratio.toFixed(4), HHV_above_LHV: fe.HHV_wet > fe.LHV_wet,
                 LHV_ceiling_pct: +(100 * fe.ratio).toFixed(1),
                 dewPoint_C: +dp.T_dew.toFixed(1) };
    }
    P.fuel = save; P.mc = saveMc; _pipeParamHash = '';
    const c = runPipeline().comb, d2 = flueGasDewPoint();
    out._default_case = { T_fluegas_C: +c.T_fg.toFixed(0), dewPoint_C: +d2.T_dew.toFixed(1),
                          condensingPossible: c.T_fg <= d2.T_dew };
    return out;
  });


  // 12. TMF penalty is now load-bearing [v1.9]. Two things must hold:
  //     σ must move real output, and the Carnot bound must survive it.
  R.tmfLoadBearing = await page.evaluate(() => {
    const save = { T: P.sig_T, R: P.sig_rho, V: P.sig_v };
    const at = s => { P.sig_T = s; P.sig_rho = s; P.sig_v = s; _pipeParamHash = '';
                      const r = runPipeline();
                      return { P: r.gen.P_elec, etaCl: r.turb.eta_cl, etaTmf: r.turb.eta_tmf,
                               etaC: r.turb.eta_carnot_mean, iters: r.turb.tmf_iters,
                               conv: r.turb.tmf_converged, x2: r.turb.x2 }; };
    const lo = at(0.01), mid = at(0.15), hi = at(0.30);
    P.sig_T = save.T; P.sig_rho = save.R; P.sig_v = save.V; _pipeParamHash = ''; runPipeline();
    return {
      P_at_sig001: +lo.P.toFixed(3), P_at_sig015: +mid.P.toFixed(3), P_at_sig030: +hi.P.toFixed(3),
      sigma_now_moves_output: Math.abs(lo.P - hi.P) > 1e-6,
      monotonic_decreasing: lo.P > mid.P && mid.P > hi.P,
      spread_kW: +(lo.P - hi.P).toFixed(3),
      spread_pct_of_output: +((lo.P - hi.P) / lo.P * 100).toFixed(3),
      exhaust_gets_drier_with_sigma: hi.x2 > lo.x2,
      fixedPoint: { iters: hi.iters, converged: hi.conv }
    };
  });

  // 13. Full sweep again, this time with the penalty live, checking BOTH bounds
  R.carnotSweepWithTMF = await page.evaluate(() => {
    let n = 0, carnotViol = 0, tmfViol = 0, notConverged = 0, worst = null;
    const save = { T: P.sig_T, R: P.sig_rho, V: P.sig_v };
    for (let Tb = 120; Tb <= 340; Tb += 20)
      for (let Tsh = Tb + 20; Tsh <= 560; Tsh += 30)
        for (let Tc = 20; Tc <= 80; Tc += 15)
          for (const sg of [0.01, 0.15, 0.30, 0.45])
            for (const et of [0.65, 0.85, 0.95]) {
              if (Tc > Tb - 20) continue;
              P.sig_T = sg; P.sig_rho = sg; P.sig_v = sg; P.eta_turb = et; _pipeParamHash = '';
              const r = runPipeline(); n++;
              const t = r.turb;
              if (t.eta_tmf > t.eta_carnot_mean + 1e-9) { carnotViol++;
                if (!worst || t.eta_tmf - t.eta_carnot_mean > worst.d)
                  worst = { Tb, Tsh, Tc, sg, et, d: t.eta_tmf - t.eta_carnot_mean }; }
              if (t.eta_tmf > t.eta_cl + 1e-9) tmfViol++;
              if (!t.tmf_converged) notConverged++;
            }
    P.sig_T = save.T; P.sig_rho = save.R; P.sig_v = save.V; P.eta_turb = 0.82;
    _pipeParamHash = ''; runPipeline();
    return { cases: n, carnotViolations: carnotViol, etaTmfAboveClassical: tmfViol,
             fixedPointNotConverged: notConverged, worst };
  });

  // 14. Entropy generation / exergy balance
  R.entropy = await page.evaluate(() => {
    _pipeParamHash = '';
    const r = runPipeline();
    const eg = calcEntropyGen(r.turb.cy, r.comb, r.boil.m_steam);
    return {
      S_gen_per_cycle: +eg.s_tot.toFixed(4),
      S_dot_kW_per_K: +eg.S_dot.toFixed(4),
      exergy_destroyed_kW: +eg.X_dest.toFixed(1),
      P_elec_kW: +r.gen.P_elec.toFixed(1),
      allTermsNonNegative: eg.parts.every(p => p.s >= 0),
      breakdown: eg.parts.map(p => `${p.lbl}: ${(p.pct * 100).toFixed(1)}% (${p.X_kW.toFixed(1)} kW)`),
      dominant: eg.parts.slice().sort((a, b) => b.s - a.s)[0].lbl
    };
  });

  R.consoleErrors = errors;

  for (const [tab, name] of [[1, 'boiler'], [2, 'turbine'], [3, 'generator'], [5, 'anim'], [7, 'otdd'], [10, 'sensitivity'], [11, 'trajectory']]) {
    await page.evaluate(t => switchTab(t), tab);
    await page.waitForTimeout(280);
    await page.screenshot({ path: `_verify_out/v17_${name}.png` });
  }

  console.log(JSON.stringify(R, null, 2));
  await browser.close();
})();
