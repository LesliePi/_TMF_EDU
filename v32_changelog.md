# TMF Rankine Simulator v3.2 — változásnapló

Kiindulás: `TMF_Rankine_Simulator_013.html` (v3.1, 1693 sor) → **`TMF_Rankine_Simulator_v32.html`** (1935 sor).

Minden változás célzott szövegcserével készült, gépi ellenőrzéssel (`assert`, hogy
minden minta pontosan egyszer illeszkedjen). Minden javítás mellett `[FIX v3.2]`
kommentblokk áll, ami leírja **mi volt a hiba és miért**.

---

## Fizika

### 1. `superheatProps()` — valódi T_sat(P)
A v3.1 a `satProps(T_C).T_C`-t hasonlította `T_C`-hez, ami a **klampolt bemenet** volt,
tehát a feltétel azonosan igaz volt 373,9 °C alatt, és a túlhevítési táblát soha nem
használta. Új `tSatFromP()` (inverz Wagner, bisekció, memoizálva).

```
                      v3.1              v3.2
 T=300 °C, 85,9 bar   2748,9 (sat)      2749,6 (sat, helyesen épp T_sat-on)
 T=370 °C, 85,9 bar   2197,8 (sat!)     3035,4 (SH)
 T=400 °C, 85,9 bar   3126,9            3127,2
```

Következmény a T-s panelen: a szaggatott izobár már **monoton növekvő**,
a legnagyobb lépésköz **1,599 → 0,048 kJ/kgK**.

### 2. Száraz turbinakilépés — új, a v3.1-ben rejtve maradt hiba
Ez az audit során derült ki: amikor `s1' > s_g(T_cond)`, az izentropikus végállapot
**túlhevített gőz**, aminek az entalpiája `h_g` **fölött** van. A v3.1 1-re vágta a
gőznedvességet → `h2s = h_g` → **túlbecsülte a turbinamunkát**.

Ezért maradt 432 eset (a paramétertér 2,7 %-a), ahol η_cl még a helyes Carnot-korlátot
is meghaladta. Alacsony nyomáson a gőz közel ideális gáz, így `cp ≈ 1,95 kJ/kgK`-val
folytatom a dóm fölött, klampolás helyett. A kondenzátor-szakasz a T-s diagramon
most először **lehűl T_cond-ig**, csak utána kondenzál izotermikusan.

### 3. Carnot-referenciák
`1 − T_c/T_sat,kazán` helyett a hőbevitel **entrópikus középhőmérséklete**:

```js
const T_mean = (h1p - h4) / (s1p - s4);
const eta_carnot_mean = 1 - cond.T_K / T_mean;
```

A régi `T_max`-alapú érték is látszik külön mezőben, plusz maga a T̄.
Teljes paramétertér-szkennelés (15 975 pont): **1313 sértés → 0**.

### 4. Szivattyú — entrópia-konzisztens
Csak a **veszteségtag** melegít és termel entrópiát; a reverzibilis `v·Δp` rész
nyomási energia.

```
             v3.1                    v3.2
 ΔT          1,500 °C (mesterséges plafon)   0,371 °C
 Δs          0 (izentropikusnak deklarálva)  0,00495 kJ/kgK
```

### 5. Δη hajtója: κ_turbina, nem κ_peak
A `kap_peak` gyakorlatilag mindig `kap_boil` volt (1,732 vs 1,142), tehát a Δη-t a
kazán **látens hője** skálázta, miközben az egész σ_μ-narratíva a turbina belépőről szól.

Új `KAPPA_DRIVER = 'turbine'` konstans — **egyetlen szó átírásával** (`'peak'`)
visszaállítható a v3.1 viselkedés, ha mégis a globális csúcsot akarod.

> Ez az egyetlen változás, ami **megváltoztatja a modell számait**, nem csak javít.
> Alapbeállításnál Δη 0,18 pp (v3.1: 0,28 pp), recovery 0,17 pp (v3.1: 0,26 pp).

### 6. Gőztáblák regenerálva IAPWS-IF97-ből
- `SAT_TABLE`: 23 → 32 sor. Pótolva a hiányzó 70 °C, és sűrítve a kritikus pont
  körül (365 / 370 / 372 / 373 / 373,5 / 373,9) — a dóm csúcsa már nem hegyes háromszög.
- `SH_TABLE`: 11 → **23 nyomásszint**, minden blokk első kulcsa a **valódi T_sat(P)**
  (a v3.1-ben ezek rossz hőmérsékleten ültek: 40 bar/250 °C valójában komprimált folyadék).

Hatás — η a valódi IAPWS ellen, 12 munkaponton:

| | v3.1 | **v3.2** |
|---|---|---|
| max hiba | 1,00 pp | **0,08 pp** |
| tipikus hiba | 0,2–0,4 pp | **0,01 pp** |
| 200 bar / 600 °C, h | +143,0 kJ/kg | **±0,1** |

Az `IAPWS-IF97` badge innentől megáll a lábán.

---

## Grafika

### 7. Az inlet-panel harmadik sora újra látszik
`viewBox` 165 vs. `H = 170` → a `y = 167,6`-nál lévő sor kilógott. Most `H = 186`,
a keret magassága `H − (py−14) − 8`, és `W` 1200 → **1600**, hogy kitöltse a sávot.

```
 desc 0: y=153,2  ✓        desc 1: y=164,2  ✓        desc 2: y=175,2  ✓   (keret: 4..178)
```

### 8. Torzítás megszüntetve — dinamikus viewBox
Ez rosszabb volt, mint amit az auditban írtam: a panelek **~425×810 px** méretűek,
a viewBox 400×260 volt `preserveAspectRatio="none"`-nal → minden felirat **~3×
függőlegesen nyújtva**. Új `syncVB(id)` a valódi elemméretből számolja a viewBox
arányát render előtt, `xMidYMid meet`-tel. `resize` figyelő is van (debounce 120 ms).

### 9. Komponens-számok újra összeadódnak
A fix 0,05/0,03/0,04 célok eredője 0,0707 ≠ SIG_IDEAL = 0,04 volt → 11,6 % eltérés.
Most arányos zsugorítás (`shrink = SIG_IDEAL / σ_μ`), ami visszaadja az azonosságot:

```
comp0 0,0803 + comp1 0,0357 + comp2 0,0558 = 0,1717 pp
recovery_pp                                = 0,1717 pp     eltérés: 0,0000 %
```

### 10. Egyebek
- κ-panel: `grid()` már megrajzolta az 5 függőlegest — a duplikálás megszűnt.
- η-panel: a két egymást fedő zöld „recovery" felirat egyre csökkentve;
  a Carnot-vonal (ami mindig kilógott felül és sosem rajzolódott ki) most a felső
  élre van rögzítve `↑` jelöléssel.
- T-s: az 1→1' szakasz a **valódi izobárt** követi (a v3.1 húrt használt, mert az
  `isobarSH` hibás volt); a végpontok lineáris varratkeveréssel az egzakt
  állapotpontokra vannak rögzítve.
- T-s: a 0. és 4. szakasz már nem ugyanaz a narancs.
- μ(W): az ideális referenciagörbe az adaptív kerettel együtt skálázódik
  (a v3.1-ben 1,7 % szélességű hajszál volt).

---

## UI / teljesítmény

| | |
|---|---|
| **Preset címkék** | „Old (1980s) σ_μ≈0.30" most tényleg 0,2998 (0,21/0,13/0,17) |
| **„Custom"** | visszaállítja a saját csúszkaértékeidet; a σ-csúszkák mozgatása automatikusan visszaugrik Custom-ra |
| **Holt UI** | a soha meg nem jelenő `ref-compare-box` törölve |
| **Tsh snap** | a 370/step 10 rácsra igazít, nincs több JS↔csúszka szétcsúszás |
| **Animáció** | delta-time (`STEP_MS = 2200`) — 144 Hz-en már nem 2,4× gyorsabb |
| **Számítás** | 6 → **1** ciklus-kiértékelés képkockánként; `tSatFromP` memoizálva |
| **Címkék** | „Pump (isentropic)" → „Pump (η_p …)"; az 1. annotáció végig angol |

Mért teljesítmény: `isobarSH` **0,134 ms**/hívás, `rankine()` ~0,015 ms —
bőven a 16,7 ms-os képkocka-büdzsén belül.

---

## Alapbeállítás: v3.1 → v3.2

| metrika | v3.1 | v3.2 | megjegyzés |
|---|---|---|---|
| η Rankine | 34,50 % | **34,32 %** | IAPWS: 34,32 % |
| η TMF | 34,22 % | 34,12 % | κ_turb hajtja |
| η Carnot | 45,36 % ❌ | **40,46 %** (T̄) / 59,50 % (T_max) | |
| T̄ hőbevitel | — | 253 °C | új |
| W_net | 1113,2 | 1102,6 kJ/kg | |
| x₂' | 0,878 | 0,878 | |
| Megtakarítás | $1,42 M/év | **$0,32 M/év** | +0,50 MW_e ugyanannyi tüzelőanyagból |

---

## Verifikáció

| teszt | eredmény |
|---|---|
| JS szintaxis (`node --check`) | OK |
| HTML tag-egyensúly (div/svg/script/style/body/html) | OK |
| Carnot-sértés 15 975 ponton | **0** |
| komponensösszeg = recovery_pp | eltérés 0,0000 % |
| η vs. IAPWS-IF97, 12 munkapont | max 0,08 pp |
| izobár monotonitás | igaz, max lépés 0,048 kJ/kgK |
| **3840 teljes render** DOM-stubbal (Tb×Tsh×Tc×η_t×σ×5 lépés×2 tick) | 0 hiba, **0 NaN attribútum** |

**Amit nem tudtam ellenőrizni:** valódi böngészős renderelést nem futtattam (nincs
headless Chrome a sandboxban). A 7., 8. és 10. pont geometriai számításon és
DOM-stubon alapul. Nyisd meg egyszer és nézd meg — különösen a viewBox-átállást
(8.), mert az a leginkább vizuális ítélet kérdése; ha túl sok üres margó marad
a paneleken, a `syncVB` egyetlen sorával hangolható.
