# Launch csomag — GitHub, Reddit, YouTube

---

## 1. Pre-flight — ezt a kettőt a poszt előtt

### 1.1 GitHub Pages BE (ez a legfontosabb)

Ellenőriztem: `https://lesliepi.github.io/_TMF_EDU/` jelenleg **404**. Pages nincs
bekapcsolva. Enélkül a Reddit-linked a GitHub **forráskód-nézetére** mutat, nem a
futó szimulátorra — egy 4000 soros HTML-fal. A poszt ezen el fog vérezni az első
percekben, és a Reddit rangsorolása épp az első percek reakcióit súlyozza.

```
Settings → Pages → Source: Deploy from a branch
                 → Branch: main   Folder: / (root)   → Save
```

Egy-két perc múlva élesedik. Utána ellenőrizd, hogy **mindhárom** megnyílik:

- `https://lesliepi.github.io/_TMF_EDU/`
- `https://lesliepi.github.io/_TMF_EDU/TMF_FullChain_Simulator_v17.html`
- `https://lesliepi.github.io/_TMF_EDU/TMF_Rankine_Simulator_v32.html`

A posztba a **landing oldal** linkje menjen (`/_TMF_EDU/`), ne közvetlenül a
HTML-é — így a látogató látja mind a hármat, és a repo linkje is ott van.

### 1.2 Mobil

Megmértem: telefonon a tartalom 826 px széles egy 390 px-es nézetben. A sidebar
elvisz 220-at, a paneleknek 170 marad, a 7–9 px-es feliratok olvashatatlanok, a
fülsor kilóg. Reddit-forgalom jelentős része mobil — aki onnan érkezik, joggal
hinné, hogy el van rontva.

Ezért **betettem egy figyelmeztető réteget** (900 px alatt jelenik meg): elmondja,
hogy ez egy sűrű, fix elrendezésű mérnöki felület, 1200 px fölött a helye, és van
egy „Open it anyway" gomb. Ez nem old meg semmit, csak őszinte — de a különbség
aközött, hogy „rossz" és aközött, hogy „nem ide való", pont ez.

Ha később van kedved hozzá, az igazi megoldás egy reszponzív mód lenne (fülönként
egy panel, összecsukható sidebar). Nem triviális, de nem is nagy meló.

---

## 2. Amit betettem a repóba

Követtem a meglévő konvencióidat (`TMF_<X>_Simulator_v<NN>.html`, `<X>_audit.md`,
`<X>_v<NN>_changelog.md`), a CC BY 4.0 kredit-sort is — a v3.2/v3.3 szövegével
szó szerint egyezően, plusz a licenc-megjegyzés a JS fejlécben.

| Fájl | Mi ez |
|---|---|
| `TMF_FullChain_Simulator_v17.html` | a szimulátor (v1.7 → `v17`, a v32/v33 séma szerint) |
| `FullChain_audit.md` | scope & limitations + teljes feltevés-regiszter |
| `FullChain_v17_changelog.md` | v1.5 → v1.7, minden javítás indoklással |
| `FullChain_verify_v17.js` | futtatható ellenőrző harness |
| `index.html` | harmadik kártya, a konténer 900 → 1120 px |
| `README.md` | új szimulátor leírása + „Found a problem?" szakasz |
| `.gitignore` | `_verify_out/`, `node_modules/` |

Két dolgot eldöntöttem helyetted, szólj ha másképp akarod:

- **Névadás:** `v17` = 1.7, a `v32` = 3.2 mintájára. Nem `v1_7`, mert a repóban
  sehol nincs aláhúzás a verziókban.
- **Nyelv:** az audit angol, nem magyar, mint a `Rankine_audit.md`. Mivel épp
  nemzetközi átnézést kérsz, és a README is angol, ez tűnt logikusnak. Ha
  szeretnéd egységesíteni, szólj — a meglévő auditokat is át tudom fordítani.

### Feltöltés

Két út, válaszd a kényelmesebbet.

**A) git bundle** (a commit üzenettel együtt, ez a tisztább):

```bash
cd <a lokális _TMF_EDU klónod>
git pull                                  # legyen naprakész
git fetch /útvonal/TMF_EDU_fullchain.bundle main:fullchain
git merge fullchain          # vagy: git cherry-pick fullchain
git push origin main
```

**B) zip** — a `TMF_EDU_fullchain_files.zip` kicsomagolása a repo gyökerébe,
felülírva az `index.html`-t és a `README.md`-t, majd:

```bash
git add -A && git commit -m "Add Full Chain Analyser v1.7" && git push
```

---

## 3. Reddit poszt

### 3.1 Először: a szabályok

Nem tudtam lekérni az r/MechanicalEngineering szabályzatát — a Reddit 403-mal
utasította el a kérést, a keresés meg csak SEO-szemetet adott vissza. **Nézd meg
te a sidebaron**, mielőtt posztolsz. Amire figyelj: sok mérnöki sub korlátozza a
saját projekt megosztását, néhol kötelező flair, néhol mod-jóváhagyás kell.
Általános tapasztalat, hogy a „a lényeg a poszt törzsében van, a link csak
hivatkozás" formátum jóval ritkábban akad fenn, mint a puszta linkdobás — a lenti
verzió eleve így épül.

Ha mégis elutasítanák: r/engineering, r/thermodynamics, r/SideProject, illetve
Hacker News „Show HN" mind reális alternatíva ugyanennek a szövegnek.

### 3.2 Mi jó a te draftodban

Ne dobd ki, a magja erős:

- „I've spent years in the field, from chemical and food machinery to automotive
  plants" — konkrét, hiteles, nem hivalkodó.
- „I am an engineer, not a theoretical physicist" — pont a megfelelő regiszter.
- „tear my code apart" — ezen a subon ez működik, ez a poszt legjobb sora.
- Zero-dependency single HTML file — valódi horog, tartsd meg elöl.

### 3.3 Mi kockázatos benne

**a) „map these cycles as topological manifolds"** — ez a legvalószínűbb támadási
pont. Mérnök-közönség allergiás a nem megszolgált absztrakcióra, és ez a mondat
az első bekezdésben van, mielőtt bármi konkrétat mutattál volna. Nem azt mondom,
hogy vedd ki — azt, hogy **jöjjön utána**, és hipotézisként legyen felcímkézve,
ne leírásként.

**b) Hiányzik a legerősebb ütőkártyád.** Sehol nincs benne, hogy minden konstans
`[PROVEN]` / `[NUMERICAL]` / `[CONJECTURE]` jelölést kapott. Ez pont az a dolog,
ami a „hol a validáció?" kérdést — ami *biztosan* jönni fog — megelőzi, sőt
átfordítja hitelességgé. Ez legyen benne.

**c) Hiányoznak a számok.** „13 316 ciklusállapotra 0 Carnot-sértés" konkrét,
ellenőrizhető állítás. Ezen a subon ez többet ér, mint három bekezdés jelző.

**d) Nincs benne, hogy mi *nem*.** Ha te mondod ki elsőnek, hogy nincs valós
üzemi méréshez hitelesítve, nincs tranziens, nincs újrahevítés/regeneráció —
akkor az őszinteség. Ha más mondja ki elsőnek, akkor lebukás. Ugyanaz a mondat.

**e) A cím hosszú** (~183 karakter). Nem szabálysértés, csak feed-en levágódik.

### 3.4 Javasolt cím — három változat

1. *(a tiédhez legközelebb)*
   **Looking at the Rankine cycle from a different angle — a single-file simulator that tracks entropy and where the efficiency actually bleeds out. Tear my code apart.**

2. *(a hitelesség elöl)*
   **I built a zero-dependency thermodynamic plant simulator (combustion → generator, IAPWS-IF97). Every constant is tagged [PROVEN]/[NUMERICAL]/[CONJECTURE]. Please attack the conjectures.**

3. *(a legrövidebb, legmagabiztosabb)*
   **Single HTML file, no dependencies: full biomass plant chain with real steam tables. I've listed my own weakest assumptions — go for them.**

A 2-est ajánlom. Az epistemic tagging a differenciátorod, és a cím az egyetlen
hely, ahol garantáltan mindenki elolvassa.

### 3.5 Javasolt törzs

> Hey everyone,
>
> **Live demo:** https://lesliepi.github.io/_TMF_EDU/ · **Source:** https://github.com/LesliePi/_TMF_EDU
> *(Desktop, please — it's a dense dashboard and it does not reflow to phone widths.)*
>
> I've spent years in the field, from chemical and food machinery to automotive
> plants, and I always felt that while traditional thermodynamics is rock solid,
> it's hard to *see* where the systemic bottlenecks are and where the efficiency
> actually bleeds out.
>
> So I built a tool. It's a zero-dependency single HTML file — no install, no
> build step, works offline, view-source is the whole thing. It runs the full
> chain from combustion heat release through boiler, Rankine turbine and
> generator to electrical output, on real IAPWS-IF97 property tables
> (30-point saturation table + Wagner, superheated steam 1–200 bar), and tracks
> inhomogeneity (σ_μ) and impedance mismatch along the way.
>
> **The part I actually want you to hit.** Every constant in the source carries
> one of three tags:
>
> - `[PROVEN]` — standard physics or published tabulated data
> - `[NUMERICAL]` — an engineering estimate; plausible, not derived
> - `[CONJECTURE]` — part of the framework hypothesis, not established
>
> The core claim — that efficiency loss scales with the variance of the state
> distribution — is a `[CONJECTURE]`. The tool doesn't validate it; it *assumes*
> it and shows you the consequences. I'd rather say that up front than have
> someone find it in the source.
>
> **What is verified**, and you can re-run it (`node FullChain_verify_v17.js`):
> a 13,316-case sweep across boiler/superheat/condenser temperature and turbine
> efficiency finds **zero Carnot-bound violations** — using the entropic mean
> temperature of heat addition as the reference, not T_sat, because T_sat isn't
> an upper bound once you superheat. Cycle closure is exact. Property tables
> match published IAPWS values to the last digit I can check
> (h(100 bar, 500 °C) = 3375.1 kJ/kg, P_sat(300 °C) = 85.88 bar).
>
> **What it is not:** not a design or sizing tool — no component is dimensioned.
> Not transient — everything is steady state. No reheat, no regeneration, no
> pressure drop anywhere. And **it has never been checked against a real plant.**
> There's a full Scope & Limitations section in `FullChain_audit.md`, including a
> ranked list of where I think my own weakest assumptions are — start there if
> you want the fastest route to something broken.
>
> I'm an engineer, not a theoretical physicist. I'm still learning to perfect
> this formalism, but the real-time visual feedback on efficiency loss turned out
> too useful to sit on alone.
>
> Play with the sliders — the LIVE ANIMATION and CHAOS K tabs are the ones people
> seem to react to. And please: tear my code and my math apart. I want to know
> where it breaks so it can be fixed.

### 3.6 Előre megírt válaszok a biztosan jövő kérdésekre

**„Mivel validáltad?"**
> Property layer against published IAPWS-IF97 values, and the cycle against its
> own physical bounds (Carnot, second law, energy closure) — the sweep is in the
> repo and runnable. Against a real plant: nothing, and I say so in the audit.
> If you have measured data from a small biomass Rankine unit I'd genuinely like
> to see how far off it is.

**„Ez csak egy Rankine-kalkulátor sok színnel."**
> Fair for tabs 1–5, that part is textbook thermodynamics done carefully. The
> part that isn't standard is the σ_μ layer and the impedance/acoustic module —
> and that's exactly the part I've tagged as conjecture.

**„Mi az a manifold ebben?"**
> The framing is that the state isn't a point but a distribution on a constrained
> state space, and that the spread of that distribution — not just its mean —
> costs you efficiency. In the tool that's σ_μ. Whether the framing earns its
> keep is an open question; I'd rather argue about it with numbers on screen.

**„A 0.15-ös érzékenységi konstansod hasból van."**
> Yes. `KAPPA_SENS = 0.15`, tagged `[CONJECTURE]`, and it's the first item on my
> own list of weakest points. If you have an idea how to pin it independently,
> that's the most useful thing anyone could give me.

---

## 4. YouTube

Amit a bemutatásról kaptál, jó — a 6. fül → csúszka → 9. fül sorrend helyes.
Alább egy konkrét felvételi lista rá építve.

### Beállítás felvétel előtt

- Böngésző **1920×1080**, teljes képernyő (F11), zoom 100 %. A felület 8 px-es
  feliratokat használ; 1080p-nél ez a határeset, 1440p-ben rögzítve szebb.
- Előtte `↺ RESET`, hogy alapállapotból indulj.
- A hangban ne mondj olyat, amit a repo nem állít. Konkrétan: **ne** mondd, hogy
  „ez megmondja a hatásfokot", mondd, hogy „ez megmutatja, hogyan mozdul a
  hatásfok, ha ezt elrontod".

### Vágóterv (~6–7 perc)

| Idő | Kép | Amit mondasz |
|---|---|---|
| 0:00–0:15 | **Hidegindítás**: 6. fül, animáció fut, T-s + Sankey mozog. Semmi beszéd, csak a kép | — |
| 0:15–0:45 | Ugyanez, ráúszik a hangod | Ki vagy, mi a probléma: „a termodinamika stabil, de nem látod, *hol* folyik el a hatásfok" |
| 0:45–1:30 | Végigmutatod a 4 panelt a 6. fülön | Mit látunk: ciklus a T-s síkon, energiaáram, a μ(W) eloszlás szélessége, gőzállapot a kazánban |
| 1:30–2:30 | **Az akció.** 1. fülre váltasz, `Moisture` csúszka 15 % → 40 % | „Nedves tüzelőanyag." Mutasd, ahogy T_flame és η_comb esik, aztán 5. fül: az egész lánc lejjebb megy |
| 2:30–3:15 | Vissza 3. fülre, `T_cond` 45 → 80 °C | „A kondenzátor a legalulértékeltebb alkatrész." x₂ és η_Carnot(T̄) reakciója |
| 3:15–4:15 | **9. CHAOS K fül**, `▶ LIVE` | A műszer, a sávok, a piros zóna. Itt magyarázd a K-t köznyelven: „mennyire feszül a rendszer", tenzormatek nélkül |
| 4:15–5:00 | 7. IMPEDANCE fül, `N` csúszka 4 → 8, Murray | A legjobb egyetlen demód: N=8-nál R = −0.333 **és** 2:1 oktáv-záródás → RI ugrik HIGH-ra. Egy szám, ami magától összeáll |
| 5:00–5:45 | Forráskód a képernyőn, végiggörgetve a `[PROVEN]` / `[NUMERICAL]` / `[CONJECTURE]` jelöléseken | Ez a videó erkölcsi magja. „Megmondom, mit tudok és mit tippelek" |
| 5:45–6:30 | `FullChain_audit.md` §5, a rangsorolt gyenge pontok listája | „Itt a saját listám arról, hol tartom a leggyengébbnek. Kezdd itt" |
| 6:30–6:50 | Landing oldal, link a leírásban | Felhívás: issue, e-mail, Reddit-szál |

### Amit a videóban kerülj

- Ne animáld a Chaos Barometert úgy, mintha valós idejű gépi mérés lenne — ez
  ugyanannak az állandósult állapotnak az ismételt kiértékelése, nem idősor.
  Egy mondat elég: „ez nem szenzoradat, ez a modell válasza".
- A 8. OTDD fület inkább hagyd ki, vagy mondd meg, hogy illusztráció. Az operátor
  formalizmus nincs implementálva, és pont ez az a fül, amiről egy figyelmes néző
  ki tudja szúrni, hogy a látvány többet ígér, mint amit a kód csinál.

### Cím és leírás

Cím: **„Where does a power plant actually lose its efficiency? I built a simulator to watch it happen"**
— működik laikusnak és mérnöknek is, és nem ígér validációt.

A leírás első három sorába: élő demó link, GitHub link, és az egy mondat, hogy
egyetlen HTML fájl, nincs telepítés.
