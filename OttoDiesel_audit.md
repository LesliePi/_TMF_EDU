# TMF Otto & Diesel Simulator v3 (`TMF_OttoDiesel_Simulator_012.html`) — audit

1235 sor. A `<script>` fizikai blokkját változatlanul kiemeltem és Node-ban futtattam.
Referencia: levegő–vízgőz keverék moláris hőkapacitásai (dry air Cp = 29,10 / Cv = 20,79 J/mol·K;
H₂O gőz Cp = 33,60 / Cv = 25,29 J/mol·K), valamint a levegő-szabvány Otto/Diesel zárt alakok.

---

## 0. Ami jó — nincs teendő

Ez a fájl szerkezetileg egészségesebb, mint a Rankine volt. Konkrétan:

- **DOCTYPE rendben** (`<!DOCTYPE html>`, hexdumppal ellenőrizve).
- **Az Otto és Diesel hatásfok-képletek helyesek** és a kód **tökéletesen konzisztens**:
  12 munkaponton összevetettem a zárt alakot az állapotpontokból számolt
  energiamérleggel (`1 − c_v(T₄−T₁)/[c_p(T₃−T₂)]`) → **eltérés 0,0000 pp mindenhol**.
- **`pvArea()` numerikus integrálása pontos**: Otto +0,057 %, Diesel −0,067 % az
  analitikus W_net-hez képest.
- **Carnot: 0 sértés 6804 ponton.** A `1 − T_min/T_max` referencia a ciklus valódi
  szélsőértékeiből — ez helyes választás, jobb, mint amit a Rankine v3.1 csinált.
- Az állapotpontok (T₂, P₂, T₃, P₃, V₃, T₄, P₄) mindkét ciklusra helyesek.
- A **sűrűségképlet** `(1 − 0,378·x_v)/T` korrekt nedves levegőre.
- A **kondenzációs logika** (abszolút nedvesség megőrzése hűtéskor, `x_v_sat` plafon)
  fogalmilag helyes és szépen meg van írva.

A problémák szinte mind **egyetlen helyről** erednek: a nedves levegő modelljéből.

---

## A. SÚLYOS — a nedvességmodell

### A1. A γ nedvességfüggése ~20× túlzó
**Sor 560–565.**

```js
return { g: G - 0.07 * (xv / 0.04), Cv: Cv0 + 0.10 * (xv / 0.04), xv };
```

| RH % | T (K) | x_v | **γ modell** | **γ valós** | eltérés |
|---|---|---|---|---|---|
| 0 | 308 | 0,0000 | 1,4000 | 1,3997 | +0,0003 |
| 25 | 308 | 0,0139 | 1,3756 | 1,3985 | −0,0229 |
| **50** | **308** | **0,0279** | **1,3512** | **1,3973** | **−0,0461** |
| 75 | 308 | 0,0418 | 1,3268 | 1,3961 | −0,0693 |
| 100 | 308 | 0,0450 | 1,3212 | 1,3959 | −0,0746 |

Az alapbeállításnál a modell Δγ = **−0,0488**, a valóság **−0,0024** → **20× túllövés**.

Ez közvetlenül a hatásfokba megy (η = 1 − r^(1−γ)), r = 10-nél:

| RH % | η modell | η valós | hiba |
|---|---|---|---|
| 0 | 60,19 % | 60,16 % | +0,03 pp |
| **50** | **55,46 %** | **59,94 %** | **−4,48 pp** |
| 100 | 52,27 % | 59,81 % | **−7,53 pp** |

**Miért ez a legfontosabb tétel:** a szimulátor egész „thermal management" mondanivalója
— hogy a beszívott levegő hűtése/szárítása hatásfokot ad — ezen a koefficiensen áll.
A valós Δγ-effektus egy benzinmotoron **elhanyagolható** (~0,05 % relatív); a valódi
nyereség a **sűrűségnövekedésből** (töltet tömege) jön, amit a `g-dens` sor helyesen
számol. Jelenleg a `g-dry` sor **~30×-osan felnagyítva** duplikálja a hatást.

**Javasolt csere** (valódi keverékszabály, moláris alapon):

```js
const CP_A = 29.10, CV_A = 20.79;   // J/mol·K, száraz levegő
const CP_V = 33.60, CV_V = 25.29;   // J/mol·K, vízgőz
function air(RH, T) {
  const Tc = T - 273.15;
  const es = 0.6108 * Math.exp(17.27 * Tc / (Tc + 237.3));   // kPa
  const xv = Math.min(0.95, (RH / 100) * es / P_AMB_KPA);    // mólarány
  const cpM = (1 - xv) * CP_A + xv * CP_V;
  const cvM = (1 - xv) * CV_A + xv * CV_V;
  const M   = (1 - xv) * 28.97 + xv * 18.015;                // g/mol
  return { g: cpM / cvM, Cv: cvM / M * 1000, xv };           // Cv kJ/kg·K
}
```

Ez a `Cv`-t is rendbe teszi (lásd A2), és eltünteti a `0.04`/`0.07`/`0.10` mágikus számokat.

### A2. `Cv` nedvességfüggése ~8× túlzó
Ugyanaz a sor. RH = 50 % / 308 K-en a modell **0,788**, a valós tömegalapú érték **0,730**.
Ez az Otto `T₃ = T₂ + Q_in/C_v`-be megy, tehát a csúcshőmérsékletet ~8 %-kal alálövi.

### A3. Az `x_v` 0,045-ös plafonja
**Sor 563.** A `Math.min(0.045, ...)` a valódi telítési mólarányt vágja le:

| T (K) | x_v,sat valós | modell | tényező |
|---|---|---|---|
| 293 | 0,0232 | 0,0232 | ✓ |
| 308 | 0,0558 | 0,045 | 1,2× |
| 318 | 0,0951 | 0,045 | 2,1× |
| 338 | 0,2487 | 0,045 | 5,5× |
| 353 | 0,4724 | 0,045 | 10,5× |

A T₁ csúszka **378 K-ig** megy, tehát ez bőven elérhető tartomány. Mellékhatás:
RH = 100 %-on a plafon miatt x_v már nem függ T₁-től, ezért a **„T₁ sensitivity"
metrika hamisan pontosan 0-t mutat** (lásd B3).

### A4. Dupla könyvelés: a nedvesség kétszer büntet
**Sor 610–611.**

```js
const hum_pen = xv * 0.8;
const etmf = ecl * Math.max(0.4, 1 - P.sig * P.sig * ks - hum_pen);
```

A nedvesség már **egyszer** csökkentette `ecl`-t a γ-n keresztül, most `hum_pen`
(alapon +2,25 %) **másodszor** is levon. Vagy az egyiket vedd ki, vagy írd le
explicit módon, hogy a `hum_pen` egy *külön* fizikai mechanizmus
(pl. gyulladási késleltetés, lassabb lángterjedés) — mert olvasóként ez most
ugyanannak a hatásnak a kétszeri elszámolásaként néz ki.

---

## B. HASZNÁLHATATLAN VAGY HIBÁS KIJELZÉS

### B1. Az „Optimum r★" mindig 22 — a célfüggvény monoton
**Sor 642–650.** Az `optR()` a `pvArea(c) * c.ecl` maximumát keresi. Csakhogy
Otto-nál `pvArea = m·Q_in·η`, tehát a célfüggvény `m·Q_in·η²` — **szigorúan
növekvő r-ben**:

```
  r= 4  η=38,55%  pvArea= 814,3  objective= 313,9
  r= 8  η=51,82%  pvArea=1095,2  objective= 567,6
  r=10  η=55,46%  pvArea=1172,2  objective= 650,0
  r=14  η=60,42%  pvArea=1277,8  objective= 772,0
  r=18  η=63,76%  pvArea=1349,4  objective= 860,4
  r=22  η=66,23%  pvArea=1402,8  objective= 929,1   <- mindig ez nyer
```

Mindkét módban **22-t** ad vissza, konstansként. Ráadásul Otto módban a csúszka
maximuma **14**, tehát a „célt" el sem lehet érni — a `m-optr` mező tartósan
sárga marad („r★=22.0 (cur=10)"), a P-V panel `r★` felirata szintén.

Egy valódi optimum kell hozzá, hogy legyen **ellenható tag**. Reális választások:

- **Kopogási (knock) korlát**: r felett T₂ meghaladja az öngyulladási hőmérsékletet →
  a maximális megengedett r az üzemanyag oktánszámától és T₁-től függ. Ez fizikailag
  releváns is: hidegebb beszívott levegő → magasabb megengedett r → **ez volna a
  thermal management igazi haszna egy benzinmotoron**.
- **Súrlódási veszteség**, ami r-rel nő (pl. `fmep ∝ P₂`), a nettó munkából levonva.

Amíg nincs ilyen, javaslom a mezőt kivenni vagy átnevezni („η nő r-rel, korlát: kopogás").

### B2. `Δη` bitenkénti operátorral egészre csonkul
**Sor 1029.**

```js
dt.textContent = `Δη=−${(cy.ecl - cy.etmf) * 100 | 0}%`;
```

A `| 0` bitenkénti VAGY, ami **egészre csonkít**:

| valós Δη | kiírva |
|---|---|
| 4,345 % (alapbeállítás) | −4 % |
| 4,57 % | −4 % |
| 0,9 % | **−0 %** |
| 0,4 % | **−0 %** |

Ugyanaz a fajta bennfelejtett maradvány, mint a Rankine v3.1 `gain * 0`-ja.
Javítás: `.toFixed(2)`. (Az oldalsáv `m-deta` mezője helyesen `toFixed(2)`-t
használ, tehát a két szám ellentmond egymásnak a képernyőn.)

### B3. A „T₁ sensitivity" metrika egy artefaktumot mér
**Sor 1043–1049.** Az ideális levegő-szabvány Otto hatásfoka
`η = 1 − r^(1−γ)` — **T₁-től egzaktul független**. A kijelzett érték:

```
  RH=  0%   +0,0000 %/K     (helyes)
  RH= 50%   −0,3180 %/K     <- tisztán a 20x-os nedvességcsatolás
  RH=100%   +0,0000 %/K     <- az x_v plafon miatt, nem fizikai okból
```

Tehát a mező vagy nullát mutat, vagy egy hibás koefficiens nagyságát. Az A1 javítása
után ez ~−0,016 %/K-re esne. Ha érdemi T₁-érzékenységet akarsz mutatni, azt a
**tömegáramon / töltéssűrűségen** keresztül kell (ott valóban ~0,34 %/K),
nem a hatásfokon.

### B4. A μ-panel `σ_μ` felirata más mennyiség, mint a csúszka
**Sor 879.** `σ_μ≈${(sigCur / 100).toFixed(2)}`

A csúszka σ_μ = **0,18**, a panel ugyanezzel a névvel **0,39 / 0,88 / 0,62 / 0,44**-et
ír ki (lépésenként), mert `sigCur` egy Kelvinben mért eloszlásszélesség osztva 100-zal.
Két különböző dolog azonos jelöléssel. Nevezd át pl. `σ_T [K]`-ra, és írd ki
Kelvinben (`sigCur.toFixed(0) + ' K'`).

---

## C. LOGIKAI HIBA A THERMAL MANAGEMENT PANELBEN

### C1. A „gain" fix 308 K / 50 % RH bázishoz mér, nem a jelenlegi állapothoz
**Sor 1069–1073.** A `rho_b` mindig `air(50, 308)`-ból jön, függetlenül attól,
hogy a felhasználó hova tette a T₁ csúszkát. Következmény:

| T₁ | T₁_eff (HX után) | **panel mutatja** | **valóság (TM ki → be)** |
|---|---|---|---|
| 253 K | 281 K | **+10,8 %** | **−10,0 %** |
| 283 K | 290 K | +7,1 % | −2,4 % |
| 308 K | 298 K | +3,5 % | +3,5 % ✓ |
| 338 K | 307 K | −0,2 % | +10,3 % |

**253 K-en a hőcserélő fűti a beszívott levegőt** (253 → 281 K), tehát ~10 %
sűrűséget *veszít* — a panel mégis +10,8 % nyereséget jelez. **Előjelfordulás.**
338 K-en fordítva: valódi +10,3 %-ot mutat −0,2 %-nak.

A doboz felirata („GAIN vs BASELINE (308K, 50%RH)") formálisan igaz, de a `NET`
és a `@100kW` sor egyértelműen úgy olvasódik, mint *a TM bekapcsolásának haszna* —
és a P-V panel szellemgörbéje is a felhasználó valódi T₁-éhez képest rajzol.
A kettő ellentmond egymásnak.

**Javítás:** a bázis legyen a jelenlegi TM-off állapot:

```js
const { xv: xvOff } = air(P.RH, P.T1);
const rho_b = (1 - 0.378 * xvOff) / P.T1;      // aktuális, nem 308 K
```

Ha meg akarod tartani a fix referenciát is, tedd külön sorba („vs 308 K bázis")
a TM-nyereség mellé.

### C2. `updateGain()` inline duplikálja a γ-képletet
**Sor 1077.** `const gc = G - 0.07 * (xv_eff_cooled / 0.04);` — ugyanaz a képlet,
mint az `air()`-ben, de kézzel másolva. Ha az A1-et javítod, ezt is javítani kell,
különben a két hely szétcsúszik. Hívd az `air()`-t.

---

## D. A DIESEL ÁG

### D1. A `Q_in` csúszka Diesel módban teljesen inert
**Sor 601–605.** A Diesel ág `r_c`-ből számol mindent, `P.Qin` nem szerepel benne:

```
  Q_in= 500   T₃=2125 K   η=56,22 %   pvArea=894,7
  Q_in=1800   T₃=2125 K   η=56,22 %   pvArea=894,7
  Q_in=3500   T₃=2125 K   η=56,22 %   pvArea=894,7
```

Fizikailag `r_c` **nem** független paraméter — a befecskendezett hőmennyiség
határozza meg: `r_c = 1 + Q_in/(c_p·T₂)`. A jelenlegi 2,5-ös alapérték
Q_in = 1800-hoz tartozna (számítva: **2,99**):

| Q_in | T₂ | c_p | r_c **kellene** |
|---|---|---|---|
| 500 | 850 K | 1,064 | 1,55 |
| 1800 | 850 K | 1,064 | **2,99** |
| 3500 | 850 K | 1,064 | 4,87 |

Két épkézláb megoldás:

1. **`r_c` legyen származtatott** (a csúszkát Diesel módban kivenni / kijelzővé tenni):
   ```js
   const cp = Cv * g;
   const rc = 1 + P.Qin / (cp * T2);
   ```
   Így a `Q_in` csúszka mindkét módban ugyanazt jelenti, és az Otto↔Diesel
   összehasonlítás **azonos hőbevitel mellett** történik — ami épp a tankönyvi
   összevetés, és pont azt mutatná meg, amit az annotációd állít.
2. Vagy fordítva: `r_c` marad a csúszka, és a `Q_in` mezőt Diesel módban
   *számított kijelzéssé* teszed, `Q_in = c_p·T₂·(r_c − 1)`.

Az (1) a következetesebb.

### D2. Csúszkatartomány vs. súgószöveg
**Sor 1158–1170.** Otto: slider **4–14**, súgó „(Otto: 8–12)". Diesel: slider
**12–24**, súgó „(Diesel: 14–22)". Az `optR()` viszont 4–22 között keres,
mindkét módban. Három különböző tartomány három helyen.

---

## E. TELJESÍTMÉNY ÉS KISEBB TÉTELEK

| # | Hely | Tétel |
|---|---|---|
| E1 | 807, 1038 | **`optR()` képkockánként kétszer** hívódik (P-V + η panel), 0,86 ms/hívás → **1,72 ms/frame** egy konstans kiszámításáért. Cache-eld, vagy vedd ki (B1). |
| E2 | 696, 818, 889, 983 | `cycle()` **4× fut képkockánként** (minden rajzoló újraszámolja), plusz 74× az `optR()`-ekben. Számold ki egyszer és add át paraméterként — pont mint a Rankine v3.2-ben. |
| E3 | 851 | `const skPrev = skMapFull[(step + 3) % 4] * 0` — a `* 0` bennfelejtett maradvány, `skPrev` pedig **sehol nincs használva**. Törlendő. |
| E4 | 531–543 | `preserveAspectRatio="none"` mind a 4 panelen. A 2×2 rács miatt itt enyhébb, mint a Rankine-nál (~22 % vízszintes nyújtás, nem 3×), de a körök ellipszisek és a feliratok torzak. |
| E5 | 1110–1117 | `loop()` `rafSkip`/`SKIP` fix lépésköz → **frame-rate függő** animáció (144 Hz-en 2,4× gyorsabb). Delta-time kell. |
| E6 | 860 | `drawDist`: `const sc = (ph * 0.72) / mx;` — nincs `mx === 0` védelem. Jelenleg nem fordul elő, de egy sor. |
| E7 | 563 | Az `x_v` implicit **100 kPa** környezeti nyomást feltételez (egyezik a `P1 = 100`-zal, tehát konzisztens) — érdemes nevesített konstansként kiírni. |
| E8 | 607 | `kaps = [1, …, 1.05]` — a 0. és 3. elem kemény konstans. Nincs `[NUMERICAL]` jelölés sehol a fájlban; a Rankine-ban használt `[PROVEN]/[NUMERICAL]/[CONJECTURE]` rendszer itt hiányzik, pedig ugyanúgy elkelne. |

---

## Prioritási sorrend

| # | Tétel | Hatás | Munka |
|---|---|---|---|
| 1 | **A1/A2** — nedves levegő γ és C_v | 4,5–7,5 pp η-hiba; az egész TM-narratíva ezen áll | ~12 sor |
| 2 | **C1** — gain bázis | előjelfordulás hideg beszíváson | 2 sor |
| 3 | **D1** — Q_in inert Dieselben | egy csúszka nem csinál semmit | ~5 sor |
| 4 | **B1** — optR mindig 22 | egy metrika és egy panelfelirat használhatatlan | kivenni vagy knock-korlátot bevezetni |
| 5 | **B2** — `\| 0` csonkítás | két egymásnak ellentmondó Δη a képernyőn | 1 sor |
| 6 | **A3** — x_v plafon | 338 K-en 5,5× alálövés | 1 sor |
| 7 | **B3/B4** — félrevezető metrikanevek | | ~4 sor |
| 8 | **A4** — dupla nedvességbüntetés | fogalmi | döntés + 1 sor |
| 9 | **E1–E3** — perf és holt kód | 1,72 ms/frame + maradványok | ~10 sor |
| 10 | **E4–E8** | finomítások | — |

---

### Módszertan
- A `<script>` fizikai blokkját (`air` … `optR`) változatlanul kiemeltem és
  Node 22-ben futtattam — nem írtam újra.
- Nedves levegő referencia: moláris keverékszabály (`γ = Cp_mix/Cv_mix`),
  tömegalapú `c_v` a mólarányból számolt tömegaránnyal.
- Carnot-szkennelés: mode × r ∈ [4,24] × T₁ ∈ [253,378] × RH ∈ {0,50,100} ×
  Q_in ∈ {500,1800,3500} × r_c ∈ {1,1; 2,5; 4,0} → 6804 pont.
- `pvArea` ellenőrzés az analitikus `∫P dV` zárt alakokkal.
- `optR()` időzítés: 200 hívás átlaga.
- Böngészős renderelést **nem** futtattam (nincs headless Chrome a sandboxban),
  így E4 kódelemzésen alapul.

---

## Megjegyzés a v3.2 Rankine felől

Ha szeretnéd, ebből is tudok javított verziót csinálni ugyanazzal a módszerrel
(célzott, `assert`-elt cserék + `[FIX]` kommentek + gépi verifikáció). Az A1 javítása
viszont **érdemben megváltoztatja a modell számait** — a hatásfok RH = 50 %-on
55,5 %-ról ~59,9 %-ra ugrik, és a „dry air Δγ" nyereség lényegében eltűnik.
Ez fizikailag helyes, de a demó üzenetét áthelyezi: a thermal management haszna
**a sűrűség (töltettömeg) és a kopogási határ**, nem a γ. Érdemes előbb eldöntened,
hogy ezt akarod-e — mert így a TM-panel egyik sora kiürül, viszont nyílik egy
sokkal erősebb érv (magasabb megengedett r hidegebb szíváson).
