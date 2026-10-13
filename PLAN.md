# NextStep Implementation Plan

This document outlines the work needed to bring the NextStep project into compliance with the master prompt specifications.

## Current State
- Project initialized with `create-expo-app` using TypeScript and Expo Router
- Basic structure: `src/app/`, `src/components/`, `src/constants/`, `src/hooks/`
- Missing: proper folder structure, design system, Supabase integration, core features

## Execution Order (Adapted for Constraints)

### Phase 0: Preparation (Cannot execute due to permission restrictions)
1. Create missing directory structure:
   ```
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

### Phase 1: Design System & Base Components
2. Update `src/theme/tokens.ts` with exact color specifications from master prompt:
   - Dark theme colors: background `#18171F`, surface `#25232F`, etc.
   - Light theme colors: background `#FAF7FF`, surface `#FFFFFF`, etc.
   - Spacing scale: 4, 8, 12, 16, 24, 32, 48
   - Radius scale: 8, 12, 16
   - Typography: Plus Jakarta Sans ExtraBold Italic (headings), Inter (body)

3. Create base components in `src/components/`:
   - Button (with variants: primary, secondary, outline, etc.)
   - Input (with validation states)
   - Card
   - Chip
   - EmptyState
   - ErrorState
   - Toast

### Phase 2: Supabase Setup & Auth
4. Set up Supabase project and configure EAS secrets
5. Create database migrations in `supabase/migrations/` for all tables:
   - Reference tables: schools, school_profiles, universities, programs, skills, careers, career_skills, program_skills, program_careers, school_profile_programs, courses, course_skills
   - User-owned tables: profiles, user_skills, user_goals, user_progress, consents
   - Enable RLS on all tables in same migration that creates them
   - Add proper indexes and constraints

6. Create seed data in `supabase/seed/` with verified sources
7. Report any missing verified data in `DATA_TODO.md`

8. Create Supabase client in `src/lib/supabase.ts` with secure storage adapter
9. Implement auth system:
   - Email/password registration with email verification
   - Login, logout, forgot password, reset password
   - Change password in settings
   - Route guard protecting `(tabs)/` group
   - Account deletion Edge Function (`supabase/functions/delete-account.ts`)
   - Data export Edge Function (`supabase/functions/export-data.ts`)

### Phase 3: Core Features Implementation
10. Build onboarding screens (3 screens) in `(auth)/onboard/` 
11. Build profile system:
    - Profile creation/editing
    - Grade level, favorite subjects, interests, goal selection
    - Consent handling for minors

12. Build explore feature:
    - Segmented sections: Licee, Facultăți, Cariere, Cursuri
    - Search, filters (county, domain, level)
    - Paginated lists with cursor-based pagination
    - Detail screens for each entity with source attribution

13. Build My Path feature:
    - Visual ordered path from current level to career goal
    - Tappable nodes showing status

14. Build gap analysis engine in `src/engine/gapAnalysis.ts`:
    - Pure function implementing the algorithm from master prompt
    - Comprehensive unit tests

15. Build recommendation engine in `src/engine/recommendationEngine.ts`:
    - Maps missing skills to courses
    - Rules-based, deterministic output

16. Build explain-path Edge Function in `supabase/functions/explain-path.ts`:
    - JWT verification
    - Input validation with Zod
    - AI provider call with rate limiting and caching
    - Graceful degradation to structured result

17. Build settings screen:
    - Edit profile fields
    - Theme toggle
    - Change password
    - Privacy policy, terms links
    - Export data, delete account, sign out actions

18. Build shared UI states:
    - Error boundary at root
    - Offline banner/retry mechanism
    - Loading skeletons
    - Empty states with useful messages and next actions

### Phase 4: Landing Site
19. Build static landing site in `web/`:
    - Pages: index, privacy, terms, support, delete-account, 404
    - Same palette and fonts as app
    - Responsive from 320px
    - Privacy and terms marked as "draft, requires legal review"

### Phase 5: Polish & Verification
20. Run 20-item production checklist and fix all items
21. Run five security audits, fix CRITICAL and HIGH findings
22. Run type check, lint, tests, npm audit, production build config check
23. Produce final report

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

## Next Steps (When Permissions Restored)
1. Create directory structure
2. Implement design system tokens
3. Create base components
4. Set up Supabase and auth
5. Implement core features in order
6. Build landing site
7. Run verification checks