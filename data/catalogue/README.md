# Bihor catalogue sources

## Live catalogue fact check — 1–2 November 2026

This review supersedes the inventory and unresolved-record counts below. The complete live inventory was exported before changes; field-level corrections, excluded public rows, original values and sources are recorded in `audit-2026-11-01.json`. The applied correction is `supabase/seed/016_catalogue_fact_check.sql`. Earlier numbered example seeds are historical inputs, not current verification evidence; do not replay them independently as a verified catalogue.

- All 47 Ministry school identities and all 192 current admission options were compared against fresh `highschool.json` and `specialization.json` downloads. The saved Ministry snapshots are unchanged. Codes, parents, languages, bilingual/dual variants, pathways, study forms, seats and both historical averages match the live database. The nine missing 2026 averages remain missing.
- All eight subject groups were checked against the cited 158-page OMEC 4152/2026 PDF. Page 49 uses **Disciplină socio-umană**; the builder, manifest, seed and live rows now use that exact label. These remain selected study subjects, not entrance requirements or full timetables.
- The sports school **Liceul cu Program Sportiv „Bihorul”** is retained and sourced to the inspectorate network, despite being absent from computerized allocation. Its address is Strada Matei Basarab nr. 4. **Victor Jinga** is a real technological school in **Săcele, Brașov**, as ARACIP confirms; its existing UUID was retained and its false Săcueni/Bihor location corrected.
- Six unsupported Bihor name/locality records were removed from publication: Colegiul Tehnic „Aurel Lazăr” in Săcueni, Colegiul Tehnic „Horea, Crișan și Cloșca” in Sântandrei, Liceul Tehnic Agricol „Emil Racoviță”, Liceul Tehnic de Industrie Alimentară, Liceul Tehnic de Transporturi and Liceul Tehnic Energetic in Oradea. The inspectorate state/private network and Ministry report do not substantiate these exact current identities. This is not a claim that similarly named historical institutions never existed. Original rows and exclusion reasons remain in the audit.
- School descriptions now contain only the sourced identity/locality and report scope. Unsupported exam aggregates, staffing counts, directors, superlatives and historical claims were removed. Iosif Vulcan's own current announcement says its secretariat **returned to Jean Calvin nr. 3**; the old Decebal relocation notice was replaced.
- The real **Universitatea din Oradea** is retained; its description no longer claims an unsupported ranking. Its official programme list and 2026 admission guide support **16 distinct retained degree programmes**. Twenty bad programme rows were removed: 14 faculty names misrepresented as degrees and six duplicates. Architecture is **6 years**, General Nursing **4 years**, and Automation **4 years**. Field names such as Inginerie civilă and Fizică were corrected to the actual programme titles, with the official English-language business-administration variant made explicit.
- Eleven learning-resource records were reviewed. **Six are published**, with exact provider/title, canonical URL, teaching language and conservative full-access pricing. Coursera enrolment/trials and DataCamp's free first chapter are not advertised as complete free courses. Figma and Khan Academy libraries are labelled as resources/libraries. Four unsubstantiated records were removed; the fifth, an unverified Udemy JavaScript record with an existing bookmark, was **archived without deleting that bookmark**. The new `courses.is_current` restrictive SELECT policy hides it from direct client reads and catalogue search, and the private recommendation projection filters it explicitly.
- Ten career descriptions now have specific official National Careers Service sources for **generic duties only**. No UK salaries, qualifications or professional-entry rules were imported into Romanian guidance. The 17 skill labels/categories and existing numeric skill weights remain **editorial product vocabulary/heuristics**, not certified competencies or validated occupational requirements. No programme-career or programme-skill links were invented.

Current inventory: **48 Bihor schools**, plus the real Bolyai/Mureș and Victor Jinga/Brașov records; **192 current and five archived high-school profiles; one university; 16 degree programmes; six published and one archived learning resources; 10 careers; 17 skill labels**.

Verification: `python scripts/verify-catalogue-audit.py --snapshot .preview-ui/catalogue-audit-2026-11-01-after.json` checks the live public-data export against the reviewed manifest. Executed `supabase/tests/catalogue_fact_check.sql` covers authenticated/anonymous archive visibility, catalogue search, recommendation projection and client publication denial inside rollback transactions. An account-row fingerprint comparison across all 11 public account/profile tables confirmed unchanged contents. Authenticated app-shaped school/profile, programme and course queries passed. Fresh checks passed: **87 Jest suites / 525 tests**, Expo lint and TypeScript. This is data/API verification; this pass did not perform a new physical-phone walkthrough.

Remaining limits: two multi-site Bihor schools still have no selected campus address; 35 Bihor website fields remain empty; exact Google Maps pins were not certified. Those gaps remain explicit instead of guessed. Catalogue coverage is a verified subset, not a complete census of every vocational/private institution or every Oradea degree. Provider prices and offers can change. Existing app caches may retain earlier rows until refetched or a fresh launch.

The staged deletion of root `DATA_TODO.md` was preserved; current gaps are tracked here instead of restoring that staged file.

## Earlier review — 24 October 2026

Reviewed on 2026-10-24. These files contain institution-level public data only; no candidate records were downloaded.

## Source roles

- https://www.admitereliceu.ro/institutii/county/BH is useful for discovery and cross-checking. Its 2026 offer page labels comparison averages **MA 2025**, and warns that some specializations are interpreted/reorganized. It is not the authority for current cutoffs.
- https://static.admitere.edu.ro/2026/repartizare/BH/index.html is the Ministry's Bihor computerized-allocation report. Its own navigation loads `data/highschool.json` and `data/specialization.json`; the two saved snapshots retain those URLs, the year and verification date.
- https://static.bacalaureat.edu.ro/2026/ concerns the separate Bacalaureat examination. It can support future session-specific school outcome statistics, but does not establish high-school admission requirements. No BAC statistics were imported.

## Applied school import

`supabase/seed/013_bihor_2026_schools.sql` was applied to the configured database: 24 inserted institutions and 23 reconciled existing identities, covering all 47 schools in this allocation dataset. Existing IDs, descriptions and websites were preserved. Only institution name, city, county and identity source were verified by this import; existing descriptions/websites still need individual review.

The reconciliation file records official school identifiers, application IDs, changes and the nine unmatched older entries. `bihor-existing-review.json` is the pre-import audit snapshot, **not a verified seed**. Matching used normalized full names and localities, with explicit mappings for the Unirea and Constantin Brâncuși institution-type corrections. No substring/fuzzy matching was used. Octavian Goga's locality was corrected from Oradea to Marghita.

The seed is idempotent by application ID and contains no deletes. The nine unmatched older entries remain in the database; absence from computerized allocation alone does not prove closure or invalidity. Thus the initial import produced 56 Bihor school records, of which 47 were reconciled against this source. A subsequent location audit (below) corrected one legacy record to Mureș, leaving 55 in Bihor. This is not a complete census of vocational, private or special education institutions.

## Admission options integrated — 2026-10-24

The specialization snapshot contains 192 options with 192 distinct codes and valid school references. Preserve these source keys:

- `lc`: official school identifier; `c`: admission option code (keep strings).
- `sp`: specialization; `p`: profile; `f`: educational pathway; `fi`: study format.
- `lp`: teaching language; `lb`: bilingual language; `d`: dual flag.
- `nlt`: total seats; `nlo`: occupied seats at the reported allocation stage.
- `um`: last allocated average in **2026**; `uma`: comparison average in **2025**.

Missing averages are represented by null, empty strings or `-`; never convert them to zero. Nine options have no 2026 allocated average. These averages are historical allocation results, not guaranteed future thresholds. Seats and occupancy are a snapshot, not a claim of currently available places.

Migration `20261024115911_structured_school_admissions.sql` adds structured year/code/language/bilingual/dual, seats, historical averages and curriculum provenance fields. Applied seed `015_bihor_2026_admissions.sql` imports **192 current options across 47 schools**. Nine unambiguously matched legacy IDs are retained; five unmatched broad older profiles are archived with `is_current=false`, not deleted. The pre-import public profile snapshot is saved in `bihor-profiles-before-import.json`. Existing institution/path IDs are unchanged.

`scripts/build-bihor-admissions.py` reproducibly generates the normalized manifest and seed from the saved Ministry snapshots. The school detail now displays these options in-app; opening one shows its admission facts and important subjects. Explore hides archived entries and distinguishes language variants. Unknown school offers show an explicit unavailable state. Sources opened by the app are readable report pages, not raw JSON files.

Subject groups come from the official OMEC 4152/2026 national curriculum tables: https://rocnee.eu/images/rocnee/fisiere/planuri-cadru/OMEC%20nr.%204152_2026_modificare%20planuri%20-cadru_MOf.nr.%20565Bis_opt.pdf (pages 43, 46, 49, 53, 57, 60, 63 and 66). The manifest records each group and PDF page. These are selected study subjects/categories, not entrance-exam requirements, a full institution timetable, or verified specialization-specific technical modules. Bilingual/minority-language variants can differ; this limitation is shown in-app. Websites, coordinates, descriptions, universities and deadlines still require separate verification.

## Verification

Checked 47 unique school IDs, 192 unique option codes, complete parent references, BH county consistency, occupied seats not exceeding total seats, and numeric averages within 1–10 when present. Post-import SQL confirms 192 current profiles, 47 parents, five archived profiles, nine missing 2026 averages and no missing subject/source fields. All imported identities, codes, years, averages, seats and curriculum groups were compared against the generated manifest. An anonymous Data API query confirmed the real school-detail join returns Gojdu's four language/profile variants and structured facts. Mobile UI behavior has regression coverage; physical-phone rendering remains unverified.

## Website and Maps audit — 2026-10-24

The configured school websites were checked for reachability **and institution identity** against official pages. Five incorrect/nonresolving saved domains were replaced:

- Iosif Vulcan: `www.cnvulcan.ro` → https://www.cnivor.ro/
- Onisifor Ghibu: `www.cneghibu.ro` → https://ghibuoradea.ro/
- Samuil Vulcan: `www.cnsvulcan.ro` → https://www.cnsvbeius.ro/
- Ioan Ciordaș: `www.ctciordas.ro` → https://www.ciordas.ro/
- Nicolae Bolcaș: `www.lvnicolaebolcas.ro` → https://nbolcas.ro/

All replacement homepages returned HTTP 200 during the audit. A verified previously missing link was added for Teodor Neș: https://cnteodornes.ro/. Field-specific website provenance is now stored separately from institution identity provenance. The HTTP audit file alone is not evidence that an institution identity matches; the location review records the reviewed sources.

The Bolyai Farkas record linked to a real institution in **Târgu Mureș, Mureș**, despite claiming Oradea/Bihor. ARACIP confirms its main address as Strada Bolyai 3: https://aracip.eu/detalii-unitate-de-invatamant/218459. The existing ID was retained, city/county and erroneous description corrected. Its old Bihor Maps search returned Lucian Blaga results; the corrected search resolves to Bolyai Farkas in Târgu Mureș. Eight other unmatched legacy Bihor identities remain unresolved.

The applied migration `20261024112514_verified_institution_locations.sql` adds nullable street address, address evidence, location note and website evidence fields to schools, preserving existing access policies. Seed `014_verified_school_locations.sql` then adds **45 Bihor street addresses**, plus Bolyai's corrected address. For multi-site schools, the high-school campus is used only where the source identifies it. Vadu Crișului and Livia Maria Gego/Dobrești remain without a selected street address because the registry lists multiple sites without a clear campus assignment.

The mobile detail page shows the street address and any location note above the map. Both preview and external Maps link receive the same name/street/city/county search. Iosif Vulcan keeps its main campus at Jean Calvin 3 while explicitly warning that its secretariat is temporarily at Decebal 76, entrance from Tuberozelor, per https://www.cnivor.ro/. Old duplicated `Adresă:`/`Website:` tails were removed from Bihor descriptions so they cannot contradict the canonical fields. Other historical/statistical description claims were **not** fully re-audited by this change.

Google Maps was visibly checked for eight schools; observations are in `bihor-location-review.json`. Ghibu, Bolcaș, Ciordaș, Iosif Vulcan, Goga and corrected Bolyai resolve to matching named institutions and addresses. Samuil Vulcan and Cadea resolve to the named schools but their Google listings omit street details; these are not certified precise pins. No coordinates or Place IDs were invented. The remaining pins have not been individually checked, and the eight unresolved legacy records can still yield misleading searches.

Current database: **55 Bihor schools, 45 street addresses, 13 verified website links**; plus the corrected Bolyai record in Mureș with its own verified address/site. Forty-two Bihor website fields remain empty. University locations/websites were not changed or certified in this school audit.

Validation: 54 tests/19 suites, zero-warning lint, TypeScript, Android/iOS exports and public Data API checks passed. Native phone rendering remains unverified. No commit or push was made.

## Native preview rendering correction

The native WebView now loads an HTML iframe document instead of navigating directly to Google's embed response, which produced the iframe-required error. Native and shared web previews are 220px high. Dark appearance follows the app theme using a CSS visual filter, since the iframe does not expose the Maps JavaScript API's native color-scheme option. This changes preview appearance only, not institution coordinates or the external Maps app's theme. The generated HTML was visually checked in a browser; phone rendering remains to be confirmed. Full verification passed: 56 tests/20 suites, lint, TypeScript and Android/iOS exports.
