import { act, createElement } from 'react';
import { createRoot } from 'test-renderer';
import Booking from './booking';
const mockPayment = jest.fn();
jest.mock('@/constants/release-capabilities', () => ({
  TUTORING_BOOKINGS_ENABLED: false,
}));
jest.mock('@/providers/account-mode', () => ({
  useAccountMode: () => ({ isTeacher: false }),
}));
jest.mock('./shared', () => ({ TutoringPage: 'page', Note: 'note' }));
jest.mock('@/components/design', () => ({ Copy: 'copy', Panel: 'panel' }));
jest.mock('@/components/Button', () => ({ Button: 'button' }));
jest.mock('@/components/SelectField', () => ({ SelectField: 'select' }));
jest.mock('@/components/data-state', () => ({ DataState: 'state' }));
jest.mock('@/services/tutoring', () => ({
  tutoringPayment: (...args: unknown[]) => mockPayment(...args),
}));
jest.mock('@/hooks/use-app-router', () => ({ useAppRouter: jest.fn() }));
jest.mock('expo-router', () => ({ useLocalSearchParams: jest.fn() }));
jest.mock('expo-web-browser', () => ({ openBrowserAsync: jest.fn() }));
it('blocks a direct booking route before starting a query or payment', async () => {
  const root = createRoot();
  await act(async () => root.render(createElement(Booking)));
  expect(
    root.container.queryAll((node) => node.type === 'copy')[0].props.children
  ).toContain('Rezervările și plățile nu sunt deschise');
  expect(
    root.container.queryAll((node) => node.type === 'button')
  ).toHaveLength(0);
  expect(mockPayment).not.toHaveBeenCalled();
  await act(async () => root.unmount());
});
