# Otto & Diesel v3.2 — változó fajhő + a furcsaságok javítása

**`TMF_OttoDiesel_Simulator_v32.html`** — ez váltja a v3.1-et (azt törölheted).

Igazad volt: a v3.1 fizikája hibás maradt. A nedves levegő keverékszabályát megjavítottam,
de a modell **továbbra is állandó fajhővel** számolt, és emiatt volt minden szám furcsa.

---

## 1. A gyökérok: állandó c_v

A levegő c_v-je **nem** konstans — 0,718 kJ/kgK-ról ~1,00-ra nő 2500 K-ig. Ha végig
0,73-mal számolsz:

- **T₃ túl magas lesz**, mert `ΔT = Q/c_v` túl kis nevezővel osztasz
- **γ 1,40 marad** az égés alatt is, holott ~1,30-ra esik → **η jelentősen túllőve**
- **P₃ túl magas**, mert P₃ ∝ T₃

Ez a klasszikus „cold-air-standard" torzítás. Most **NASA 7-együtthatós polinomokkal**
számolok N₂ / O₂ / Ar / CO₂ / H₂O-ra, a nedvességtartalommal arányosan keverve.

**A polinomokat ellenőriztem, nem emlékezetből használtam:**

| | 300 K | 1000 K | 2000 K |
|---|---|---|---|
| N₂ c_p hiba | −0,15 % | +0,19 % | +0,05 % |
| O₂ c_p hiba | −0,17 % | +0,19 % | +0,02 % |
| H₂O c_p hiba | −0,39 % | +0,11 % | −0,07 % |
| CO₂ c_p hiba | +0,40 % | +0,09 % | +0,14 % |

Száraz levegőre: **M = 28,965 g/mol** (irodalom 28,965), c_p 300–3000 K-en **0,2 %-on
belül**, és **γ 1,401 → 1,285** — pontosan ahogy kell.

### Az eredmény

| | állandó c_v (v3.1) | **változó c_v (v3.2)** | valóság |
|---|---|---|---|
| Otto T₃ | 3236 K ⚠ | **2639 K** | 2500–2800 K |
| Otto P₃ | 105 bar | **86 bar** | 50–70 bar |
| Otto η | 59,94 % | **52,88 %** | 40–45 % (indikált) |
| Diesel T₃ | 2737 K | **2363 K** | 1900–2200 K |
| Diesel η | 59,39 % | **53,35 %** | 45–50 % (indikált) |
| γ égés közben | 1,397 (fix) | **1,301** | ~1,30 |

**Az alapállapotból eltűnt mindkét piros figyelmeztetés.** A T₃ már a valós tartományban
van, és a kopogási határ is feljebb került (r_knock 9,39 → **10,28**), így r = 10 nem kopog.

Amit a modell **még mindig** felülbecsül: P_max 86 bar a valós 50–70 helyett, és η ~53 %
a valós ~42 % helyett. Ez **nem hiba**, hanem a levegő-szabvány ciklus természete: az égés
itt pillanatszerű a felső holtponton, nincs hőveszteség a falba, nincs átfúvás, nincs
súrlódás, tökéletes az égés. A levegő-szabvány ciklus **felső korlát**, nem előrejelzés.

### Hogyan számol most

Zárt alakú η-képlet **nincs többé** — változó c_v-vel nem létezik. Helyette a tankönyvi
„variable specific heats" formalizmus, u(T) és φ(T) = ∫c_v/T dT táblákkal:

```
1→2 izentropikus:  φ(T₂) − φ(T₁) = R ln(r)
2→3 izochor:       Q = u(T₃) − u(T₂)          (Otto)
2→3 izobár:        Q = h(T₃) − h(T₂),  r_c = T₃/T₂   (Diesel)
3→4 izentropikus:  φ(T₄) − φ(T₃) = R ln(V₃/V₄)
η = 1 − [u(T₄) − u(T₁)] / q_in
```

A kopogási határ ebből egy sorban invertálható: `r_knock = exp((φ(T_öngy.) − φ(T₁))/R)`.

A táblák 200–4500 K-ig, 5 K-es rácson, nedvességtartalmanként gyorsítótárazva.
**Pontosság: 0,05 K-es közvetlen integráláshoz képest max 19 ppm.**

---

## 2. A P–V panel: az adiabata már nem P·v^γ

Változó fajhővel a `P v^γ = áll.` **nem érvényes**. Az `adPts()` és a `pvArea()` most a
táblából vett valódi izentropát követi: `T(v)` a φ-inverzből, `P = P₁(v₁/v)(T/T₁)`.

**Független ellenőrzés:** a rajzolt görbe alatti P–V integrál és a `m(q_in − q_out)`
energiamérleg **18 munkaponton max 0,1 %-ra egyezik** — a két szám teljesen külön úton
készül, tehát ez valódi keresztellenőrzés.

---

## 3. A hiányzó szellemgörbe

A zöld „❄ cooled target" szaggatott görbe **TM kikapcsolva láthatatlan volt** — pontosan
a valódi görbén feküdt:

```js
const T1ghost = tmOn ? P.T1 : effT1();   // effT1() TM-off esetén magát P.T1-et adja
```

Javítva: a hűtött állapotot explicit számolom (`P.T1 + hx·(Ttarget − P.T1)`). Most tényleg
látszik, mit nyernél a hűtéssel.

---

## 4. A panelek: a betűk és az arány

Az első próbálkozásom rossz volt. A `VB.w = 400` fixálása mellett egy 818 px-es panelen
**2,05× skála** jött ki: a feliratok megduplázódtak, a plot pedig **23 %-ot vesztett a
függőleges egységeiből**. Ezért lett zsúfolt.

Most nem a szélességet, hanem a **skálát** rögzítem (`DESIGN_PX = 1.7` px / viewBox-egység):

| | v3 | első próba | **v3.2** |
|---|---|---|---|
| torzítás | 22 % vízszintes | nincs | nincs |
| 9 px felirat | 18 px széles / 15 magas | 18×18 | **15×15** |
| plot magasság | 242 egység | 186 | **236** |
| plot szélesség | 345 | 423 | **423** |

Vagyis a feliratok visszakapják a v3-ban megszokott súlyukat, a plot pedig szélesebb lett,
ahogy a panel alakja indokolja. Az arány pontosan megmarad, nincs levágás.

---

## 5. A μ(W) eloszlás: tű helyett görbe

A v3 **abszolút** szélességgel dolgozott (~30–52 K), miközben a T tengely 300-tól 2639 K-ig
tart. Egy 40 K-es eloszlás ezen a tengelyen láthatatlan tűszúrás.

Fizikailag a termikus eloszlás szélessége **a hőmérséklettel skálázódik**, ezért σ most
relatív: `σ = (0,06 + 0,45·σ_μ) · T`. Alapbeállításnál ez 32 K-től 634 K-ig változik a
ciklus mentén — végig olvasható. A felirat is kiírja, hány százaléka T-nek.

---

## 6. Új metrikák

| mező | mit mutat |
|---|---|
| **γ intake → comb.** | `1,398 → 1,301` — ez maga a korrekció, amit az állandó c_v elhibázott |
| **T₃ / P_max** | `2639 K / 86 bar` — pirosra vált, ha T₃ meghaladja az adiabatikus lánghőmérsékletet |

---

## 7. A thermal management mérlege (változatlan logika, új számokkal)

308 K → 293 K, 50 % RH, r = 10:

| | |
|---|---|
| töltetsűrűség Δρ | **+3,53 %** |
| γ eltolódás fix r-en | +0,18 % |
| **kopogási tartalék** | **Δr +0,94 → +2,64 %** |
| HX parazita | −0,43 % |
| **NET** | **+5,81 %** (+5,8 kW egy 100 kW-os motoron) |

És T₁ = 253 K-en, ahol a hőcserélő **fűt**: Δρ **−9,96 %**, NET **−12,83 %** — az előjel
helyes marad.

---

## Verifikáció

| teszt | eredmény |
|---|---|
| JS szintaxis, HTML tag-egyensúly (72/72 div, 4/4 svg) | OK |
| Minden `getElementById` cél létezik | OK |
| NASA polinomok vs. irodalmi c_p | fajonként ≤ 0,40 %, levegőre ≤ 0,20 % |
| u(T), φ(T) tábla vs. 0,05 K-es közvetlen integrálás | **max 19 ppm** |
| P–V integrál vs. energiamérleg, 18 munkapont | **max 0,10 %** |
| Carnot-korlát, 1800 pont | **0 sértés** |
| **21 600 teljes render** DOM-stubbal | **0 hiba, 0 NaN attribútum** |
| teljesítmény | `cycle()` 16,8 µs, `pvArea()` 0,44 ms (büdzsé 16,7 ms/frame) |

Böngészőt most sem tudtam futtatni, úgyhogy a 4. és 5. pont (panelméretezés, μ-görbe)
az, amit érdemes ránézésre visszaellenőrizned. Ha a feliratok még mindig nem stimmelnek,
a `DESIGN_PX` konstans egyetlen számmal hangolható: nagyobb érték = kisebb betű.
