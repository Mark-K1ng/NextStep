# Database Update Instructions

## Issue
The Supabase Row Level Security (RLS) policy prevents updating the schools table using the anon/public key. The policy in place is:
```sql
CREATE POLICY "Schools cannot be modified by clients"
  ON schools FOR ALL
  TO authenticated
  WITH CHECK (false);
```

## Solution Options

### Option 1: Use Supabase Dashboard SQL Editor
1. Go to https://supabase.com/dashboard/project/nuwunxzibsvvtnxjjqzj/sql
2. Copy and paste the SQL statements from `supabase/migrations/005_update_school_descriptions.sql`
3. Execute the SQL

### Option 2: Use Service Role Key with Migration
1. Get your service role key from Supabase Dashboard → Settings → API
2. Create a new migration file or update the existing one
3. Run: `npx supabase db push`

### Option 3: Temporarily Disable RLS (NOT RECOMMENDED for production)
```sql
ALTER TABLE schools DISABLE ROW LEVEL SECURITY;
-- Run updates
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
```

## Migration File Created
The SQL migration file has been created at:
`supabase/migrations/005_update_school_descriptions.sql`

This file contains UPDATE statements for all schools with verified information from official sources.

## Data Integrity Issues Found
Several schools in the database have incorrect classifications or locations:
- Some "Colegiul Național" schools are actually "Colegiul Tehnic" or "Liceu Teoretic"
- Some schools listed in Bihor are actually in other counties (Cluj, Bistrița-Năsăud, etc.)
- Some schools don't exist at the specified locations

See `SCHOOL_DATA_ISSUES.md` for detailed information.

## Recommendation
Before executing the updates, review the data integrity issues and consider:
1. Correcting school classifications (name field)
2. Correcting school locations (city/county fields)
3. Removing or updating schools that don't exist in the specified locations
4. Adding missing schools that should be in the database

The current updates add descriptions but note the data issues. A full data cleanup is recommended.
