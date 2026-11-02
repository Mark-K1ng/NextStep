import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSession } from '@/providers/auth';
import { loadApplication, loadSubjects } from '@/services/tutoring';

export function useTutoringAccount() {
  const { session } = useSession();
  const userId = session?.user.id;
  const query = useQuery({
    queryKey: ['tutoring', userId, 'application'],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: ({ signal }) => loadApplication(signal),
  });
  const client = useQueryClient();
  useFocusEffect(
    useCallback(() => {
      client.invalidateQueries({ queryKey: ['tutoring', userId] });
    }, [client, userId])
  );
  return { userId, query };
}
export function useTutoringSubjects() {
  return useQuery({
    queryKey: ['tutoring-subjects'],
    staleTime: 60 * 60_000,
    queryFn: ({ signal }) => loadSubjects(signal),
  });
}
