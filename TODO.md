# TODO — Stride

Nápady a vylepšenia na premyslenie. Legenda námahy: **S** = malé, **M** = stredné, **L** = veľké. 🔥 = odporúčané (dobrý pomer hodnota/námaha).

## Roadmap (poradie implementácie)

1. [ ] **Zmazať účet + dáta** (S) — zmazať všetky úlohy/kategórie + účet, s potvrdením.
2. [ ] **Opakujúce sa úlohy — jednoduché** (M) — pole `repeat` na úlohe: **None / Daily / Weekly / Monthly**. Pri označení úlohy ako **hotovej** sa automaticky vytvorí nový task o interval ďalej (+1 deň / +7 dní / +1 mesiac). DB = **jeden stĺpec `repeat`**, nič viac.
   - ⛔ ZÁMERNE NEROBIŤ: `series_id`, generovanie výskytov dopredu, „zmazať tento výskyt / celú sériu", „upraviť tento / všetky". To je kalendárová nočná mora — držať sa „spawn next on complete".
3. [ ] **Overdue úlohy** (M) — sekcia hore na Domove „Overdue (N)" s nedokončenými úlohami spred dneška + akcie (hotovo / posunúť na dnes / zmazať). Treba ťahať nedokončené aj mimo aktuálneho týždňa.
4. [ ] **Týždenný cieľ** (S) — cieľ X úloh/týždeň + progres (localStorage, bez DB).
5. [ ] **Export JSON** (S) — stiahnuť zálohu úloh (a kategórií) do JSON.
6. [ ] **Filter „len hotové" / archív** (S) — prepínač zobraziť len dokončené.

Potom (nižšia priorita):

7. [ ] **Preradenie poradia kategórií** (S) — `categories.position` + drag (potrebuje migráciu).
8. [ ] **Haptika** (S) — vibrácia pri akcii (Android cez Vibration API; iOS Safari nepodporuje).
9. [ ] **Filter podľa viacerých kategórií naraz** (S).
10. [ ] **Import JSON** (S–M) — obnova zo zálohy.

## Polish (leštenie pred „launchom")
- [ ] **Jemné animácie** (S) — rozšíriť o plynulý expand úlohy (edit form sa roztvorí, nie skok) + prechod do Settings (fade/slide route transition); jednotných 150–200 ms. (Základ — checkbox pop, prečiarknutie, press, „Späť" riadok — už hotový.)

## Veľké / neskôr (L)
- [ ] **Pripomienky / push notifikácie** — „nezabudni na úlohu" (potrebuje riešenie pre push).
- [ ] **Offline-first** — IndexedDB + sync (CLAUDE.md to vedome odkladá).

## Pred ostrým nasadením (technické)
- [ ] **Hosting** (Vercel / Cloudflare Pages / Netlify) + SPA rewrite config + env premenné.
- [ ] Pri nasadení pridať produkčnú doménu do **Supabase → Auth → URL Configuration**.
- [ ] Zvážiť vypnutie „Confirm email" alebo vlastné SMTP (default email má prísne limity).

## Pred launchom (produkt / právne / marketing)
- [ ] **Privacy Policy** (S) — nutná, keď zbieraš email + úlohy. Nemusí byť zložitá. *(netreba kód — len text na statickej stránke, route `/privacy` + odkaz v Settings.)*
- [ ] **Terms of Service** (S) — krátke; aby appka pôsobila ako reálny produkt. *(rovnako: route `/terms` + odkaz v Settings.)*
- [ ] **Kontaktný email** (S) — napr. `hello@strideapp.xyz` / `support@…`.
- [ ] **Favicon + social preview / Open Graph** (S) — pri zdieľaní linku sa ukáže logo + názov + popis. Veľa indie appiek na to zabudne. *(lacné, viem spraviť rýchlo.)*
- [ ] **Analytics** (S) — aspoň niečo: koľko prišlo / zaregistrovalo sa / vrátilo sa. *(Plausible = najjednoduchší, 1 script tag, GDPR-friendly.)*
- [ ] **Feedback button** (S) — v Settings „Send feedback" → `mailto:`. Lacné a brutálne užitočné. *(pokojne pribaliť k niektorému Settings commitu.)*

## Nice to have (marketing)
- [ ] **Demo účet** (S) — „Try demo" bez registrácie (demo mód už existuje v dev — sprístupniť aj v prod). Super pre marketing videá.
- [ ] **Landing page** (M) — jednoduchá: „Stride — simple weekly planner", [Get Started], pár screenshotov. Nie 20 sekcií.

---

## Hotovo
- [x] Animácie — checkbox pop + plynulé vyfarbenie, animované prečiarknutie textu, press efekt na tlačidlách, vsunutie „Späť" riadku; pod `prefers-reduced-motion`.
- [x] Trend completion % v čase — prepínač Počet ↔ % v hlavičke grafu (rovnaké obdobia), hodnoty nad stĺpcami.
- [x] Priorita / vlajka — klikateľná vlajka v riadku (sivá = bežná, červená = dôležitá), prepína sa priamo; `priority` bool stĺpec.
- [x] PWA PNG ikony — pwa-192/512 + maskable-512 v `public/`, zapojené do manifestu (`vite.config.ts`) + apple-touch-icon v `index.html`.
- [x] Swipe na úlohe (mobil) — → hotovo/nehotovo, ← zmazať (prah 80px, farebný podklad, nekoliduje s prepínaním týždňov).
- [x] Undo po zmazaní — inline riadok „Späť" (~5 s) na mieste zmazanej úlohy (swipe aj tlačidlo Delete); vráti úlohu vrátane poradia.
- [x] Čas úlohy — voliteľný čas dňa (hodina:minúta select, 24h) + odhad trvania (15m–12h); riadok ukazuje „14:00 · 2h", zoradenie podľa času.
- [x] Color picker pre kategóriu — vlastná farba (natívny `color` input s kvapkadlom) popri preset palete.
- [x] Štatistiky — heatmapa aktivity (GitHub-style) + insight podľa obdobia (najsilnejší deň/týždeň/mesiac).
- [x] Poznámka k úlohe — textarea v úprave, zobrazená pod názvom.
- [x] Prehadzovanie poradia (drag & drop, `position`) + presun úlohy na iný deň.
- [x] Potvrdenie pred zmazaním (kategórie aj úlohy) + add form sa po pridaní zatvorí.
- [x] Prázdne stavy (filter bez úloh, žiadne dáta v grafe, prázdne kategórie).
- [x] Kalendár — „Dnes" v ročnom zobrazení skočí na aktuálny mesiac.
- [x] Účet / Nastavenia stránka — email, jazyk, téma (Systém/Svetlý/Tmavý), kategórie, zmena hesla, odhlásenie.
- [x] Manuálny prepínač svetlý/tmavý režim (`data-theme` + localStorage) + dark date-picker (`color-scheme`).
- [x] Viacjazyčnosť (i18n) — EN/SK, predvolene EN, lokalizované dátumy, voľba v localStorage.
- [x] Auth — email/heslo, registrácia, reset hesla, Google OAuth (funguje aj naživo).
- [x] Apple-clean redesign (Domov, Kalendár, Štatistiky, jednotná hlavička, branding Stride).
- [x] Kalendár — mesiac + rok + day-detail sheet.
- [x] Štatistiky — metriky, streaky, graf podľa obdobia, rozpad podľa kategórie (vrátane „Bez kategórie").
- [x] Kategórie — CRUD + farby, filter, tvorba pri pridávaní úlohy, horizontálny scroll.
- [x] Úprava úlohy (premenovať / kategória / poznámka / presun / zmazať).
- [x] Širší layout na webe.
