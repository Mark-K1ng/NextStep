import { act, createElement } from 'react';
import { createRoot } from 'test-renderer';
import { QueryClient, QueryClientProvider, notifyManager } from '@tanstack/react-query';
import { AccountModeProvider } from './account-mode-provider';
import { useAccountMode } from './account-mode';
import { getAccountAccess, type AccountAccess } from '@/services/account-access';

let mockId = 'teacher-one';
jest.mock('./auth', () => ({ useSession: () => ({ session: { user: { id: mockId, email_confirmed_at: 'confirmed' } } }) }));
jest.mock('@/services/account-access', () => ({ getAccountAccess: jest.fn() }));
let mode: ReturnType<typeof useAccountMode>;
function Probe() { mode = useAccountMode(); return null; }
const approved: AccountAccess = { account_kind: 'teacher', teacher_status: 'approved', can_teach: true, application_reference: null, application_expires_at: null, application_received_at: null, review_reason: null };

it('keeps preview attached to the approved teacher, exits on suspension and does not carry it to another account', async () => {
  notifyManager.setScheduler((callback) => callback());
  const root = createRoot();
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  jest.mocked(getAccountAccess).mockResolvedValue(approved);
  const tree = () => createElement(QueryClientProvider, { client }, createElement(AccountModeProvider, null, createElement(Probe)));
  try {
    await act(async () => root.render(tree()));
    await act(async () => { await mode.refresh(); });
    expect(mode.isApprovedTeacher).toBe(true);
    await act(async () => mode.enterPreview());
    expect(mode.isPreview).toBe(true);
    jest.mocked(getAccountAccess).mockResolvedValue({ ...approved, teacher_status: 'suspended', can_teach: false });
    await act(async () => { await mode.refresh(); });
    expect(mode.isPreview).toBe(false);
    await act(async () => mode.enterPreview());
    expect(mode.isPreview).toBe(false);
    mockId = 'student-two';
    jest.mocked(getAccountAccess).mockResolvedValue({ ...approved, account_kind: 'student', teacher_status: 'not_started', can_teach: false });
    await act(async () => root.render(tree()));
    await act(async () => { await mode.refresh(); });
    expect(mode.isTeacher).toBe(false);
    expect(mode.isPreview).toBe(false);
  } finally {
    await act(async () => root.unmount());
    client.clear();
  }
});
