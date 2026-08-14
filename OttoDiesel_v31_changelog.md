# TMF Otto & Diesel Simulator v3.1 — változásnapló

`TMF_OttoDiesel_Simulator_012.html` (1235 sor) → **`TMF_OttoDiesel_Simulator_v31.html`** (1370 sor).

Célzott, `assert`-elt szövegcserékkel, `[FIX v3.1]` kommentekkel. A `[PROVEN] /
[NUMERICAL] / [CONJECTURE]` jelölésrendszert (ami a Rankine-ban megvolt, itt nem)
bevezettem, hogy látszódjon, mi tábla-fizika és mi heurisztika.

---

## 1. Nedves levegő — a hiba forrása

A v3 képlete `g = 1.4 − 0.07·(x_v/0.04)`, `Cv = 0.718 + 0.10·(x_v/0.04)` volt.
Lecserélve a **valódi moláris keverékszabályra**:

```js
const cpM = (1-xv)*29.10 + xv*33.60;   // J/mol·K
const cvM = (1-xv)*20.79 + xv*25.29;
const M   = (1-xv)*28.97 + xv*18.015;  // g/mol
return { g: cpM/cvM, Cv: cvM/M, cp: cpM/M, xv };
```

Ellenőrzés (a modell most **egzaktul** reprodukálja a referenciát, és száraz levegőn
a tankönyvi értékeket):

| | v3 | **v3.1** | irodalom |
|---|---|---|---|
| γ (száraz) | 1,400 | **1,400** | 1,400 |
| C_v (száraz) | 0,718 | **0,718** | 0,718 |
| R = c_p − c_v | — | **0,287** | 0,287 |
| γ @ 50 % RH, 308 K | 1,3512 | **1,3973** | 1,3973 |
| C_v @ 50 % RH | 0,788 | **0,730** | 0,730 |

**A hatásfokra** (Otto, r = 10, 308 K):

| RH % | v3 | **v3.1** |
|---|---|---|
| 0 | 60,19 % | 60,16 % |
| **50** | 55,46 % | **59,94 %** |
| 100 | 52,27 % | 59,81 % |

Az `x_v` **0,045-ös plafonja** is megszűnt: 353 K / 100 % RH-n a valós mólarány
**0,4724**, amit a v3 0,045-re vágott (10,5×).

---

## 2. A thermal management valódi története

A v3 „Dry air Δγ" sora **+1,53 %** nyereséget hirdetett. A γ valódi hatása
**+0,04 pp**. Amit a szám valójában helyettesített, az a **kopogási tartalék** —
és ez most a saját során, becsületesen kiszámolva szerepel.

308 K → 293 K hűtés, 50 % RH:

| mechanizmus | érték | státusz |
|---|---|---|
| töltetsűrűség Δρ | **+3,53 %** | `[PROVEN]` — több levegő, több üzemanyag, több teljesítmény |
| γ eltolódás fix r-en | **+0,00 %** | `[PROVEN]` — őszintén: elhanyagolható |
| **kopogási tartalék** | **Δr +0,86 → +2,38 %** | `[NUMERICAL]` — hidegebb töltet, magasabb megengedett r |
| HX parazita | −0,43 % | `[NUMERICAL]` |
| **NET** | **+5,53 %** | +5,5 kW egy 100 kW-os motoron |

A kopogási korlát `r_knock = (T_öngyulladás/T₁)^(1/(γ−1))`, `T_öngyulladás = 750 K`
(~95 RON benzin). Ez teszi a demót erősebbé: **az alapbeállítás (r = 10, 308 K)
kopog** (r_knock = 9,4), és a TM bekapcsolása megszünteti (r_knock 293 K-en 10,6).
A P–V panel `⚠ KNOCK` figyelmeztetést és egy szaggatott korlátvonalat rajzol.

### Előjelhiba javítva
A v3 a `rho_b`-t fixen `air(50, 308)`-ból vette. Most a bázis **ugyanaz a motor,
TM kikapcsolva**:

| T₁ | T₁ HX után | v3 mutatta | **v3.1** |
|---|---|---|---|
| 253 K | 281 K (a HX **fűt**) | +10,8 % | **−9,96 % Δρ, NET −13,98 %** |
| 308 K | 298 K | +3,5 % | +3,53 % |

---

## 3. A Diesel ág

`r_c` **nem szabad paraméter** — a befecskendezett hő rögzíti:
`Q_in = c_p(T₃ − T₂)` ⟹ `r_c = 1 + Q_in/(c_p·T₂)`.

A v3-ban a `Q_in` csúszka Diesel módban **semmit nem csinált** (500 és 3500 azonos
T₃-at, η-t és munkát adott). Most:

| Q_in | r_c | T₃ | η | W |
|---|---|---|---|---|
| 500 | 1,50 | 1462 K | 65,37 % | 365,7 |
| 1800 | 2,82 | 2737 K | 59,39 % | 1196,4 |
| 3500 | 4,53 | 4404 K ⚠ | 53,33 % | 2089,5 |

Az `r_c` csúszkát kivettem (értelmetlen volt), a helyére egy **számított kijelző**
került a Metrics blokkban. Így az Otto↔Diesel váltás **azonos hőbevitel mellett**
hasonlít — ez a tankönyvi összevetés, és pont azt mutatja, amit az annotációd állít.

**Új figyelmeztetés:** a levegő-szabvány ciklus bármekkora Q_in-t elfogad, de
szénhidrogén–levegő láng nem megy ~2600 K adiabatikus fölé. T₃ > 2900 K esetén a
panel kiírja, hogy az állapotpont már aritmetika, nem fizika.

---

## 4. Az „Optimum r★" — nincs belső optimum, és ez a helyes válasz

A v3 `optR()`-je a `pvArea × ecl` maximumát kereste. Otto-nál `pvArea = m·Q_in·η`,
tehát a célfüggvény `m·Q_in·η²` — **szigorúan növekvő r-ben**, ezért mindig 22-t
adott, mindkét módban, és Otto-ban 22 a csúszkán kívül esett.

Kipróbáltam egy Chen–Flynn-típusú súrlódási modellt is (`fmep = 50 + 0,006·P_max`),
hátha az hoz belső optimumot — **nem hoz**: a P_max-tag r = 20-nál is csak ~40 kPa,
miközben az imep ~1350 kPa. A levegő-szabvány ciklus hatásfoka **monoton nő r-rel**;
a valódi korlát Otto-n a kopogás, Dieselen a csúcsnyomás / hidegindítás / NO_x.

Ezért az `optR()` **törölve**, a metrika helyére a tényleges kötő korlát került:
Otto-nál `r_knock`, Dieselnél `P_max` (P₁ = 1 bar mellett nem kötő, 57 bar r = 18-on
a ~180 bar-os mechanikai határhoz képest).

---

## 5. Metrikák, amik hazudtak

| | v3 | v3.1 |
|---|---|---|
| **Δη a diagramon** | `\|0` bitenkénti csonkítás: 0,9 % → „−0 %" | `.toFixed(2)` — és most egyezik az oldalsávval |
| **T₁ sensitivity** | −0,3180 %/K (tisztán a 20×-os γ-hiba) | **két külön sor:** „fix r" = −0,0137 %/K (helyes: a levegő-szabvány η egzaktul T₁-független, csak a nedvesség csatol), és **„knock-lim" = −0,133 %/K** — ez a fizikailag érdekes szám |
| **μ-panel σ_μ** | 0,39–0,88, miközben a csúszka 0,18 | `σ_T ≈ 52 K (σ_μ=0.18)` — külön név a külön mennyiségnek |
| **hum_pen** | γ-hatás mellett duplán könyvelt | megmaradt, de explicit `[NUMERICAL]` kommenttel: **nem** a γ-hatás, hanem a lassabb lángterjedés/alacsonyabb lánghőmérséklet |

---

## 6. Kód, teljesítmény, megjelenítés

- **`cycle()` képkockánként 1×** a korábbi 4 helyett (plusz az `optR()` 74 hívása
  eltűnt). Mérve: `cycle()` 3,1 µs.
- **Dinamikus viewBox** (`syncVB`): a panelek 2×2 rácsban ~818×504 px-esek, a viewBox
  400×300 volt `preserveAspectRatio="none"`-nal → ~22 % vízszintes nyújtás. Most az
  arány a valódi elemméretből jön, `xMidYMid meet`-tel.
- **Delta-time animáció** (`STEP_MS = 1600`) a `rafSkip`/`SKIP` helyett.
- **`skPrev = skMapFull[...] * 0`** — a bennfelejtett maradvány törölve (a változót
  amúgy sem használta senki).
- **`drawDist`**: `mx === 0` védelem.
- **Egy igazságforrás az r tartományra** (`R_LIMITS`): a v3-ban három különböző volt
  (csúszka 4–14, súgó „8–12", `optR` 4–22 pásztázás).
- **`P_AMB_KPA`** nevesített konstans a korábbi implicit `/100` helyett.
- Javítottam egy hibát, amit **én vittem be** a refaktor során: a
  `window.addEventListener('resize', render)` az Event objektumot adta volna át
  ciklusként → `() => render()`.

---

## Verifikáció

| teszt | eredmény |
|---|---|
| JS szintaxis (`node --check`) | OK |
| HTML tag-egyensúly | OK (70/70 div, 4/4 svg) |
| Minden `getElementById` cél létezik a HTML-ben | OK |
| Nedves levegő vs. moláris keverékszabály | egzakt egyezés; száraz levegőn γ 1,400 / C_v 0,718 / R 0,287 |
| Zárt alakú η vs. állapotpont-energiamérleg, 18 munkapont | max eltérés **2,2·10⁻¹⁴ pp** |
| Carnot-korlát, 1080 pont (mindkét mód) | **0 sértés** |
| `pvArea` vs. analitikus ∫P dV | Otto +0,062 %, Diesel −0,063 % |
| **21 600 teljes render** DOM-stubbal (mód × r × T₁ × RH × Q_in × σ × TM × 4 lépés) | **0 hiba, 0 NaN attribútum** |

**Amit nem tudtam ellenőrizni:** böngészős renderelést nem futtattam (nincs headless
Chrome a sandboxban), így a viewBox-átállás és a kopogásjelző elhelyezése
kódelemzésen alapul. Nyisd meg egyszer.

---

## Amire érdemes figyelned

**Az alapbeállítás mostantól kopog.** r = 10, 308 K, 95 RON → r_knock = 9,4.
Ez fizikailag helyes (ezért húz vissza gyújtást minden autó forró napon), és jó
demó: a TM bekapcsolása megszünteti. Ha zavar, állítsd a csúszka alapértékét 9,0-ra
— de szerintem így erősebb.

**A γ-sor most +0,00 %-ot mutat.** Ez nem hiba, hanem az üzenet: a beszívott levegő
hűtése nem a fajhőviszonyon keresztül hat. A demó ereje áthelyeződött a
töltetsűrűségre és a kopogási határra — ami védhető, és amit egy motoros mérnök is
elfogad.
