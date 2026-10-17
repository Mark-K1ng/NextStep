# NEXTSTEP — MASTER BUILD PROMPT FOR CLAUDE CODE

You are the lead engineer on NextStep, a production mobile application. You will plan, build, harden, and verify it in this single session. Read this entire prompt before writing any code. Follow it in the order given. Do not skip sections. Do not ask me for permission between phases unless a decision is marked BLOCKING.

---

## 0. OPERATING RULES

1. Work in phases. At the end of each phase, run the type checker, linter, and tests, report results in 5 lines or fewer, then continue.
2. Never invent data. Every school, university, program, career, skill, and course record must carry a `source_url` and a `verified_at` date. If you do not have a verifiable source, leave the record out and list it under TODO in `DATA_TODO.md`. Do not fabricate curricula, admission figures, salaries, or course links.
3. Never commit secrets. Create `.gitignore` first. Create `.env.example` with placeholder names only. Real values live in `.env` (ignored) and in EAS secrets.
4. Use only the packages you need. Before adding a dependency, state in one line why it is needed. Prefer Expo-compatible packages, install with `npx expo install` where applicable.
5. No placeholder text, no lorem ipsum, no "TODO" strings visible in the UI, no dead buttons, no console.log left in production code.
6. Every user-visible string is written in Romanian and stored in a single i18n dictionary file so a second language can be added later. Code, comments, identifiers, and commit messages are in English.
7. Commit after each phase with a clear message in conventional-commit format.
8. If a requirement conflicts with security, security wins. State the conflict and the choice you made.
9. Do not generate generic "AI-looking" output. The anti-slop rules in section 4 are mandatory.

---

## 1. PRODUCT

**Name:** NextStep
**Tagline (RO):** Descoperă următorul tău pas.
**What it is:** A free educational and career-orientation app for Romanian students from middle school (clasele V–VIII) through high school (IX–XII), and early university students.
**Core question the app answers:** "Where am I now, where do I want to go, which skills am I missing, and what is the next concrete step?"

## Users

- Clasele V–VIII: interests → which high school profile fits.
- Clasele IX–X: interests → which professional domains fit.
- Clasele XI–XII and students: domain → faculty → career, plus skill gaps and course recommendations.

**Business model (context only, do not build billing):** Free for students. Revenue later from schools, universities, companies, and education providers. Recommendation logic must never be influenced by who pays. Do not build ads, payments, or sponsored ranking in this version.

**Scope of this version (MVP). Build exactly this:**

1. Onboarding (3 screens) and account creation.
2. Student profile: grade level, favorite subjects, interests, goal.
3. Explore: high schools and their specializations, university programs, careers, skills, courses.
4. Detail screens for each entity with source attribution.
5. "My Path" (Traseul meu): a visual, ordered path from current level to a chosen career goal.
6. Gap analysis: compare the student's skills to a target career and list missing skills.
7. Recommendations: rule-based engine that maps missing skills to courses.
8. AI explanation layer: an Edge Function that turns the already-computed result into a short natural-language explanation. AI never decides, it only explains.
9. Profile and settings: edit profile, change password, sign out, delete account, export my data.

**Explicitly out of scope:** chat with AI, social features, messaging, marketplace, CV builder, recruiting, payments, push notifications, gamification, admin panel.

---

## 2. STACK (FIXED, DO NOT CHANGE)

- React Native with Expo (current stable SDK), TypeScript in strict mode.
- Expo Router for navigation (file-based).
- Native components only: View, Text, Pressable, TextInput, FlatList, ScrollView, SafeAreaView. No WebView-rendered UI, no HTML elements, no Ionic, Capacitor, or Cordova.
- Supabase: PostgreSQL, Auth, Storage, Row Level Security, Edge Functions.
- `@supabase/supabase-js` with session persisted in `expo-secure-store` (not AsyncStorage) via a custom storage adapter.
- Validation: Zod on the client and inside every Edge Function.
- Server state: TanStack Query. Local UI state: React state or Zustand only if needed.
- Fonts via `expo-font`: Plus Jakarta Sans (ExtraBold Italic 800 for the wordmark and large headings) and Inter (UI and body).
- Builds and distribution: EAS Build and EAS Submit. Developer machine is Windows, so iOS builds happen in the cloud.
- Tests: Jest and React Native Testing Library for logic and key components. SQL tests for RLS using pgTAP or scripted SQL.
- Lint and format: ESLint and Prettier with TypeScript rules. Fail the build on type errors.

Project structure (create it, keep it consistent):

```text
app/                 routes (Expo Router)
  (auth)/            welcome, login, register, forgot-password, verify-email
  (tabs)/            home, explore, my-path, recommendations, profile
  school/[id].tsx
  program/[id].tsx
  career/[id].tsx
  course/[id].tsx
  +not-found.tsx
src/
  components/        shared UI (Button, Input, Card, Chip, EmptyState, ErrorState, Toast)
  theme/             tokens.ts, typography.ts, spacing.ts
  i18n/              ro.ts
  lib/               supabase.ts, secureStorage.ts, validators.ts, errors.ts
  features/          auth, profile, explore, path, recommendations
  services/          data access, one file per domain
  engine/            gap analysis and recommendation logic (pure functions, fully tested)
supabase/
  migrations/        ordered SQL migrations
  functions/         edge functions (explain-path, delete-account, export-data)
  seed/              verified seed data as SQL or JSON with sources
  tests/             RLS tests
docs/                SECURITY.md, ARCHITECTURE.md, RELEASE.md, PRIVACY_NOTES.md
web/                 static landing site with privacy policy, terms, support, delete-account instructions
```

---

## 3. DESIGN SYSTEM (BUILD THIS BEFORE ANY SCREEN)

Create `src/theme/tokens.ts` as the single source of truth. No raw hex values or magic numbers inside screens.

**Dark theme (default):**

- background: `#18171F`
- surface (cards): `#25232F`
- surface elevated: `#2E2B3A`
- border: `#3A3748`
- text primary: `#F5F3FA`
- text secondary: `#A5A1B5`
- primary: `#7C3AED`
- primary pressed: `#6D28D9`
- accent: `#A78BFA`
- success: `#22C55E`
- warning: `#F59E0B`
- danger: `#EF4444`

**Light theme (optional toggle, follow system by default):**

- background: `#FAF7FF`
- surface: `#FFFFFF`
- border: `#E7E0F5`
- text primary: `#1B1726`
- text secondary: `#6B6480`
- primary: `#7C3AED`

Rules:

- Verify contrast. Text on background and on primary buttons must meet WCAG AA (4.5:1 for body text). If `#7C3AED` with white text fails at small sizes, use the pressed shade or increase weight and size, and document it.
- Spacing scale: 4, 8, 12, 16, 24, 32, 48. Radius scale: 8, 12, 16. Use them only.
- Typography: Plus Jakarta Sans ExtraBold Italic for the wordmark and hero headings only. Inter for everything else. Define 6 text styles (display, title, heading, body, caption, label) and use only those.
- Respect system font scaling up to a sane cap and test it.
- Minimum touch target 44x44.
- Haptics only on meaningful actions. Animations limited to short, purposeful transitions (150–250 ms). No decorative motion.

**Logo and icon:**

- Wordmark: "NextStep", Plus Jakarta Sans ExtraBold Italic, letter spacing about -0.5, white with "Step" in `#A78BFA`, or fully white with a purple symbol.
- Symbol: a minimal geometric ascending step or arrow, built as SVG with `react-native-svg`.
- Generate the app icon (1024x1024, no transparency, no rounded corners baked in), adaptive Android icon (foreground and background layers), splash screen, and favicon for the web folder. Place them in `assets/` and wire them in `app.json`.

---

## 4. ANTI-SLOP RULES (MANDATORY)

The app must look designed by a person with taste, not generated. Enforce all of the following:

1. No purple-to-pink gradients, no glassmorphism, no glow effects, no neon shadows, no floating blobs.
2. No emoji used as icons or decoration. Use one consistent icon set (Lucide via `lucide-react-native` or Phosphor), one stroke width.
3. No generic hero copy such as "Unlock your potential" or "AI-powered". Write specific, plain Romanian copy that describes what the screen does.
4. No stock card grids with identical shadows. Use hierarchy: one primary action per screen, clear typographic scale, generous whitespace, consistent alignment on a 4-point grid.
5. Every list has a real empty state with a useful message and a next action. Every async view has a loading skeleton (not a bare spinner), and an error state with a retry.
6. Copy is short, direct, and written for 12–18 year olds without being childish or slangy.
7. Consistent naming, consistent file layout, small components, no 600-line screen files. Extract logic into hooks and the engine folder.
8. Comments explain why, not what. No comments that restate the code. No generated-sounding commit messages or README fluff.
9. Real content only. Seed data is limited and verified (see section 6).
10. Screens must feel native: platform-correct back behavior, safe areas, keyboard avoidance, pull-to-refresh where lists refresh, no web-style hover patterns.

---

## 5. DATA MODEL (POSTGRESQL, MIGRATIONS IN `supabase/migrations/`)

Create these tables with primary keys, foreign keys, NOT NULL where appropriate, check constraints, and indexes on every foreign key and every column used for filtering. Use `uuid` primary keys and `timestamptz` timestamps. Enable RLS on every table in the same migration that creates it.

Reference (public read-only) tables:

- `schools` (id, name, city, county, website, description, source_url, verified_at)
- `school_profiles` (id, school_id, track, specialization, key_subjects text[], admission_notes, source_url, verified_at)
- `universities` (id, name, city, website, source_url, verified_at)
- `programs` (id, university_id, name, degree_level, duration_years, description, source_url, verified_at)
- `skills` (id, name, category)
- `careers` (id, name, description, domain, source_url, verified_at)
- `career_skills` (career_id, skill_id, importance smallint check 1..3)
- `program_skills` (program_id, skill_id, depth smallint check 1..3)
- `program_careers` (program_id, career_id)
- `school_profile_programs` (school_profile_id, program_id)
- `courses` (id, title, provider, url, language, is_free, level, source_url, verified_at)
- `course_skills` (course_id, skill_id, depth smallint check 1..3)

User-owned tables:

- `profiles` (id uuid primary key references auth.users on delete cascade, display_name, grade_level, county, interests text[], favorite_subjects text[], created_at, updated_at). Collect nothing else. No phone, no address, no photo, no exact location.
- `user_skills` (user_id, skill_id, level smallint check 1..3, primary key (user_id, skill_id))
- `user_goals` (id, user_id, career_id, created_at)
- `user_progress` (id, user_id, step_type, ref_id, status, updated_at)
- `consents` (user_id, kind, granted_at, version)

Rules:

- `profiles.id` must equal `auth.users.id`. Create the profile row through a trigger on `auth.users` insert, or through a controlled function, never trusting a client-sent id.
- Add a `role` concept only if necessary. If you add it, it must not be writable by the user.
- Deleting an auth user must cascade to all user-owned rows.
- Write `supabase/seed/` with a small verified dataset: about 20 high-school profiles, 20 university programs, 30 careers, 60 skills, 100 courses at most, each with a source. If you cannot verify a record, do not include it. Write the shortfall into `DATA_TODO.md`.

---

## 6. ROW LEVEL SECURITY (NON-NEGOTIABLE)

- RLS enabled on every table in `public`. No exceptions.
- Reference tables: `SELECT` allowed for `authenticated`, no `INSERT`, `UPDATE`, `DELETE` for any client role.
- User-owned tables: every policy filters on `auth.uid()`, never on a client-supplied value.
  - `SELECT`: `user_id = auth.uid()` (or `id = auth.uid()` for profiles).
  - `INSERT`: `WITH CHECK (user_id = auth.uid())`.
  - `UPDATE`: `USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid())`.
  - `DELETE`: `USING (user_id = auth.uid())`.
- Revoke default privileges the clients do not need. Use column-level grants where a user must not edit certain columns.
- The service role key is never present in the mobile app, never in `EXPO_PUBLIC_*` variables, never in the repo. It is used only inside Edge Functions through server-side secrets.
- Write SQL tests in `supabase/tests/` that prove user A cannot read, insert for, update, or delete user B's rows in every user-owned table, and that anonymous clients cannot read user tables. Run them and show the results.
- Storage: if buckets are used, they are private by default, with policies scoped to `auth.uid()` folders. For the MVP, avoid storage unless required.

---

## 7. AUTHENTICATION

Use Supabase Auth. Do not implement your own hashing, tokens, or sessions.

- Email and password registration, mandatory email verification before the app shows protected content.
- Login, logout, forgot password, reset password through deep link, change password inside settings.
- Password policy: minimum 10 characters, enable leaked-password protection in Supabase settings if available on the plan, otherwise document the limitation in `docs/SECURITY.md`.
- Session stored in `expo-secure-store`. Refresh tokens handled by the Supabase client. Logout clears local state and the query cache.
- Auth error messages must not reveal whether an email exists. Use one generic message for login failures and for password-reset requests.
- Protected routes: a single route guard in the root layout. Unauthenticated users can only see the `(auth)` group.
- Never trust a user id from a request body. Edge Functions derive the user from the verified JWT only.
- Account deletion: an Edge Function `delete-account` that verifies the JWT, deletes the auth user with the service role, and relies on cascades. The app shows a confirmation step and a success message. This is required by both stores.
- Data export: an Edge Function `export-data` returning the user's own data as JSON.
- Sign in with Apple becomes mandatory on iOS if other third-party social logins are added. Do not add social login in this version.

---

## 8. MINORS AND PRIVACY (THIS APP IS FOR UNDER-18s)

- Collect the minimum. See `profiles` above. Do not add analytics SDKs, advertising IDs, or third-party trackers.
- Gate registration with a grade-level selection and a plain-language notice. For users under the digital consent age, record whether parental consent is required by the applicable rules and implement a consent step that stores a versioned consent record in `consents`. Document the assumptions in `docs/PRIVACY_NOTES.md` and mark them as requiring legal review before launch. Do not present legal conclusions as fact.
- Provide in-app links to the Privacy Policy and Terms, a visible "Delete my account" action, and a data export action.
- Declare the app in the store questionnaires as directed at children and teens where applicable, and follow the stores' rules for such apps. List the requirements you identified in `docs/RELEASE.md`.
- Never log personal data. No tokens, emails, or profile content in logs or error reports.

---

## 9. RECOMMENDATION ENGINE (PURE, TESTED, DETERMINISTIC)

Place in `src/engine/`. No network access, no AI calls inside.

Inputs: the student's skills with levels, the target career's required skills with importance, available courses with the skills and depth they teach.

Steps:

1. Gap analysis: for each required skill compute `missing`, `partial`, or `covered` by comparing the student's level to the required importance.
2. Rank missing skills by importance, then by prerequisite relations if present.
3. Course matching: for each gap, rank courses by skill depth fit, free first, then level, then language match.
4. Output a structured object: `{ covered: [], partial: [], missing: [], steps: [{ skill, courses: [] }] }`.

Write unit tests covering: empty skills, full coverage, partial coverage, ties, a course that teaches several gaps, a career with no skills mapped, and invalid input. The engine must return the same output for the same input.

**AI explanation layer (Edge Function `explain-path`):**

- Input is the engine's structured result. The function verifies the JWT, validates input with Zod, and enforces a size cap.
- It builds a prompt that contains only the structured result and an instruction to explain it in short, clear Romanian, to refuse to add facts not in the input, and to avoid guarantees about jobs or admission.
- It calls the AI provider from the server using a server-side secret. Never call an AI provider from the app.
- Rate limit per user and per IP (see section 11). If the limit or the provider fails, the app shows the structured result without the explanation and a clear message. The feature must fail closed and degrade gracefully.
- Cache the explanation per (user, goal, result hash) to avoid repeat cost.
- Set a hard monthly spend cap in the provider dashboard and document it in `docs/SECURITY.md`.

---

## 10. SCREENS AND FLOWS

Build in this order: theme and components, auth, profile onboarding, explore, detail screens, my path, gap analysis, recommendations, settings.

- **Onboarding:** three screens with real copy, skippable, shown once.
- **Register:** email, password, grade level, accept terms. Inline validation, specific field errors, disabled submit while loading.
- **Verify email:** clear instructions, resend with cooldown, success state when verified.
- **Home:** greeting by display name, current goal, next recommended step, quick entry points to Explore and My Path.
- **Explore:** segmented sections for Licee, Facultăți, Cariere, Cursuri. Search, filters (county, domain, level), paginated lists (cursor or range based, never unbounded).
- **Detail screens:** description, key facts, related entities, and a visible "Sursă" row that opens the source URL externally.
- **My Path:** ordered timeline from current grade to goal career. Each node is tappable and shows its status.
- **Gap analysis:** covered, partial, missing skills as three clear groups, with the recommended courses under each gap.
- **Profile:** edit fields, language placeholder, theme, change password, privacy policy, terms, export data, delete account, sign out.
- **Error boundary** at the root. Offline banner when there is no connection. Retry on every failed query.

---

## 11. SECURITY PASSES (RUN ALL FIVE BEFORE FINISHING)

After the build is functionally complete, run these five audits against the repository. For each, produce a table, fix every CRITICAL and HIGH finding in this same session, then re-run the audit and show the table clean. Save the final results in `docs/SECURITY.md`.

**Audit 1. Secrets sweep.** Act as a security researcher auditing this repo for exposed secrets. Find: (1) hardcoded API keys, tokens, passwords, or connection strings in any file; (2) `.env` files that are committed or missing from `.gitignore`; (3) secrets in git history even if the file was deleted later; (4) secrets that ship to the app bundle or build output; (5) public or anon keys doing privileged work. Output a table: file and line, what leaked, how an attacker finds it, severity (CRITICAL / HIGH / MEDIUM), exact fix. Then list every key to rotate. A key that ever touched a commit is burned.

**Audit 2. Auth teardown.** Attack the authentication like you want in. Walk every auth path: (1) list every route, screen guard, and Edge Function and whether it verifies a valid session, flag any that skip it; (2) session handling: where tokens live, whether they expire, whether logout and password change kill them; (3) password rules: minimum length, breached-password check, anything the provider offers that was left off; (4) password reset and email verification: can someone reset another person's password or use the app with an unverified email. Output: flow, weakness, exact exploit steps, severity, fix. Any endpoint that trusts a user id from the request instead of the session is CRITICAL.

**Audit 3. Database interrogation.** Audit database access rules table by table. (1) List every table and whether RLS is enabled; any table reachable with the public key and no RLS is CRITICAL. (2) For each policy, write the exact query user A runs to read or edit user B's rows, run it, and report whether it works. (3) Flag policies that filter on client-sent values instead of `auth.uid()`. (4) Check INSERT and UPDATE policies, not only SELECT: can a user insert rows pointed at another user, or update columns they should not own. (5) Apply the same checks to storage buckets. Output: table, policy state, the attack query, what leaks, severity, corrected policy as real SQL. A policy that "looks correct" is not an answer. Execute the attacker query.

**Audit 4. Input audit.** Trace every path where user input reaches something dangerous. (1) SQL built with string concatenation or template literals instead of parameters; (2) input passed to eval, exec, shell commands, or dynamic imports; (3) file uploads if any: filename sanitization, server-side type check, path traversal; (4) user content rendered as HTML or markdown without escaping; (5) Edge Functions or endpoints with no server-side validation. Output: file and line, input source, what it reaches, a working example payload, severity, fix.

**Audit 5. Cost bomb check.** Find every endpoint that costs money or resources when called and check its protection. (1) Routes that call AI: what stops a script from calling each 100,000 times tonight; check auth, per-user limits, per-IP limits; (2) login, signup, password reset: rate limits, bot protection, whether response differences allow email enumeration; (3) email sending routes someone can spam; (4) expensive queries with no caps or pagination; (5) usage metering enforced server-side and failing closed. Output: endpoint, what one call costs, abuse scenario, projected damage from one night, severity, the exact limiter to add. Implement the limiters (per-user and per-IP counters in a Postgres table or an equivalent, enforced inside the Edge Function before any paid call).

Additional mandatory hardening:

- Enforce HTTPS only. Set Edge Function CORS to the minimum required.
- Generic error messages to clients, detailed errors only in server logs without personal data.
- Run `npm audit` and resolve high and critical advisories or document why not.
- Pin dependency versions with the lockfile committed.
- Enable Supabase email rate limits and CAPTCHA for signup if available, and document the setting.

---

## 12. PRODUCTION CHECKLIST (ALL 20 ITEMS, ADAPTED)

This is an Expo mobile app plus a small static landing site in `web/`. Items that are web-specific apply to the landing site, and each has a mobile equivalent in the app. Complete every item and tick it off in `docs/RELEASE.md` with evidence (file path or command output).

1. **Remove horizontal scroll.** App: no screen scrolls horizontally unless it is an intentional carousel; verify on small and large devices. Landing site: `overflow-x` must not appear at any width, including 320 px.
2. **Find broken links.** Scan all internal routes, deep links, and external URLs (sources, courses, policy links). Write a script `scripts/check-links.ts` that requests each external URL and reports non-2xx results. Fix or remove every broken one. Seed data URLs must pass.
3. **Add mobile menu.** App: bottom tab navigation with five clear tabs, plus a header action where needed. Landing site: a responsive menu that collapses on narrow screens, keyboard accessible, closes on route change.
4. **Add favicon.** Landing site favicon set (ico, png sizes, apple-touch-icon). App: icon and splash fully configured.
5. **Add meta description.** Landing site: unique title and meta description per page, Open Graph and Twitter tags. App: store listing metadata drafted in `docs/RELEASE.md` (name, subtitle, short and full description in Romanian, keywords, category, age rating notes).
6. **Fix footer links.** Landing site footer links to Privacy Policy, Terms, Support, and Delete Account instructions, all resolving. App: the same links in Profile settings.
7. **Custom 404 page.** Landing site `404.html` styled in the brand. App: `+not-found.tsx` with a clear message and a button back to Home.
8. **Copyright year.** Computed dynamically in the footer and in app settings, never hardcoded.
9. **Compress images.** Every image in `assets/` and `web/` is optimized and correctly sized. Use WebP or optimized PNG where supported, no asset above a reasonable size, document the sizes before and after.
10. **Fix broken buttons.** Every Pressable and button performs an action, has a pressed state, has an accessibility label, and is not obscured or untappable. Write a test or script that walks the key flows.
11. **Success buttons.** Buttons that complete an action show a clear completed state (for example "Salvat") before returning to normal, and are disabled during the request to prevent double submits.
12. **Success messages.** After register, verification, profile save, password change, export, and account deletion, show a toast or confirmation screen with specific Romanian copy.
13. **Error messages.** Every failure path shows a specific, human, Romanian message and a recovery action. Network, validation, auth, rate limit, and server errors each have their own copy. No raw error strings, no stack traces.
14. **Remove placeholder text.** Search the repo for "lorem", "placeholder", "TODO", "example.com", "test@", "John Doe", and any default Expo template text. Zero results in user-visible strings.
15. **Remove unused navigation.** Delete default Expo template tabs, screens, and routes that are not part of the MVP. No route is reachable that is not intentionally designed.
16. **Fix mobile overflow.** Text truncation rules set, no clipped content on small screens (320 px wide and 360 dp), verified with large font scaling, keyboards, and notches.
17. **Clickable logo.** In-app header logo returns to Home. Landing site logo links to the root.
18. **Clickable number.** If a support phone number is shown anywhere, it uses a `tel:` link. If there is no phone number, state this in the checklist and do not invent one.
19. **Clickable email.** The support email uses a `mailto:` link in the app and the landing site. Use a placeholder variable configured in one constants file, and flag in the final report that I must replace it with a real address.
20. **Mobile optimise.** Performance pass: memoized list items, `FlatList` tuning, image caching, no unnecessary re-renders, Hermes enabled, bundle size reviewed, cold start measured, tested on a low-end Android profile and a small iPhone, accessibility labels and roles on every interactive element, dynamic type respected, screen reader pass on the main flows.

---

## 13. LANDING SITE (`web/`)

Static, no framework required, hosted free on GitHub Pages or Cloudflare Pages. Pages: index, privacy, terms, support, delete-account, 404. Same palette and fonts as the app. Responsive from 320 px, no horizontal scroll, accessible, fast. The privacy and terms pages are drafted from the actual data the app collects (section 5 and 8) and are marked "draft, requires legal review" in the file header, not in public copy. The stores require a public privacy policy URL and an account-deletion URL.

---

## 14. RELEASE PREPARATION

- Configure `app.json` or `app.config.ts`: name, slug, bundle identifier and Android package (reverse-domain, consistent), version, build numbers, orientation (portrait), icons, splash, deep link scheme, permissions limited to what is used (declare none that are unused).
- `eas.json` with `development`, `preview`, and `production` profiles. Secrets through EAS secrets.
- Produce an Android AAB for internal testing and an iOS build for TestFlight. Do not submit to the stores without my confirmation.
- Draft store metadata and the data-safety and privacy-nutrition-label answers based on the real data flows, in `docs/RELEASE.md`.
- Note the known costs: Apple Developer Program membership and the Google Play developer registration fee. Backend and tooling stay on free tiers. Check the current free-tier limits of Supabase and EAS and record them, with the date checked, in `docs/ARCHITECTURE.md`. State the 5,000 registered users assumption and what would force a paid plan.
- Add a crash-free, privacy-respecting error handling approach. Do not add third-party analytics.

---

## 15. EXECUTION ORDER

1. Inspect the working directory. If a project exists, read it before changing it. If not, initialize it.
2. Create `.gitignore`, `.env.example`, ESLint, Prettier, strict TypeScript, and the folder structure.
3. Build the design system and base components with tests.
4. Write the database migrations, RLS policies, and RLS tests. Run them.
5. Write the seed data with sources. Report the shortfall in `DATA_TODO.md`.
6. Build auth and the route guard, then account deletion and data export.
7. Build onboarding, profile, explore, detail, my path.
8. Build the engine with tests, then recommendations, then the `explain-path` Edge Function.
9. Build settings, error boundary, offline handling, empty and loading states.
10. Build the landing site.
11. Run the 20-item checklist and fix everything.
12. Run the five security audits, fix CRITICAL and HIGH findings, re-run, and save the clean results.
13. Run type check, lint, tests, `npm audit`, link check, and a production build config check.
14. Produce the final report.

---

## 16. DEFINITION OF DONE AND FINAL REPORT

The work is done only when all of the following are true:

- Type check, lint, and all tests pass.
- RLS tests prove isolation between users.
- All five security audits show no open CRITICAL or HIGH findings.
- All 20 checklist items are ticked with evidence.
- No placeholder text, dead buttons, or broken links remain.
- No secret exists in the repo or its history.
- The app runs on Android and iOS from one codebase.

Final report, in this order and no longer than 60 lines:

1. What was built.
2. What is verified and how.
3. What is not verified or not possible from this environment (for example iOS device testing, store submission, legal review).
4. Items I must do manually: replace the support email, create the Supabase project and set secrets, set the AI provider spend cap, create store accounts, review legal texts, supply missing verified data listed in `DATA_TODO.md`.
5. Known risks and the next three improvements, in priority order.

Begin with step 1 of the execution order. Do not ask for confirmation to start.
