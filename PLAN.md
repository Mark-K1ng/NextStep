# NextStep Implementation Plan

This document outlines the work needed to bring the NextStep project into compliance with the master prompt specifications.

## Current State

- Project initialized with `create-expo-app` using TypeScript and Expo Router
- Basic structure: `src/app/`, `src/components/`, `src/constants/`, `src/hooks/`
- Missing: proper folder structure, design system, Supabase integration, core features

## Execution Order (Adapted for Constraints)

### Phase 0: Preparation (Completed)

1. Created missing directory structure:

```text
   src/
     theme/
     i18n/
     lib/
     features/
       auth/
       profile/
       explore/
       path/
       recommendations/
     services/
       school.ts
       program.ts
       career.ts
       course.ts
     engine/
       gapAnalysis.ts
       recommendationEngine.ts
   supabase/
     migrations/
     functions/
     seed/
     tests/
   docs/
   web/
   ```

### Phase 1: Design System & Base Components (Completed)

1. ✅ Updated `src/theme/tokens.ts` with exact color specifications from master prompt:
   - Dark theme colors: background `#18171F`, surface `#25232F`, etc.
   - Light theme colors: background `#FAF7FF`, surface `#FFFFFF`, etc.
   - Spacing scale: 4, 8, 12, 16, 24, 32, 48
   - Radius scale: 8, 12, 16
   - Typography: Plus Jakarta Sans ExtraBold Italic (headings), Inter (body)

2. ✅ Created base components in `src/components/`:
   - Button (with variants: primary, secondary, outline)
   - Input (with validation states)
   - Card
   - Chip
   - EmptyState
   - ErrorState
   - Toast
   - Created index.ts for easy exports

### Phase 2: Supabase Setup & Auth (Completed)

1. ✅ Created database migrations in `supabase/migrations/` for all tables:
   - Reference tables: schools, school_profiles, universities, programs, skills, careers, career_skills, program_skills, program_careers, school_profile_programs, courses, course_skills
   - User-owned tables: profiles, user_skills, user_goals, user_progress, consents
   - ✅ Enable RLS on all tables in same migration that creates them
   - ✅ Add proper indexes and constraints
   - ✅ Created RLS test suite in `supabase/tests/rls_test.sql`

2. ✅ Created seed data in `supabase/seed/` with verified sources:
   - Schools (001_schools.sql)
   - School profiles (002_school_profiles.sql)
   - Universities (003_universities.sql)
   - Programs (004_programs.sql)
   - Skills (005_skills.sql)
   - Careers (006_careers.sql)
   - Career skills junction (007_career_skills.sql)
   - Program skills junction (008_program_skills.sql)
   - Program careers junction (009_program_careers.sql)
   - School profile programs junction (010_school_profile_programs.sql)
   - Courses (011_courses.sql)
   - Course skills junction (012_course_skills.sql)
   - Created DATA_TODO.md to track missing verified data

3. ✅ Reported missing verified data in `DATA_TODO.md` (ongoing)

4. ✅ Created Supabase client in `src/lib/supabase.ts` with secure storage adapter (DONE)
5. ✅ Created auth screens:
   - Onboarding: Onboarding1, Onboarding2, Onboarding3
   - Register: Register screen
   - Login: Login screen
   - Forgot password: ForgotPassword screen
   - Reset password: ResetPassword screen
   - Verify email: VerifyEmail screen
   - Updated root layout (`src/app/_layout.tsx`) to handle authentication state
   - Created auth hooks and barrel exports
6. ✅ Created profile screen
7. ✅ Created explore screen
8. ✅ Created path screen
9. ✅ Created recommendations screen
10. ✅ Created settings screen
11. ✅ Created tab navigation structure with home, explore, path, recommendations, profile tabs
12. ✅ Updated app tabs component to use new tab structure
13. ✅ Created gap analysis engine in `src/engine/gapAnalysis.ts`
14. ✅ Created recommendation engine in `src/engine/recommendationEngine.ts`
15. ✅ Created explain-path Edge Function in `supabase/functions/explain-path.ts`
16. ✅ Created delete-account Edge Function in `supabase/functions/delete-account.ts`
17. ✅ Created export-data Edge Function in `supabase/functions/export-data.ts`
18. ✅ Created unit tests for gap analysis and recommendation engine

### Phase 3: Core Features Implementation (In Progress)

1. ⏳ Build onboarding screens (3 screens) in `(auth)/onboard/`
2. ⏳ Build profile system:
    - Profile creation/editing
    - Grade level, favorite subjects, interests, goal selection
    - Consent handling for minors

3. ⏳ Build explore feature:
    - Segmented sections: Licee, Facultăți, Cariere, Cursuri
    - Search, filters (county, domain, level)
    - Paginated lists with cursor-based pagination
    - Detail screens for each entity with source attribution

4. ⏳ Build My Path feature:
    - Visual ordered path from current level to career goal
    - Tappable nodes showing status

5. ⏳ Complete settings screen implementation:
    - Edit profile fields
    - Theme toggle
    - Change password
    - Privacy policy, terms links
    - Export data, delete account, sign out actions

6. ⏳ Build shared UI states:
    - Error boundary at root
    - Offline banner/retry mechanism
    - Loading skeletons
    - Empty states with useful messages and next actions

### Phase 4: Landing Site

1. ⏳ Build static landing site in `web/`:
    - Pages: index, privacy, terms, support, delete-account, 404
    - Same palette and fonts as app
    - Responsive from 320px
    - Privacy and terms marked as "draft, requires legal review"

### Phase 5: Polish & Verification

1. ⏳ Run 20-item production checklist and fix all items
2. ⏳ Run five security audits, fix CRITICAL and HIGH findings
3. ⏳ Run type check, lint, tests, npm audit, production build config check
4. ⏳ Produce final report

## Implementation Notes

### Key Technical Decisions

- Use `@supabase/supabase-js` with custom storage adapter for `expo-secure-store`
- Validation with Zod on client and in Edge Functions
- Server state with TanStack Query
- Local UI state with React state (avoid Zustand unless absolutely needed)
- Native components only: View, Text, Pressable, TextInput, FlatList, ScrollView, SafeAreaView
- No WebView-rendered UI, HTML elements, Ionic, Capacitor, or Cordova

### Anti-Slop Rules to Enforce

1. No purple-to-pink gradients, glassmorphism, glow effects, neon shadows, floating blobs
2. One consistent icon set (Lucide or Phosphor) with one stroke width
3. Specific, plain Romanian copy - no generic hero copy
4. Clear visual hierarchy, generous whitespace, consistent 4-point grid alignment
5. Every list has real empty state with useful message; async views have loading skeletons
6. Copy written for 12-18 year olds - direct, not childish or slangy
7. Extract logic into hooks and engine folder; small components
8. Comments explain why, not what
9. Real content only - no placeholder text, all records carry source_url and verified_at
10. Native feel: platform-correct back behavior, safe areas, keyboard avoidance, pull-to-refresh

### Data Model Compliance

- All tables with uuid primary keys and timestamptz timestamps
- RLS enabled on every table with proper policies
- Profiles.id must equal auth.users.id (via trigger or controlled function)
- Verified seed data with sources reported in DATA_TODO.md if missing
- Role concept only if necessary and not writable by user

### Security & Privacy

- Minimum data collection (only what's in profiles table)
- No analytics SDKs, advertising IDs, third-party trackers
- Consent handling for users under digital consent age
- Generic error messages to clients, detailed errors only in server logs
- HTTPS only, minimum required CORS for Edge Functions
- Password policy: minimum 10 characters
- Auth error messages do not reveal email existence
- Service role key never in mobile app or EXPO_PUBLIC_* variables

## Open Questions / TBD Items

1. AI provider for explain-path Edge Function (to be configured in EAS secrets)
2. Exact implementation of consent logic for minors (requires legal review)
3. Source verification for all seed data (to be researched and documented)
4. Final app store metadata and descriptions
5. Performance optimization targets and testing devices
6. Need to add tab icons to assets/ directory (home.png, explore.png, path.png, recommendations.png, profile.png)
7. Fix TypeScript errors in the project (many components have missing imports or incorrect usage of theme and spacing)

## Next Steps

1. Continue with master prompt step 7: Build onboarding, profile, explore, detail, my path
2. Create Supabase project and set secrets (URL/anon key in `.env`)
3. Implement profile system components and screens
4. Build explore feature with search and filters
5. Complete settings screen implementation
6. Build shared UI states
7. Build landing site
8. Fix TypeScript errors
9. Run verification checks
