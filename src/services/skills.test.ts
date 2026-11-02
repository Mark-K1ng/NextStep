import { supabase } from '@/lib/supabase';
import { saveSkillLevel } from './skills';
jest.mock('@/lib/supabase', () => ({ supabase: { from: jest.fn(), auth: { getUser: jest.fn() } } }));
beforeEach(() => { jest.resetAllMocks(); jest.mocked(supabase.auth.getUser).mockResolvedValue({ data: { user: { id: 'owner' } }, error: null } as Awaited<ReturnType<typeof supabase.auth.getUser>>); });
it('saves a level only for the authenticated owner', async () => {
 const upsert = jest.fn().mockResolvedValue({ error: null });
 jest.mocked(supabase.from).mockReturnValue({ upsert } as unknown as ReturnType<typeof supabase.from>);
 await saveSkillLevel('skill', 2);
 expect(upsert).toHaveBeenCalledWith({ user_id: 'owner', skill_id: 'skill', level: 2 }, { onConflict: 'user_id,skill_id' });
});
it('rejects out-of-range levels before a database write', async () => {
 await expect(saveSkillLevel('skill', 4)).rejects.toThrow();
 expect(supabase.from).not.toHaveBeenCalled();
});
it('removes a self-assessment under both owner and skill filters', async () => {
 const query = { delete: jest.fn(), eq: jest.fn() };
 query.delete.mockReturnValue(query); query.eq.mockReturnValueOnce(query).mockResolvedValueOnce({ error: null });
 jest.mocked(supabase.from).mockReturnValue(query as unknown as ReturnType<typeof supabase.from>);
 await saveSkillLevel('skill', 0);
 expect(query.eq).toHaveBeenCalledWith('user_id', 'owner'); expect(query.eq).toHaveBeenCalledWith('skill_id', 'skill');
});
