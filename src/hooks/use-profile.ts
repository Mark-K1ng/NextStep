import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useSession } from '@/providers/auth';
import type { Profile } from '@/types/models';
export function useProfileQuery() {
  const { session } = useSession();
  return useQuery({
    queryKey: ['profile', session?.user.id],
    enabled: !!session,
    queryFn: async ({ signal }) => {
      const result = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session!.user.id)
        .abortSignal(signal)
        .single();
      if (result.error) {
        throw result.error;
      }
      return result.data as Profile;
    },
  });
}
