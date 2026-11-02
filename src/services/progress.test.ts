import { supabase } from '@/lib/supabase';
import { saveProgress, updateProgress } from './progress';
jest.mock('@/lib/supabase', () => ({ supabase: { from: jest.fn(), auth: { getUser: jest.fn() } } }));
beforeEach(() => {
 jest.resetAllMocks();
 jest.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'owner' } }, error: null } as Awaited<ReturnType<typeof supabase.auth.getUser>>);
});
function table(existing: unknown[] = []) {
 const chain = { select: jest.fn(), eq: jest.fn(), limit: jest.fn().mockResolvedValue({ data: existing, error: null }), insert: jest.fn().mockResolvedValue({ error: null }), update: jest.fn(), single: jest.fn().mockResolvedValue({ data: { id: 'step' }, error: null }) };
 chain.select.mockReturnValue(chain); chain.eq.mockReturnValue(chain); chain.update.mockReturnValue(chain);
 jest.mocked(supabase.from).mockReturnValue(chain as unknown as ReturnType<typeof supabase.from>);
 return chain;
}
it('saves a path step for the authenticated owner', async () => {
 const query = table();
 await saveProgress('course', 'resource');
 expect(query.eq).toHaveBeenCalledWith('user_id', 'owner');
 expect(query.insert).toHaveBeenCalledWith({ user_id: 'owner', step_type: 'course', ref_id: 'resource', status: 'in_progress' });
});
it('does not add an existing resource a second time', async () => {
 const query = table([{ id: 'existing' }]);
 await saveProgress('course', 'resource');
 expect(query.insert).not.toHaveBeenCalled();
});
it('requires a session before writing progress', async () => {
 jest.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: null }, error: null });
 await expect(saveProgress('course', 'resource')).rejects.toThrow('Session required');
 expect(supabase.from).not.toHaveBeenCalled();
});
it('limits completion updates to the owner and surfaces failed saves', async () => {
 const query = table();
 query.single.mockResolvedValue({ data: null, error: new Error('offline') });
 await expect(updateProgress('step', 'completed')).rejects.toThrow('offline');
 expect(query.eq).toHaveBeenCalledWith('user_id', 'owner');
 expect(query.eq).toHaveBeenCalledWith('id', 'step');
});
