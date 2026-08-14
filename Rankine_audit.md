# TMF Rankine Cycle Simulator v3 — kód- és fizikai audit

Ellenőrizve: `Rankine.html` (1577 sor). A termodinamikát újraimplementáltam Node-ban és
összevetettem a `iapws` Python könyvtár IAPWS-IF97 referenciaértékeivel.

---

## A. BLOKKOLÓ / SÚLYOS HIBÁK

### A1. Sérült DOCTYPE — a böngésző quirks módba esik
**Sor 1.** A fájl első bájtjai: `</S> DOCTYPE html>` (hexdumppal ellenőrizve: `3c2f 533e 2044 4f43 5459 5045`).

Ez nem doctype, hanem egy érvénytelen záró tag. A böngésző **quirks módban** rendereli
az oldalt → a flexbox/`height:100vh`/`box-sizing` viselkedés eltérhet, a layout szétcsúszhat.

```diff
- </S> DOCTYPE html>
+ <!DOCTYPE html>
```

---

### A2. `superheatProps()` gyakorlatilag SOHA nem használja a túlhevítési táblát
**Sor 720–727.** Ez a legsúlyosabb fizikai hiba.

```js
const sat = satProps(T_C);            // satProps klampol: sat.T_C === T_C, ha T_C < 373.9
...
if (Math.abs(P_bar - P_sat_bar) < 0.5 || T_C <= sat.T_C + 0.5) {
    return { h: sat.hg, s: sat.sg };  // ← mindig ide fut, ha T_C <= 373.9
}
```

`sat.T_C` nem a nyomáshoz tartozó telítési hőmérséklet, hanem **maga a bemenő `T_C`**
(a `satProps` visszaadja a klampolt inputot). Így a `T_C <= sat.T_C + 0.5` feltétel
**azonosan igaz** minden T ≤ 373,9 °C esetén. A függvény ilyenkor a *telített gőz*
értékeit adja vissza a nyomástól teljesen függetlenül.

**Mérhető következmény — a T-s diagram 1→1' szakasza (sor 1020, `isobarSH`):**

| T (°C) | s (kJ/kgK) | forrás |
|---|---|---|
| 300,0 | 5,7059 | SAT ← hibás |
| 340,0 | 5,3357 | SAT ← hibás |
| 373,3 | 4,4425 | SAT ← hibás |
| **380,0** | **6,2232** | SH ← itt ugrik |
| 500,0 | 6,6884 | SH |

A rajzolt „izobár" tehát Tb-től 374 °C-ig **visszafelé, balra fut a telítési gőzgörbén
a kritikus pontig**, majd egy **Δs = 1,78 kJ/kgK** ugrással (a panelszélesség ~21 %-a)
átvált a valódi izobárra. Ez a T-s panelen egy jól látható „horog + szakadás" műtermék.
Ugyanez érinti a szaggatott izobár referenciavonalat is (sor 1002).

**Emellett:** ha a Superheat csúszkát **370 °C**-ra állítod (a slider minimuma, elérhető
minden Tb ≤ 345 esetén), akkor maga az 1' *állapotpont* is hamis lesz — a kritikus pont
közeli telített gőz értékeit kapja (h ≈ 2198 kJ/kg a valós ~3160 helyett).

**Javítás:** a telítési nyomáshoz tartozó T_sat-ot kell számolni, nem a T_C-t visszaadni:

```js
function tSatFromP(P_bar) {            // inverz Wagner, bisekció
    let lo = 0.01, hi = 373.9;
    for (let k = 0; k < 60; k++) {
        const mid = (lo + hi) / 2;
        (satProps(mid).P_kPa / 100 < P_bar) ? lo = mid : hi = mid;
    }
    return (lo + hi) / 2;
}

function superheatProps(T_C, P_bar) {
    const Tsat = tSatFromP(P_bar);
    if (T_C <= Tsat + 0.5) {           // most már valódi telítettségi teszt
        const s = satProps(Tsat);
        return { h: s.hg, s: s.sg };
    }
    /* ... a meglévő tábla-interpoláció ... */
}
```

---

### A3. Az „inlet" panel 4. cellája teljesen átlátszatlan cián háttér
**Sor 1363–1368.**

```js
fill: `rgba(${idx === 3 ? '0,212,255' : '22,27,38'},1)`
```

Az `idx === 3` (a σ_μ „resultant" panel — a saját feliratotok szerint *„WHERE THE MONEY IS"*)
`rgba(0,212,255,1)` = **tömör világoscián blokk**. A rá rajzolt sötét szövegek
(`#4a6070`, `#2a3a4a`) és a görbék gyakorlatilag olvashatatlanok.

```diff
- fill: `rgba(${idx === 3 ? '0,212,255' : '22,27,38'},1)`,
+ fill: idx === 3 ? 'rgba(0,212,255,0.06)' : 'rgba(22,27,38,1)',
```

---

## B. FIZIKAILAG HELYTELEN / FÉLREVEZETŐ

### B1. A „Carnot limit" rossz referencia — a ciklus túllépheti
**Sor 808:** `eta_carnot = 1 - cond.T_K / boil.T_K`

A `boil.T_K` a kazán **telítési** hőmérséklete (300 °C), miközben a ciklus
csúcshőmérséklete a túlhevítés (500 °C). A kijelzett „Carnot limit" tehát nem
felső korlátja ennek a ciklusnak.

Végigszkenneltem a teljes paramétertartományt (15 975 kombináció):
**1313 esetben (8,2 %) η_Rankine > a kijelzett „Carnot limit"** — pl. Tb=150,
Tsh=370, Tc=20 → η_cl = 34,3 % vs. „Carnot" = 30,7 %. Ez egy TMF-demóban
kifejezetten kínos, mert úgy néz ki, mintha a modell sértené a II. főtételt.

**Két lehetőség:**

1. Egyszerű javítás — a valódi csúcshőmérséklettel:
   ```js
   const eta_carnot = 1 - cond.T_K / (P.Tsh + 273.15);   // defaultnál 59,50 %
   ```
2. **Jobb (ezt ajánlom)** — a hőbevitel entrópikus középhőmérséklete, ami a
   *tényleges* elérhető korlát adott ciklusra:
   ```js
   const T_mean = (h1p - h4) / (s1p - s4);               // K
   const eta_carnot_mean = 1 - cond.T_K / T_mean;
   ```
   Defaultnál: T_mean = 527,6 K (254,4 °C) → **η = 40,65 %**, és η_cl = 34,50 % szépen
   alatta marad. Ez sokkal informatívabb: megmutatja, mennyi veszik el a
   nem-izoterm hőbevitelen (a Rankine valódi gyengéje).

   Érdemes mindkettőt kiírni: `η_Carnot(T_max)` és `η_Carnot(T̄_in)`.

### B2. A SH_TABLE entalpia-oszlopa nagy nyomáson jelentősen téves
82 táblabejegyzést vetettem össze IAPWS-IF97-tel. Az **entrópiák jók**
(tipikusan ±0,002 kJ/kgK), de az **entalpiák ≥ 80 bar felett szisztematikusan
túl magasak**, és a hiba T-vel nő:

| P (bar) | T (°C) | h tábla | h IAPWS | Δh |
|---|---|---|---|---|
| 80 | 600 | 3661,0 | 3642,4 | **+18,6** |
| 100 | 600 | 3660,4 | 3625,8 | **+34,6** |
| 120 | 600 | 3670,5 | 3609,0 | **+61,5** |
| 150 | 600 | 3628,8 | 3583,3 | **+45,5** |
| 200 | 500 | 3293,5 | 3241,2 | **+52,3** |
| 200 | 600 | 3682,2 | 3539,2 | **+143,0 (4,0 %)** |

Árulkodó jel: a táblátok szerint 600 °C-on a h **nő** 100→120 bar között
(3660,4 → 3670,5); valóságban **csökken** (3625,8 → 3609,0).

Ezen felül a „telítési horgony" sorok rossz hőmérsékleten ülnek:
- `40: {250: [2801.4, ...]}` — 40 bar-on T_sat = 250,4 °C, tehát 250 °C
  **komprimált folyadék** (h = 1085,7), nem gőz.
- `80: {295: [2786.5, ...]}` — ugyanez, T_sat = 295,0 °C.
- `100: {325: [2741.7, ...]}` — 100 bar-on T_sat = 311 °C, tehát 325 °C valódi
  túlhevített gőz h = 2810,2-vel; a tábla 68,5-tel alálő.
- `120: {325: ...}`, `150: {345: ...}` — hasonlóan pontatlan (Δs = +0,055, ill. +0,174).

**Gyakorlati hatás a ciklusra** (a valós IAPWS-tel számolt referencia ellen,
elérhető munkapontokon — Tb ≤ 350 °C miatt P_boil ≤ 165 bar):

| Tb / Tsh / Tc | η modell | η IAPWS | Δ |
|---|---|---|---|
| 300 / 500 / 40 (default) | 34,50 % | 34,32 % | +0,17 pp |
| 350 / 600 / 40 | 38,30 % | 37,30 % | **+1,00 pp** |
| 320 / 550 / 60 | 33,87 % | 33,48 % | +0,39 pp |
| 200 / 400 / 40 | 27,15 % | 27,37 % | −0,22 pp |

Tehát ≤ ~1 pp — nem katasztrofális, de mivel a badge azt hirdeti, hogy
**„IAPWS-IF97"**, és mivel a TMF-effektus maga (Δη = 0,28 pp defaultnál) **kisebb,
mint a táblahiba**, ez érdemben aláássa az állítást. A 200 bar-os blokkot
mindenképp javítsd (vagy dobd ki, mert Tb ≤ 350 mellett úgyis csak extrapolációként érhető el).

### B3. A gazdasági modell egységei nem konzisztensek
**Sor 893–896.**

```js
const hours = 8000, fuel_price = 80;
const fuel_curr = P.mw / cy.etmf * hours * fuel_price / 1e6;
```

`P.mw / η` = **hőteljesítmény** (MW_th), amit **villamos árral** ($80/MWh_e) szoroztok.
Defaultnál ez **187,0 M$/év** „tüzelőanyag-költséget" ad egy 100 MW-os blokkra,
miközben ugyanennek a blokknak a teljes árbevétele 80 $/MWh mellett 64,0 M$/év.
**A tüzelőanyag 2,9-szer többe kerül, mint amennyi a bevétel** — így a felirat
(`@ $80/MWh, 8000h/yr`) félrevezető.

Két konzisztens út:

```js
// (a) tüzelőanyag-oldal: hőárat használj
const fuel_price_th = 28;   // $/MWh_th, pl. földgáz
const fuel_curr = P.mw / cy.etmf * hours * fuel_price_th / 1e6;

// (b) TISZTÁBB — többlet-villamosenergia azonos tüzelőanyagra:
const Q_th   = P.mw / cy.etmf;                       // MW_th, rögzített
const extraMW = Q_th * (eta_ideal - cy.etmf);        // MW_e többlet
const save_yr = extraMW * hours * 80 / 1e6;          // M$/év
```

A (b) verzió amúgy is jobban illik a mondanivalótokhoz: *„ugyanannyi tüzelőanyagból
ennyivel több áram"*.

### B4. Δη-t a KAZÁN κ-csúcsával skálázzátok, nem a turbináéval
**Sor 815–829.** A `kap_peak = Math.max(...kaps)`, és defaultnál:

| szakasz | κ |
|---|---|
| 1→1' superheat | 1,300 |
| 1'→2' turbine | 1,142 |
| 2'→3 condenser | 1,018 |
| 3→4 pump | 1,008 |
| **4→1 boiler** | **1,731 ← ez a peak** |

A `kap_boil = 1 + (hfg/2257)·(1+σ_μ)` szinte mindig dominál (a látens hő hajtja).
Így a `delta_eta = σ_μ² · kap_peak · 0,15` a **kazán** görbületével van szorozva,
holott az egész narratíva (annotációk, „σ_μ critical here", az alsó panel) arról szól,
hogy σ_μ a **turbina belépőn** hat.

Ez belső inkonzisztencia. Vagy `kap_turb`-öt használd:

```js
const delta_eta = sig_mu * sig_mu * kap_turb * kappa_sens;
```

vagy — ha tudatosan a globális csúcs kell — írd le explicit módon az annotációban,
mert így a κ_peak metrika (1,731) gyakorlatilag csak a `hfg`-t méri, nem az áramlási minőséget.

### B5. Szivattyú: entrópia-inkonzisztencia és túlbecsült ΔT
**Sor 801–803.**

```js
const h4 = h3 + w_pump, s4 = s3, T4 = T3 + w_pump / 4.18;
```

- `s4 = s3` **izentropikusat** feltételez, miközben `w_pump = w_s / 0,85` — vagyis
  irreverzibilis. A veszteség entrópiát termel: `s4 ≈ s3 + (w_pump − w_s)/T3`.
- `T4 = T3 + w_pump/4.18` a **teljes** szivattyúmunkát hőmérséklet-emelkedésre váltja.
  Valóságban a `v·Δp` rész nyomási energia, csak a veszteség melegít.
  Defaultnál a kód **+2,47 °C**-ot ad; a valóság ~+0,4 °C.

Kicsi hatás (< 0,05 pp), de a T-s diagramon a 3→4 szakasz láthatóan túl hosszú.
Helyesebben:

```js
const w_loss = w_pump - w_pump_s;
const T4 = T3 + w_loss / 4.18;
const s4 = s3 + w_loss / (T3 + 273.15);
```

Illetve a `STEP_LABELS[3]` szövege — `"3→4: Pump (isentropic compression)"` — ellentmond
a beállítható `η_p = 0,85`-nek. Írd át: *„Pump (η_p = 0,85)"*.

---

## C. GRAFIKA / MEGJELENÍTÉS

### C1. `preserveAspectRatio="none"` mind az 5 SVG-n
**Sor 559, 563, 567, 571, 577.** A `viewBox="0 0 400 260"` így **nem-egyenletesen
nyúlik** a panel arányához. Következmény: a körök (állapotpontok, marker-dot-ok)
ellipszissé torzulnak, és **minden felirat vízszintesen szét- vagy összenyomódik**.
Négy panel egymás mellett egy 1920 px-es kijelzőn ≈ 470 px széles → a 400×260-as
viewBox 1,17× vízszintesen és ~0,85× függőlegesen skálázódik.

```diff
- <svg id="svg-ts" viewBox="0 0 400 260" preserveAspectRatio="none"></svg>
+ <svg id="svg-ts" viewBox="0 0 400 260" preserveAspectRatio="xMidYMid meet"></svg>
```

(Ha a `none` szándékos volt a helykitöltés miatt, akkor legalább a szövegeknél és
köröknél kompenzálj — de egyszerűbb a `meet`.)

### C2. Telítési dome torz a kritikus pont közelében
**Sor 986–991.** A dome 100 pontból épül, de a `SAT_TABLE` utolsó intervalluma
**360 → 374 °C**, és lineárisan interpolálsz benne. Ott viszont
h_f 1761,7 → 2084,3 és h_fg 719,8 → 0 — erősen nemlineáris tartomány.
A dome csúcsa ezért **hegyes háromszögként** zárul, nem a valódi lekerekített
kritikus ponttal. Tegyél be köztes sorokat (365, 370, 372, 373,5), vagy
rajzold a dome felső 15 °C-át külön, sűrűbb mintavétellel.

Mellékesen: a táblából **hiányzik a 70 °C-os sor** (0,10,…,60, **80**, 100, …), így
60–80 között durvább a lineáris közelítés.

### C3. Holt kód + rossz szám az „inlet" panel jobb felső sarkában
**Sor 1466–1472.**

```js
const gain = Math.max(0, cy.etmf - eta_ideal_expr);          // ← mindig 0 (etmf <= eta_ideal)
...
gainEl.textContent = `+${Math.abs(totalLoss - gain * 0).toFixed(2)}pp recoverable`;
//                                          ^^^^^^^^ a *0 kinullázza a fenti számítást
```

A `gain * 0` egyértelműen bennfelejtett debug-maradvány. Így a kiírt szám a
**teljes** TMF-veszteség (0,28 pp), nem a *visszanyerhető* rész. A ténylegesen
visszanyerhető (σ_μ = 0,1755 → 0,04) csak **0,26 pp**. Kicsi a különbség defaultnál,
de σ_μ = 0,30-nál már 0,82 vs. 0,80, és fogalmilag rossz — a σ_ideal alatti
maradékveszteség nem visszanyerhető.

```diff
- const gain = Math.max(0, cy.etmf - cy.eta_cl * Math.max(0.55, 1 - 0.04*0.04*cy.kap_peak*0.15)) * 100;
- const totalLoss = (cy.eta_cl - cy.etmf) * 100;
- gainEl.textContent = `+${Math.abs(totalLoss - gain * 0).toFixed(2)}pp recoverable`;
+ const etaIdeal    = cy.eta_cl * Math.max(0.55, 1 - 0.04*0.04*cy.kap_peak*0.15);
+ const recoverable = Math.max(0, etaIdeal - cy.etmf) * 100;
+ gainEl.textContent = `+${recoverable.toFixed(2)}pp recoverable`;
```

### C4. Kisebb grafikai megjegyzések
- **Sor 1165 + 1193–1198:** a `grid(svg, 5, 4)` már húz 5 függőleges vonalat, majd a
  szakaszhatárok újabb 5-öt ugyanoda → dupla vonalak a κ panelen.
- **Sor 1095:** a μ(W) panelnek van x-tengely felirata (`T (°C) →`), de **nincsenek
  osztásértékei** — az eloszlás szélessége így nem olvasható le.
- **Sor 391–396:** `.panel svg { flex: 1; height: 100% }` a `.panel-title` alatt egy
  flex-column-ban → az SVG a cím magasságával túlcsordul (`overflow:hidden` levágja).
  Használj `height: auto`-t a `flex: 1` mellett.
- **Sor 1013:** `scols[0]` és `scols[4]` ugyanaz a narancs (`#ff6b35`) → a superheat és
  a boiler szakasz nem különböztethető meg a T-s panelen.
- **Sor 1027:** a turbina-szakasz `+ 0.10 * (1 - P.et) * Math.sin(...)` tagja tisztán
  kozmetikai „hasasítás" — érdemes kommentben jelölni, hogy nem fizikai útvonal.

---

## D. UI / LOGIKAI APRÓSÁGOK

- **Sor 862:** `P.Tsh = P.Tb + 30` — a slider `min=370, step=10`, tehát csak
  370/380/390… érvényes. Ha Tb = 345, akkor 375-öt írsz be, amit a böngésző
  380-ra kerekít → a **JS-változó (375) és a slider (380) szétcsúszik**, a kijelzett
  érték hazudik. Kerekíts: `P.Tsh = Math.ceil((P.Tb + 30 - 370) / 10) * 10 + 370;`
- **Sor 861:** `if (P.Tc >= P.Tb - 20)` — Tc max 90, Tb min 150, tehát ez az ág
  **soha nem fut le**. Ártalmatlan, de holt kód.
- **Sor 874 + 912:** az `up()` meghívja a `rankine()`-t, majd a `render()` további
  ötször (panelenként) → **6 teljes ciklusszámítás képkockánként**. Számold ki egyszer
  és add át paraméterként; animáció közben ez 60 fps-en 360 kiértékelés/mp.
- **Sor 1542–1547:** a `loop()` nem használ `timestamp`-et, `tick += SKIP` fix
  lépésköz → az animáció sebessége a monitor frissítési frekvenciájától függ
  (144 Hz-en 2,4× gyorsabb). Használj delta-time-ot.
- **Sor 794–795:** ha `x2p` felül klampol 1-re (száraz kilépés), akkor
  `s2p = cond.sf + 1 * cond.sfg = cond.sg`, ami már **nem konzisztens** a `h2p`-vel,
  és a 2' pont T-je is `cond.T_C` marad, holott túlhevített lenne. Jelezd figyelmeztetéssel.
- **Sor 807:** `eta_cl = Math.max(0, w_net / q_in)` — elrejti a negatív nettó munkát
  0-ként ahelyett, hogy jelezné az érvénytelen munkapontot.
- **Sor 413–414:** a badge `IAPWS-IF97`-et ígér, de a kód **lineárisan interpolált
  diszkrét táblákat** használ (nem IF97 alapegyenleteket), és a telítési nyomás
  a Wagner–Pruß **IAPWS-95** egyenlet. Pontosabb felirat: `steam tables (IF97-based)`.
- **Sor 1505:** az annotáció félmondat után magyarra vált
  (`"...μ(W) NARROWS — gőz homogenizálódik a fázishatártól..."`), a többi négy
  végig angol. Egységesítsd.

---

## E. AMI JÓL VAN — nincs teendő

- A telítési nyomás **Wagner–Pruß** egyenlete (sor 648–652) és a 22 064 kPa-os
  kritikus nyomás pontos; a `P_boil/P_cond` kijelzés helyes.
- A `w_pump = v_f · Δp` dimenzionálisan korrekt (m³/kg × kPa = kJ/kg).
- Az `η_t` izentropikus definíciója (`w = (h1' − h2s) · η_t`) helyes.
- A **gőznedvesség 0,88-as küszöbe** (sor 883) egyezik az ipari turbinaeróziós
  gyakorlattal — jó, hogy benne van.
- Az `x2p` visszaszámítása entalpiából a valós (nem izentropikus) kilépő állapotra
  helyes, és `η_t = 1` esetén szépen visszaadja `s2' = s1'`-t (ellenőrizve).
- A **σ_μ komponens-dekompozíció összegzése konzisztens**: az alsó panel három
  `−x,xx pp` értéke pontosan kiadja a teljes Δη-t, mert
  σ_T² + σ_ρ² + σ_v² = σ_μ². Ez szép.
- A `[PROVEN] / [NUMERICAL] / [CONJECTURE]` jelölésrendszer **kiváló** és
  következetesen alkalmazott — pontosan ez az intellektuális becsületesség hiányzik
  a legtöbb hasonló demóból. Tartsd meg.

---

## Prioritási sorrend

| # | Hiba | Hatás | Munka |
|---|---|---|---|
| 1 | A1 — DOCTYPE | teljes layout | 1 sor |
| 2 | A2 — `superheatProps` telítettségi teszt | látható T-s szakadás + hamis 1' pont 370 °C-on | ~15 sor |
| 3 | A3 — tömör cián panel | a fő panel olvashatatlan | 1 sor |
| 4 | B1 — Carnot referencia | látszólagos II. főtétel-sértés az esetek 8 %-ában | 2 sor |
| 5 | B3 — gazdasági egységek | a $-számok 2,9× irreálisak | ~5 sor |
| 6 | C3 — `gain * 0` | rossz „recoverable" érték | 3 sor |
| 7 | C1 — `preserveAspectRatio` | torz szöveg/körök | 5 attribútum |
| 8 | B2 — SH_TABLE ≥100 bar | ≤1 pp η-hiba, aláássa az „IAPWS" badge-et | táblajavítás |
| 9 | B4 — κ_peak vs. κ_turb | fogalmi inkonzisztencia | 1 sor + döntés |
| 10 | B5, C2, C4, D | finomítások | — |

---

### Módszertan
- A `satProps`, `superheatProps`, `isobarSH` és a teljes `rankine()` függvényt
  változatlan formában újrafuttattam Node 20-ban.
- Referencia: `iapws` 1.5.x (`IAPWS97`), Python 3.
- Carnot-szkennelés: Tb ∈ [150, 350] lépés 5, Tsh ∈ [370, 620] lépés 10,
  Tc ∈ [20, 90] lépés 5, a `Tsh > Tb + 20` szűrő alkalmazásával → 15 975 érvényes pont.
- A DOCTYPE-ot `xxd` hexdumppal ellenőriztem, nem a szövegmegjelenítésre hagyatkozva.
- Böngészős renderelést **nem** futtattam (nem volt elérhető headless Chrome a
  sandboxban), így a C1/C2 pontok kódelemzésen alapulnak, nem képernyőképen.
