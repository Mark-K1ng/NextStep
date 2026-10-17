# Delete Account Edge Function

This Edge Function implements true account deletion by:
1. Deleting the user's profile data from the database
2. Completely deleting the Supabase auth account using the admin API

## Deployment Instructions

### Step 1: Get Service Role Key

1. Go to your Supabase project dashboard
2. Navigate to Settings → API
3. Copy the `service_role` key (NOT the anon key!)
4. **Important**: Keep this key secret - it has full admin access

### Step 2: Deploy the Function

Using the Supabase CLI:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref nuwunxzibsvvtnxjjqzj

# Deploy the function
supabase functions deploy delete-account
```

### Step 3: Set Environment Variables

The function requires these environment variables in Supabase:

- `SUPABASE_URL` - Your Supabase project URL (already set by Supabase)
- `SERVICE_ROLE_KEY` - Your service role key (need to set)

To set the service role key:

```bash
supabase secrets set SERVICE_ROLE_KEY=your_service_role_key_here
```

Or via Supabase dashboard:
1. Go to Edge Functions → Settings
2. Add environment variable: `SERVICE_ROLE_KEY`
3. Paste your service role key

### Step 4: Test the Function

Once deployed, the function will be available at:
```
https://nuwunxzibsvvtnxjjqzj.supabase.co/functions/v1/delete-account
```

The app is already configured to call this endpoint when you delete your account.

## Security Notes

- The function uses the service role key for admin-level operations
- Only authenticated users can call this function (JWT token required)
- Password verification is done on the client before calling the function
- The function verifies the JWT token before proceeding

## Troubleshooting

If deployment fails:
1. Ensure you have the correct project reference
2. Verify your service role key is valid
3. Check Supabase CLI is properly authenticated

If the function returns errors:
1. Check the function logs in Supabase dashboard
2. Verify the service role key has admin permissions
3. Ensure the user's JWT token is valid
