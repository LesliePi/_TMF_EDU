// ════════════════════════════════════════════════════════════════════════════
//  TMF Full Chain — UI / TYPOGRAPHY QA HARNESS
//
//  Companion to FullChain_verify_v22.js. That one checks the PHYSICS
//  (Carnot bounds, cycle closure, property tables). This one checks whether the
//  result is actually LEGIBLE — which turned out to matter just as much, and to
//  hide two real defects for eight versions.
//
//  Usage:
//      node FullChain_qa.js                 # all checks, current file
//      node FullChain_qa.js measure         # rendered text sizes per panel
//      node FullChain_qa.js stats           # size distribution + floor stats
//      node FullChain_qa.js collide         # overlapping label pairs
//      node FullChain_qa.js overflow        # labels escaping their viewBox
//      node FullChain_qa.js distort         # preserveAspectRatio glyph squash
//      node FullChain_qa.js shots           # screenshots of every tab
//      node FullChain_qa.js collide other.html    # run against another file
//
//  ALWAYS establish a BASELINE before a typography change:
//      cp TMF_FullChain_Simulator_v22.html _baseline.html
//      node FullChain_qa.js collide _baseline.html
//  A change is acceptable when the counts do not rise, not when they are zero —
//  several of these defects are pre-existing and are tracked in the audit.
// ════════════════════════════════════════════════════════════════════════════
const { chromium } = require('playwright');
const path = require('path');

const MODE   = process.argv[2] || 'all';
const TARGET = process.argv[3] || 'TMF_FullChain_Simulator_v22.html';
const URL    = 'file://' + path.resolve(__dirname, TARGET);
const N_TABS = 13;
const VIEWPORTS = [{width:1600,height:950,n:'1600x950'},{width:1280,height:800,n:'1280x800'}];

const EXEC = '/opt/pw-browsers/chromium';   // preinstalled; do NOT run playwright install

async function eachTab(page, fn){
  const out=[];
  for(let t=0;t<N_TABS;t++){
    await page.evaluate(i=>switchTab(i), t);
    await page.waitForTimeout(120);
    out.push(await fn(t));
  }
  await page.evaluate(()=>switchTab(0));
  return out;
}

// ── rendered text size per SVG ──────────────────────────────────────────────
async function measure(browser){
  for(const vp of VIEWPORTS){
    const p=await browser.newPage({viewport:{width:vp.width,height:vp.height}});
    await p.goto(URL); await p.waitForTimeout(700);
    const r=await p.evaluate(async n=>{
      const out=[];
      for(let t=0;t<n;t++){
        switchTab(t); await new Promise(r=>setTimeout(r,110));
        document.querySelectorAll('#panel'+t+' svg').forEach(sv=>{
          const vb=sv.viewBox.baseVal, bb=sv.getBoundingClientRect();
          if(!vb||!vb.height||!bb.height) return;
          const sy=bb.height/vb.height;
          const sz=[...sv.querySelectorAll('text')].map(e=>parseFloat(e.getAttribute('font-size'))||9);
          if(sz.length<3) return;
          out.push({tab:t,id:sv.id,minR:+(Math.min(...sz)*sy).toFixed(1),sy:+sy.toFixed(3)});
        });
      }
      switchTab(0); return out;
    }, N_TABS);
    const mins=r.map(x=>x.minR).sort((a,b)=>a-b);
    console.log(`\n### ${vp.n}  (${r.length} text-bearing SVGs)`);
    console.log(`  smallest rendered px: min ${mins[0]} | median ${mins[Math.floor(mins.length/2)]} | max ${mins[mins.length-1]}`);
    r.sort((a,b)=>a.minR-b.minR).slice(0,5).forEach(x=>
      console.log(`   tab${String(x.tab).padEnd(2)} ${x.id.padEnd(22)} ${x.minR}px  (sy=${x.sy})`));
    await p.close();
  }
}

// ── size distribution + how many labels the floor could actually lift ───────
async function stats(browser){
  for(const vp of VIEWPORTS){
    const p=await browser.newPage({viewport:{width:vp.width,height:vp.height}});
    await p.goto(URL); await p.waitForTimeout(700);
    const r=await p.evaluate(async n=>{
      if(typeof TYPO_STATS!=='undefined'){TYPO_STATS.raised=0;TYPO_STATS.capped=0;TYPO_STATS.total=0;}
      const sizes=[];
      for(let t=0;t<n;t++){switchTab(t);await new Promise(r=>setTimeout(r,110));}
      for(let t=0;t<n;t++){
        switchTab(t);await new Promise(r=>setTimeout(r,110));
        document.querySelectorAll('#panel'+t+' svg').forEach(sv=>{
          const vb=sv.viewBox.baseVal,bb=sv.getBoundingClientRect();
          if(!vb||!vb.height||!bb.height)return;
          const sy=bb.height/vb.height;
          sv.querySelectorAll('text').forEach(e=>sizes.push(parseFloat(e.getAttribute('font-size'))*sy));
        });
      }
      switchTab(0); sizes.sort((a,b)=>a-b);
      const q=f=>sizes[Math.floor(sizes.length*f)];
      return {st:typeof TYPO_STATS!=='undefined'?{...TYPO_STATS}:null, n:sizes.length,
        min:+sizes[0].toFixed(1), p05:+q(0.05).toFixed(1), median:+q(0.5).toFixed(1),
        max:+sizes[sizes.length-1].toFixed(1), under10:sizes.filter(v=>v<10).length};
    }, N_TABS);
    console.log(`\n### ${vp.n}`);
    if(r.st) console.log(`  labels ${r.n} | raised to floor ${r.st.raised} | capped by width ${r.st.capped}`);
    console.log(`  rendered px  min ${r.min} | p05 ${r.p05} | median ${r.median} | max ${r.max}`);
    console.log(`  still under 10px: ${r.under10} (${(100*r.under10/r.n).toFixed(1)}%)`);
    await p.close();
  }
}

// ── overlapping label pairs (the one that catches duplicate headers) ────────
async function collide(browser){
  const p=await browser.newPage({viewport:{width:1280,height:800}});
  await p.goto(URL); await p.waitForTimeout(800);
  const res=await p.evaluate(async n=>{
    const hits=[];
    for(let t=0;t<n;t++){
      switchTab(t); await new Promise(r=>setTimeout(r,150));
      document.querySelectorAll('#panel'+t+' svg').forEach(sv=>{
        const els=[...sv.querySelectorAll('text')].map(e=>{
          let bb=null; try{bb=e.getBBox();}catch(_){}
          return bb&&isFinite(bb.x)&&bb.width>0?{bb,s:(e.textContent||'').slice(0,26)}:null;
        }).filter(Boolean);
        for(let i=0;i<els.length;i++)for(let j=i+1;j<els.length;j++){
          const A=els[i].bb,B=els[j].bb;
          const ox=Math.min(A.x+A.width,B.x+B.width)-Math.max(A.x,B.x);
          const oy=Math.min(A.y+A.height,B.y+B.height)-Math.max(A.y,B.y);
          if(ox>3&&oy>3){
            const frac=(ox*oy)/Math.min(A.width*A.height,B.width*B.height);
            if(frac>0.25) hits.push({tab:t,id:sv.id,a:els[i].s,b:els[j].s,frac:+frac.toFixed(2)});
          }
        }
      });
    }
    switchTab(0); return hits;
  }, N_TABS);
  console.log(`${TARGET} -> overlapping label pairs: ${res.length}   (v2.2.1 reference: 10)`);
  res.sort((a,b)=>b.frac-a.frac).slice(0,14).forEach(h=>
    console.log(`  tab${String(h.tab).padEnd(2)} ${h.id.padEnd(20)} ${h.frac}  "${h.a}" X "${h.b}"`));
  await p.close();
}

// ── labels escaping the viewBox ────────────────────────────────────────────
async function overflow(browser){
  const p=await browser.newPage({viewport:{width:1280,height:800}});
  const errs=[]; p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL); await p.waitForTimeout(800);
  const bad=await p.evaluate(async n=>{
    const out=[];
    for(let t=0;t<n;t++){
      switchTab(t); await new Promise(r=>setTimeout(r,140));
      document.querySelectorAll('#panel'+t+' svg').forEach(sv=>{
        const vb=sv.viewBox.baseVal; if(!vb||!vb.width) return;
        let c=0,worst=0;
        sv.querySelectorAll('text').forEach(e=>{
          let bb; try{bb=e.getBBox();}catch(_){return;}
          const o=Math.max(bb.x+bb.width-vb.width,-bb.x,bb.y+bb.height-vb.height,-bb.y);
          if(o>2){c++;worst=Math.max(worst,o);}
        });
        if(c) out.push({tab:t,id:sv.id,count:c,worst:+worst.toFixed(1)});
      });
    }
    switchTab(0); return out;
  }, N_TABS);
  console.log(`OVERFLOWING PANELS: ${bad.length}   (v2.2.1 reference: 8, all pre-existing)`);
  bad.sort((a,b)=>b.worst-a.worst).forEach(x=>
    console.log(`  tab${String(x.tab).padEnd(2)} ${x.id.padEnd(22)} ${String(x.count).padStart(3)} out, worst ${x.worst} units`));
  console.log('pageerrors: '+(errs.length?errs.join(' | '):'none'));
  await p.close();
}

// ── preserveAspectRatio="none" glyph squash ────────────────────────────────
async function distort(browser){
  const p=await browser.newPage({viewport:{width:1600,height:950}});
  await p.goto(URL); await p.waitForTimeout(700);
  const r=await p.evaluate(async n=>{
    const out=[];
    for(let t=0;t<n;t++){
      switchTab(t); await new Promise(r=>setTimeout(r,90));
      document.querySelectorAll('#panel'+t+' svg').forEach(sv=>{
        const vb=sv.viewBox.baseVal, bb=sv.getBoundingClientRect();
        if(!vb||!vb.width||!bb.width||!sv.querySelector('text')) return;
        out.push({tab:t,id:sv.id,vb:[vb.width,vb.height],
          distort:+((bb.width/vb.width)/(bb.height/vb.height)).toFixed(3),
          suggestVbH:Math.round(vb.width*bb.height/bb.width)});
      });
    }
    switchTab(0); return out;
  }, N_TABS);
  const bad=r.filter(x=>Math.abs(x.distort-1)>0.06);
  console.log(`text-bearing SVGs: ${r.length} | distorted >6%: ${bad.length}   (v2.2.1 reference: 8, DEFERRED)`);
  bad.sort((a,b)=>Math.abs(b.distort-1)-Math.abs(a.distort-1)).forEach(x=>
    console.log(`  tab${String(x.tab).padEnd(2)} ${x.id.padEnd(22)} viewBox ${x.vb[0]}x${x.vb[1]}  distort ${x.distort}  -> viewBox height would need ${x.suggestVbH}`));
  await p.close();
}

// ── screenshots ────────────────────────────────────────────────────────────
async function shots(browser){
  const p=await browser.newPage({viewport:{width:1280,height:800}});
  await p.goto(URL); await p.waitForTimeout(800);
  for(let t=0;t<N_TABS;t++){
    await p.evaluate(i=>switchTab(i), t);
    await p.waitForTimeout(300);
    await p.screenshot({path:path.resolve(__dirname,`_qa_tab${t}.png`)});
  }
  console.log(`wrote _qa_tab0..${N_TABS-1}.png`);
  await p.close();
}

(async () => {
  const browser = await chromium.launch({ executablePath: EXEC });
  const run = {measure,stats,collide,overflow,distort,shots};
  try{
    if(MODE==='all'){ for(const k of ['stats','collide','overflow','distort']){ console.log('\n===== '+k.toUpperCase()+' ====='); await run[k](browser); } }
    else if(run[MODE]) await run[MODE](browser);
    else console.log('unknown mode: '+MODE+'\nuse: measure | stats | collide | overflow | distort | shots | all');
  } finally { await browser.close(); }
})();
