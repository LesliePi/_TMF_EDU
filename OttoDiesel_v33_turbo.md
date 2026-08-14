# v3.3 — Feltöltés és töltőlevegő-hűtés

**`TMF_OttoDiesel_Simulator_v33.html`**. A v3.2 fizikája változatlan, csak most a
szívóoldal is modellezve van: **ambiens → kompresszor → töltőlevegő-hűtő → szívócső**.

Alapállapotban a töltés 100 kPa (szívómotor), tehát minden szám pontosan a v3.2-é marad.

---

## Mi került bele

**Kompresszor.** Nyomásarányos izentropikus folyamat, változó fajhővel. Fontos részlet:
nyomásarányhoz **s°(T) = ∫c_p/T dT** kell, nem a φ = ∫c_v/T dT — a kettő pontosan
R·ln T-vel tér el, tehát ψ(T) = φ(T) + R·ln T az entrópiafüggvény. Utána izentropikus
hatásfok az **entalpián**, nem a hőmérsékleten:

```
h_ki = h_be + [h(T_s) − h_be] / η_c
```

Ellenőrzés állandó γ = 1,400-as izentropikus ellen: PR = 1,4-nél −0,2 K, PR = 3,0-nál
−1,4 K eltérés. A tábla kicsit alacsonyabbat ad, mert γ már 400 K körül 1,395 alá esik —
ez helyes, nem hiba.

**Töltőlevegő-hűtő.** `T_szívó = T_komp − ε·(T_komp − T_hűtőközeg)`. A kapcsoló most azt
állítja, **mi a hűtőközeg**: „→ AMBIENT" a hagyományos levegő-levegő hűtő, „→ CHILLER ❄"
a környezeti alá hűtő. Szívómotoron (100 kPa) T_komp = T_ambiens, tehát a viselkedés
visszafelé kompatibilis.

**Kondenzáció töltés alatt.** A vízgőz parciális nyomása a töltéssel arányosan nő, tehát a
telítési **mólarány** pSat/P_boost — vagyis **a feltöltés önmagában is kicsapatja a vizet**.
Ezért gyűlik kondenzátum a turbós töltőcsövekben. A `Charge T` mező ciánra vált, amikor a
hűtő kondenzál.

**Gázcsere-veszteség.** PMEP = P_szívó·(EXH_RATIO − 1), EXH_RATIO = 1,08 `[NUMERICAL]`.
Új metrika: `η net (pumping)`.

**Teljesítmény-metrika.** `Power vs NA`: a nettó ciklusmunka ugyanahhoz a motorhoz képest
szívó üzemben, ambiens levegőn. Ez az, ami a feltöltésnél igazán számít — a hatásfok alig
mozdul, a teljesítmény viszont sokat.

---

## A benzinmotoros tanulság

180 kPa töltés, r = 10, 35 °C ambiens:

| | szívócső T | r_knock | teljesítmény vs NA |
|---|---|---|---|
| **nincs hűtő** (ε = 0) | 112 °C | **5,8** ⚠ | +41,8 % |
| CAC → ambiens (ε = 0,7) | 58 °C | 8,6 | +66,6 % |
| chiller 293 K (ε = 0,7) | 48 °C | 9,3 | +72,4 % |

Hűtő nélkül a kopogási határ **5,8-ra esik** — r = 10-en semmilyen valódi motor nem
üzemelne. **Nem a töltés adja a teljesítményt, hanem a töltés + a hűtés együtt:** a hűtő
önmagában +25 százalékpontot tesz hozzá, mert nélküle vissza kellene venni a
kompresszióviszonyt vagy a töltést.

---

## A kamionos eset — amiről írtál

250 kPa töltésű dízel, r = 18. Végigfuttattam a hűtő hatásfokán:

| ε | szívócső T | **T₃** | teljesítmény vs NA | η | töltetsűrűség |
|---|---|---|---|---|---|
| 0,00 | 161 °C | 2635 K | +79,1 % | 54,03 % | 0,570 |
| 0,30 | 123 °C | 2555 K | +95,9 % | 53,91 % | 0,624 |
| 0,50 | 98 °C | 2501 K | +108,9 % | 53,80 % | 0,667 |
| 0,70 | 73 °C | **2446 K** | +123,7 % | 53,65 % | 0,715 |
| 0,90 | 48 °C | **2391 K** | +140,6 % | 53,46 % | 0,772 |

Vagyis ε 0 → 0,9 mellett **T₃ 244 K-nel esik** és a teljesítmény **34 %-kal nő**. Ez
pontosan az, amit írtál — és jól látszik, miért hordanak a nehéz-dízelek akkora
töltőlevegő-hűtőt: a NO_x képződés exponenciálisan függ a csúcshőmérséklettől
(Zeldovich-mechanizmus), tehát 244 K nem finomhangolás, hanem nagyságrend.

**Egy ellentmondásosnak tűnő részlet, ami valójában helyes:** a hűtéssel a *hatásfok
kicsit csökken* (54,03 → 53,46 %). Ok: a hőbevitel kg levegőre rögzített, hidegebb töltet
→ több tömeg → több összes tüzelőanyag → nagyobb r_c → a dízel hatásfoka pedig r_c-vel
csökken. A valóságban ezt bőven visszahozza, hogy hűvösebb töltettel kevesebb EGR kell és
korábbra lehet vinni a befecskendezést — de az már a kalibráció, nem a ciklus.

---

## Ellenőrzés

| teszt | eredmény |
|---|---|
| kompresszor vs állandó-γ izentropikus | −0,2 … −1,4 K, a helyes irányban |
| rajzolt P–V terület vs `m(q_in − q_out)`, 24 munkapont töltéssel | max **0,062 %** |
| Carnot-korlát, **3564 pont** (mód × r × T₁ × RH × Q × töltés × ε) | **0 sértés** |
| **17 820 teljes render** DOM-stubbal | **0 hiba, 0 NaN** |
| minden `getElementById` cél létezik | OK |
| HTML tag-egyensúly (82/82 div, 4/4 svg) | OK |
| teljes render (4 panel + metrikák) | **0,52 ms/képkocka** — 32× ráhagyás |

---

## Amit tudatosan nem tettem bele

- **A turbina.** A kompresszormunkát a kipufogóenergia fedezi, ezért nem vonom le a
  főtengelyről — csak a visszanyomás jelenik meg gázcsere-veszteségként. Ha
  kompresszormotort (mechanikus feltöltés) akarsz modellezni, ott a `w_c` **direktben**
  levonandó; a mező már ki van írva, egy sorral bekapcsolható.
- **A kopogás nyomásfüggése.** A kritérium tisztán hőmérséklet-alapú (T₂ vs 750 K).
  Valójában az öngyulladási késleltetés nyomásfüggő is, tehát töltésen a modell egy
  kicsit **optimista**. Ez `[NUMERICAL]`-ként jelölve van.
- **NO_x számítás.** T₃ ki van írva mint hajtóerő, de Zeldovich-kinetikát nem futtatok.
  Ha oktatáshoz kell, egy egyszerű `exp(−E/RT₃)` arányossági mutató beépíthető.

Böngészőt itt sem tudtam futtatni — az új szekció elrendezését érdemes ránézésre
ellenőrizned, mert két új csúszkasor került a bal oldalsávba.
