const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });
  const page = await browser.newPage({ viewport: { width: 1600, height: 950 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  await page.goto('file:///home/claude/tmf/fullchain/TMF_FullChain_Simulator_v22.html');
  await page.waitForTimeout(800);

  const R = {};

  R.nominal = await page.evaluate(() => {
    _pipeParamHash = '';
    const { comb, boil, turb, gen, imp } = runPipeline();
    return {
      fuel: P.fuel, m_fuel: P.m_fuel, mc: P.mc, lambda: P.lambda,
      Q_in_kW: +comb.Q_in.toFixed(1),
      T_flame_C: +comb.T_flame.toFixed(0),
      T_fg_C: +comb.T_fg.toFixed(1),
      eta_comb: +comb.eta_c.toFixed(4),
      Q_boiler_kW: +boil.Q_avail.toFixed(1),
      m_steam_kgs: +boil.m_steam.toFixed(4),
      T_boil_C: P.T_boil, T_sh_C: P.T_sh, T_cond_C: P.T_cond,
      P_boil_bar: +turb.P_bar.toFixed(2), P_cond_bar: +turb.P_cond_bar.toFixed(4),
      h1: +turb.h1.toFixed(1), h2: +turb.h2.toFixed(1),
      h3: +turb.h3.toFixed(1), h4: +turb.h4.toFixed(1),
      s1: +turb.s1.toFixed(4), s2: +turb.s2.toFixed(4),
      x2: +turb.x2.toFixed(4), dryExhaust: turb.dryExhaust,
      w_pump: +turb.w_pump.toFixed(2),
      T_mean_C: +(turb.T_mean - 273.15).toFixed(1),
      eta_cl: +turb.eta_cl.toFixed(4),
      eta_tmf: +turb.eta_tmf.toFixed(4),
      eta_carnot_mean: +turb.eta_carnot_mean.toFixed(4),
      eta_carnot_max: +turb.eta_carnot_max.toFixed(4),
      eta_ca_mean: +(turb.eta_ca_mean !== undefined ? turb.eta_ca_mean : NaN).toFixed(4),
      eta_ca_sh: +(turb.eta_ca_sh !== undefined ? turb.eta_ca_sh : NaN).toFixed(4),
      W_mech_kW: +turb.W_mech.toFixed(1),
      P_elec_kW: +gen.P_elec.toFixed(1),
      eta_gen: +gen.eta_gen.toFixed(4),
      eta_total: +PIPE.eta_total.toFixed(4),
      EROI: +PIPE.EROI.toFixed(2),
      sig_mu: +turb.sig_mu.toFixed(4)
    };
  });

  R.tmfFixedPoint = await page.evaluate(() => {
    const out = [];
    for (const sm of [0, 0.05, 0.10, 0.15, 0.20, 0.30, 0.40]) {
      const r = solveTMFCycle(P.T_boil, P.T_sh, P.T_cond, P.eta_turb, P.eta_pump, sm);
      out.push({
        sig_mu: sm,
        delta_pct: +(r.delta * 100).toFixed(3),
        eta_ref_pct: +(r.ref.eta_cl * 100).toFixed(3),
        eta_tmf_pct: +(r.cy.eta_cl * 100).toFixed(3),
        dW_pct: +(((r.cy.eta_cl / r.ref.eta_cl) - 1) * 100).toFixed(3),
        iters: r.iters, converged: r.converged
      });
    }
    return out;
  });

  R.impedance = await page.evaluate(() => {
    _pipeParamHash = '';
    const { imp } = runPipeline();
    const k = {};
    for (const key of Object.keys(imp)) {
      const v = imp[key];
      if (typeof v === 'number') k[key] = +v.toPrecision(6);
      else if (typeof v === 'boolean') k[key] = v;
    }
    return k;
  });

  R.exergy = await page.evaluate(() => {
    _pipeParamHash = '';
    const { comb, boil, turb, gen } = runPipeline();
    const c = calcExergyCascade(comb, boil, turb, gen);
    return JSON.parse(JSON.stringify(c, (k, v) => typeof v === 'number' ? +v.toPrecision(6) : v));
  });

  R.entropyGen = await page.evaluate(() => {
    _pipeParamHash = '';
    const { comb, boil, turb } = runPipeline();
    const e = calcEntropyGen(turb, comb, boil.m_steam);
    return JSON.parse(JSON.stringify(e, (k, v) => typeof v === 'number' ? +v.toPrecision(6) : v));
  });

  R.sensitivity = await page.evaluate(() => {
    const s = calcSensitivity();
    return JSON.parse(JSON.stringify(s, (k, v) => typeof v === 'number' ? +v.toPrecision(6) : v));
  });

  R.flue = await page.evaluate(() => {
    _pipeParamHash = '';
    const { comb } = runPipeline();
    const f = calcFluePotentials(comb);
    const d = flueGasDewPoint();
    const fe = fuelEnergy();
    return JSON.parse(JSON.stringify({ f, dew: d, fuelEnergy: fe },
      (k, v) => typeof v === 'number' ? +v.toPrecision(6) : v));
  });

  R.carnotSweepWithTMF = await page.evaluate(() => {
    let n = 0, viol = 0, worst = null;
    for (let Tb = 100; Tb <= 340; Tb += 20)
      for (let Tsh = Tb + 20; Tsh <= 560; Tsh += 40)
        for (let Tc = 20; Tc <= 90; Tc += 10)
          for (const et of [0.60, 0.75, 0.85, 0.95])
            for (const sm of [0, 0.15, 0.35]) {
              if (Tc > Tb - 20) continue;
              const r = solveTMFCycle(Tb, Tsh, Tc, et, 0.75, sm);
              n++;
              const slack = r.cy.eta_carnot_mean - r.cy.eta_cl;
              if (slack < -1e-9) { viol++; if (!worst || slack < worst.slack) worst = { Tb, Tsh, Tc, et, sm, slack }; }
            }
    return { cases: n, violations: viol, worst };
  });

  R.errors = errors;
  console.log(JSON.stringify(R, null, 2));
  await browser.close();
})();
