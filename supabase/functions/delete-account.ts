import { json, withUser } from './_shared/http.ts';

export default withUser(async ({ supabase, user, token }) => {
  const { error: signOutError } = await supabase.auth.admin.signOut(
    token,
    'global',
  );
  if (signOutError) throw signOutError;
  const { error } = await supabase.auth.admin.deleteUser(user.id);
  if (error) throw error;
  return json({ success: true });
});
