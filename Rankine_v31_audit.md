# TMF Rankine Simulator **v3.1** (`TMF_Rankine_Simulator_013.html`) — audit

1693 sor. A `<script>` fizikai blokkját változatlanul kiemeltem és Node-ban futtattam;
referencia: `iapws` (IAPWS-IF97), Python 3.

---

## 0. Amit a v3.1 már megjavított ✅

| # | Javítás | Hol |
|---|---|---|
| 1 | **DOCTYPE** helyes (`<!DOCTYPE html>`, hexdumppal ellenőrizve) | sor 1 |
| 2 | **Inlet 4. panel háttere** `rgba(0,212,255,0.08)` — már nem tömör cián | sor 1485 |
| 3 | **`gain * 0`** debug-maradvány eltűnt; `recovery_pp` most tisztán a `rankine()`-ban számolódik | sor 873, 1589 |
| 4 | **`SIG_IDEAL` / `KAPPA_SENS`** konstansként kiemelve, nincs több szórt `0.04` / `0.15` | sor 806–807 |
| 5 | **Turbina-szakasz** (1'→2') monoton entrópianövekedés, nincs mesterséges szinusz | sor 1107 |
| 6 | **Szivattyú-szakasz** (3→4) valóban függőleges, `s = const` | sor 1124 |
| 7 | **Kazán-szakasz** (4→1) egyetlen folytonos út, nincs kétblokkos szakadás | sor 1139–1154 |
| 8 | **`T4` felső korlát** `Math.min(1.5, w_pump/4.18)` — a v3-beli +2,47 °C helyett fizikailag reális | sor 843 |
| 9 | **1→1' szakasz** a két egzakt állapotpont között húzódik, kikerüli a `isobarSH`-hibát | sor 1090–1097 |
| 10 | Panel-alcímek, referenciaüzem-presetek — jó UX-bővítés | sor 595–617, 469–486 |

A 9-es igazolása: a húr és a valódi izobár közti maximális eltérés
**0,131 kJ/kgK = a paneszélesség 1,5 %-a** (IAPWS-szal ellenőrizve, 320–500 °C).
Vizuálisan elhanyagolható. A kódkomment állítása (*„linear interpolation is
physically correct here"*) szigorúan véve téves — az izobárok görbültek T-s térben —,
de a közelítés gyakorlatilag rendben van. Írd át a kommentet:
*„chord approximation; max deviation ~1,5 % of panel width vs. true isobar"*.

---

## A. AMI MEGMARADT — változatlanul

### A1. `superheatProps()` telítettségi tesztje továbbra is hibás
**Sor 755–760.** Bájtra ugyanaz, mint v3-ban:

```js
const sat = satProps(T_C);
if (Math.abs(P_bar - P_sat_bar) < 0.5 || T_C <= sat.T_C + 0.5) {
    return { h: sat.hg, s: sat.sg };
}
```

`satProps()` a **klampolt bemenetet** adja vissza `T_C`-ként, tehát `sat.T_C === T_C`
minden T ≤ 373,9 °C-ra → a feltétel **azonosan igaz**. Futtatva:

| T (°C) | h visszaadva | forrás |
|---|---|---|
| 300 | 2748,9 | SAT ← hibás |
| 350 | 2551,8 | SAT ← hibás |
| 370 | 2197,8 | SAT ← hibás |
| 374 | 2087,1 | SAT ← hibás |
| 380 | 3063,9 | SH ✓ |

**Két helyen üt vissza:**

**(a) A szaggatott narancs izobár a T-s panelen — sor 1069–1071.**
Itt a v3.1 *nem* kerülte ki, sőt: a v3-ban legalább az első pontot felülírtad
(`isoStart`), most a `shIso.map(...)` **minden** pontot használ. Mérve:

```
s: 5,706  →  vissza 4,601 (min)  →  6,735 (vég)
legnagyobb ugrás Δs = 1,599 kJ/kgK  (T = 369,9 → 375,3 °C)
```

Vagyis a referencia-izobár **először 1,105 kJ/kgK-t hátrafelé fut** a telítési
gőzgörbén, majd egy, a **panelszélesség 18 %-át** átívelő ugrással visszaugrik.
Ez a színes ciklusút mellett fut, tehát látványosan ellentmond neki.

**(b) Ha a Superheat csúszka 370 °C-on áll,** maga az **1' állapotpont** is hamis
(h = 2197,8 helyett ~3160). A paramétertér **600/15 975 = 3,8 %-a** ilyen.

**Javítás** (a nyomáshoz tartozó valódi T_sat kell):

```js
function tSatFromP(P_bar) {
  let lo = 0.01, hi = 373.9;
  for (let k = 0; k < 60; k++) {
    const mid = (lo + hi) / 2;
    (satProps(mid).P_kPa / 100 < P_bar) ? lo = mid : hi = mid;
  }
  return (lo + hi) / 2;
}

function superheatProps(T_C, P_bar) {
  const Tsat = tSatFromP(P_bar);
  if (T_C <= Tsat + 0.5) {
    const s = satProps(Tsat);
    return { h: s.hg, s: s.sg };
  }
  /* ... meglévő tábla-interpoláció ... */
}
```

### A2. „Carnot limit" továbbra is a kazán telítési hőmérsékletével
**Sor 848:** `eta_carnot = 1 - cond.T_K / boil.T_K`

Újraszkennelve a teljes paramétertartományt (15 975 pont):
**1313 esetben (8,2 %) η_Rankine > a kijelzett „Carnot limit"**.
A `Tsh = 370`-es (A1-hibás) sort kihagyva is **1155/15 375 = 7,5 %**.
Legrosszabb tiszta eset: Tb = 150, Tsh = 600, Tc = 90 → **η_cl = 26,66 %
vs. kijelzett korlát 14,18 % (+12,48 pp)**.

Alapbeállításnál a három lehetséges referencia:

| definíció | érték |
|---|---|
| jelenlegi (T_sat,boiler = 300 °C) | 45,36 % |
| T_max = Tsh = 500 °C | 59,50 % |
| **T̄ hőbevitel = 254,5 °C (527,6 K)** | **40,65 %** |

A harmadikat ajánlom — ez a *tényleges* korlát erre a ciklusra, és η_cl = 34,50 %
szépen alatta marad, ráadásul megmutatja, mennyi vész el a nem-izoterm hőbevitelen:

```js
const T_mean = (h1p - h4) / (s1p - s4);        // K
const eta_carnot = 1 - cond.T_K / T_mean;
```

### A3. Gazdasági modell — változatlanul villamos ár hőteljesítményre
**Sor 959–962.** `P.mw / cy.etmf` = **MW_th**, szorozva **$80/MWh_e**-vel.
Alapbeállításnál: **187,0 M$/év „tüzelőanyag"** egy 100 MW-os blokkra, aminek
a teljes árbevétele 64,0 M$/év → **a tüzelőanyag 2,92× a bevétel**.

Ajánlott átírás (ez amúgy is jobban illik a mondanivalóhoz):

```js
const Q_th    = P.mw / cy.etmf;                      // MW_th, rögzített
const extraMW = Q_th * (cy.etmf_ideal - cy.etmf);    // MW_e többlet
const save_yr = extraMW * hours * 80 / 1e6;          // M$/év
```

### A4. `kap_peak` = a KAZÁN κ-ja, nem a turbináé
**Sor 854–862.** Alapbeállításnál mérve:

| szakasz | κ |
|---|---|
| 1→1' superheat | 1,300 |
| 1'→2' turbine | 1,142 |
| 2'→3 condenser | 1,018 |
| 3→4 pump | 1,008 |
| **4→1 boiler** | **1,731 ← peak** |

A `kap_boil = 1 + (hfg/2257)(1+σ_μ)` szinte mindig dominál, tehát a
`Δη = σ_μ²·κ_peak·0,15` a **kazán** görbületével skálázódik — miközben az egész
narratíva (`← σ_μ effect` felirat a κ-panel *turbina*-szakaszán, „σ_μ critical here",
az alsó „money" panel) a **turbina belépőről** szól. Vagy `kap_turb`-öt használj,
vagy írd le explicit módon, hogy a κ_peak globális.

### A5. SH_TABLE entalpiái nagy nyomáson (változatlan táblák)
82 bejegyzés IAPWS-IF97 ellen: az **entrópiák jók** (±0,002), az **entalpiák ≥ 80 bar
felett szisztematikusan túl magasak**, a hiba T-vel nő. 200 bar/600 °C: **+143 kJ/kg (4 %)**.
Árulkodó: a táblád szerint 600 °C-on h *nő* 100→120 bar között (3660,4 → 3670,5),
valójában csökken (3625,8 → 3609,0).

Rossz hőmérsékleten ülő „telítési horgony" sorok:
`40:{250}` és `80:{295}` valójában **komprimált folyadék** (h = 1085,7, ill. 1317,0);
`100:{325}` 68,5-tel alálő; `150:{345}` 96,2-vel.

Hatás elérhető munkapontokon: **≤ 1,00 pp** (Tb=350/Tsh=600/Tc=40: 38,30 % vs 37,30 %).
Alapbeállításnál +0,17 pp. Mivel a TMF-effektus maga 0,28 pp, a táblahiba
**összemérhető azzal, amit mérni akarsz** — és a fejlécben `IAPWS-IF97` badge van.

### A6. `preserveAspectRatio="none"` mind az 5 SVG-n
**Sor 597, 602, 607, 612, 618.** A `viewBox` nem-egyenletesen nyúlik → körök
ellipszissé, feliratok vízszintesen torzulnak. `xMidYMid meet` a javítás.

### A7. Kisebb, változatlan tételek
- **Sor 1615:** `"3→4: Pump (isentropic compression)"` — ellentmond az `η_p = 0,85` csúszkának.
- **Sor 839:** `s4 = s3` izentropikusat feltételez, holott `w_pump = w_s/0,85`.
  Konzisztensen: `s4 = s3 + (w_pump − w_pump_s)/T3`.
- **Sor 1271 + 1298–1304:** a `grid(svg,5,4)` már húz 5 függőleges vonalat, a
  szakaszhatárok újabb 5-öt ugyanoda → **dupla vonalak** a κ-panelen.
- **Sor 1054–1059:** a dome utolsó intervalluma 360→374 °C, lineárisan interpolálva →
  a kritikus pont **hegyes háromszögként** zárul. A `SAT_TABLE`-ből hiányzik a **70 °C-os sor**.
- **Sor 929:** `P.Tsh = P.Tb + 30` — a slider `min=370, step=10`; Tb=345 esetén 375-öt
  írsz be, a böngésző 380-ra kerekít → **a JS-változó és a csúszka szétcsúszik**.
- **Sor 928:** `if (P.Tc >= P.Tb - 20)` soha nem fut le (Tc ≤ 90, Tb ≥ 150) — holt kód.
- **Sor 941 + 980:** az `up()` egyszer hívja a `rankine()`-t, a `render()` további ötször
  → **6 teljes ciklusszámítás képkockánként**, animáció közben 360/mp.
- **Sor 1659–1664:** a `loop()` fix `tick += SKIP`, nincs delta-time → 144 Hz-en 2,4× gyorsabb.
- **Sor 1622:** az első annotáció félmondat után magyarra vált, a többi négy angol.
- **Sor 433:** `IAPWS-IF97` badge, de a kód lineárisan interpolált diszkrét táblákat használ,
  a telítési nyomás pedig a Wagner–Pruß **IAPWS-95** egyenlet.

---

## B. ÚJ HIBÁK — a v3.1-ben keletkeztek

### B1. Az inlet-panel harmadik sora **láthatatlan** (viewBox 170 → 165)
**Sor 618** a viewBox-ot `0 0 1200 165`-re állítja, de a `drawInlet()` **sor 1437**
továbbra is `const H = 170`-nel számol. A szövegek y-koordinátái:

```
panel rect:      y =   4,0 … 152,0
desc sor 0:      y = 145,6   ✓ ok
desc sor 1:      y = 156,6   ← a panel keretén KÍVÜL
desc sor 2:      y = 167,6   ← a viewBoxon KÍVÜL → NEM LÁTSZIK
```

Tehát mind a négy oszlopból **eltűnik a harmadik „design factor"**
(*Heat exchanger design*, *Flow distribution*, *Straightener distance*, *η loss driver*),
a második pedig kilóg a keretből. Ez pont a panel lényege — hogy megmondja, *mit kell javítani*.

```diff
- <svg id="svg-inlet" viewBox="0 0 1200 165" preserveAspectRatio="none"></svg>
+ <svg id="svg-inlet" viewBox="0 0 1200 182" preserveAspectRatio="xMidYMid meet"></svg>
```
és `const H = 182;` a `drawInlet()`-ben (a `.panel-bottom` 195 px magas,
a cím+alcím ~32 px → 163 px marad; érdemes a `height: calc(100% - 32px)`-et is ellenőrizni).

### B2. A komponens-számok **már nem adják ki** a főszámot
**Sor 1572:** `const idealVal = idx === 0 ? 0.05 : idx === 1 ? 0.03 : 0.04;`

Ezek a per-komponens célértékek nincsenek összehangolva a globális `SIG_IDEAL = 0.04`-gyel:

```
√(0,05² + 0,03² + 0,04²) = 0,0707   ≠   SIG_IDEAL = 0,04
```

Következmény alapbeállításnál:

| | pp |
|---|---|
| σ_T komponens | 0,107 |
| σ_ρ komponens | 0,049 |
| σ_v komponens | 0,075 |
| **komponensek összege** | **0,231** |
| **`recovery_pp` főszám (ugyanezen a panelen!)** | **0,262** |
| eltérés | **−11,6 %** |

A v3-ban ez *pontosan* összeadódott (mert σ_T²+σ_ρ²+σ_v² = σ_μ²), és ez volt a
dekompozíció legszebb tulajdonsága — hogy a három szám kiadja a negyediket.
Ezt most elvesztetted. Vagy vezesd vissza a komponens-célokat úgy, hogy
√(Σ ideal²) = SIG_IDEAL, vagy skálázd őket:

```js
// egyszerű megoldás: arányos célok, amik kiadják SIG_IDEAL-t
const w = SIG_IDEAL / cy.sig_mu;                 // közös skálafaktor
const idealVal = comp.val * w;                   // komponensenként arányos
```

### B3. A `ref-compare-box` soha nem jelenik meg
**Sor 893–916.** Mindhárom ág `box.style.display = 'none'`-ra állítja, és a
`m-ref-gain` mezőbe (sor 489) **sehol nem írsz** — végig `—` marad.
Vagy fejezd be, vagy vedd ki a HTML-ből (sor 487–490).

### B4. `setRef('custom')` nem állít vissza semmit
**Sor 912–914.** A „Custom (sliders)" rádiógomb kiválasztása után a csúszkák
a *preset* értékein maradnak, tehát a felirat félrevezető. Vagy ments el egy
`customState` objektumot preset-váltás előtt, és állítsd vissza, vagy nevezd át
a gombot *„Manual"*-ra.

### B5. Preset-címke pontatlan
**Sor 473:** „Old (1980s) σ_μ≈0.30", de a beállított 0,20/0,12/0,16 →
**σ_μ = 0,2828**. (A „Modern σ_μ≈0.15" viszont pontos: 0,1517 ✓.)
Vagy 0,21/0,13/0,17 (→ 0,2989), vagy írd át a címkét 0,28-ra.

### B6. Két, egymást átfedő „recovery" felirat az η-panelen
**Sor 1411–1412** kiírja a `+X,XXpp`-t a nyíl közepére, **sor 1420–1421** pedig
ugyanazt az értéket `← X,XXpp recovery` formában a pontra. Mindkettő zöld,
`font-size` 10 és 8, és mivel `cy0` és `cy2` közel van egymáshoz kis σ_μ-nél,
**átlapolnak**. Válassz egyet.

### B7. A μ(W) panel ideális referenciagörbéje gyakorlatilag eltűnt
**Sor 1213 + 1244–1245.** A `Tmax` most adaptív (`P.Tsh + sigBase*3.5`), így a
tengely ~612 °C-ot fog át, az ideális eloszlás szórása viszont
`(15 + 0,04·80)·0,04·8 = 5,83` maradt. Ez a panelszélesség **~1,7 %-a** — egy
hajszálvékony tüske, amit a felhasználó nem lát. Skálázd együtt az adaptív kerettel,
vagy kösd a `sigMap`-hez ugyanúgy, mint az aktuális görbét.

---

## Prioritási sorrend

| # | Tétel | Hatás | Munka |
|---|---|---|---|
| 1 | **B1** — inlet viewBox 165 vs H=170 | a „money panel" 1/3-a láthatatlan | 2 sor |
| 2 | **A1** — `superheatProps` telítettségi teszt | 18 %-os szakadás a T-s izobáron + hamis 1' pont | ~15 sor |
| 3 | **A2** — Carnot referencia | látszólagos II. főtétel-sértés az esetek 7,5 %-ában, max +12,5 pp | 2 sor |
| 4 | **B2** — komponens-célok ≠ SIG_IDEAL | a dekompozíció 11,6 %-kal nem stimmel | 3 sor |
| 5 | **A3** — gazdasági egységek | $-számok 2,92× irreálisak | ~5 sor |
| 6 | **A6** — `preserveAspectRatio` | torz szöveg és körök | 5 attribútum |
| 7 | **B3–B6** — holt UI, címkék, átfedő feliratok | polish | ~15 sor |
| 8 | **A5** — SH_TABLE ≥100 bar | ≤1 pp, de aláássa az „IAPWS" badge-et | táblajavítás |
| 9 | **A4** — κ_peak vs κ_turb | fogalmi inkonzisztencia | 1 sor + döntés |
| 10 | **A7, B7** | finomítások | — |

---

## Egy apró figyelmeztetés

A fájl módosítási dátuma **május 1.**, a korábban küldött `Rankine.html`-é **május 6.**
Ha a „013" tényleg az utolsó változat, akkor rendben — de érdemes ellenőrizni,
hogy nem maradt-e egy még újabb verzió valahol, mert a `Rankine.html` néhány
dolgot (T-s szakaszok) *nem* tartalmazott javítva, viszont a 013 igen — tehát
a kettő nem egyszerű időrendben követi egymást.

---

### Módszertan
- A `<script>` fizikai blokkját (`SAT_TABLE` … `rankine()`) változatlanul kiemeltem
  és Node 22-ben futtattam — nem újraírtam.
- Referencia: `iapws` 1.5.x `IAPWS97`, Python 3.
- Carnot-szkennelés: Tb ∈ [150,350]/5, Tsh ∈ [370,620]/10, Tc ∈ [20,90]/5,
  a `Tsh > Tb+20` szűrővel → 15 975 érvényes pont.
- A B1 koordinátáit a `drawInlet()` saját képleteivel számoltam újra
  (`H=170, margin.t=18, margin.b=30, ch=panelH*0.48`).
- Böngészős renderelést **nem** futtattam (nincs headless Chrome a sandboxban),
  így B1/B6/A6 kódelemzésen alapul, nem képernyőképen — ezeket érdemes egy
  gyors megnyitással visszaellenőrizned.
