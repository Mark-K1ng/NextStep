import { appVersionLabel, feedbackReport, openFeedback } from './app-feedback';
import * as Linking from 'expo-linking';
import { Share } from 'react-native';
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { version: '1.0.0', android: { versionCode: 1 } } },
}));
jest.mock('react-native', () => ({
  Platform: { OS: 'android', Version: 36 },
  Share: { share: jest.fn(async () => ({})) },
}));
jest.mock('expo-linking', () => ({ openURL: jest.fn() }));
const original = process.env.EXPO_PUBLIC_FEEDBACK_EMAIL;
beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.EXPO_PUBLIC_FEEDBACK_EMAIL;
});
afterAll(() => {
  if (original === undefined) delete process.env.EXPO_PUBLIC_FEEDBACK_EMAIL;
  else process.env.EXPO_PUBLIC_FEEDBACK_EMAIL = original;
});
it('includes only the entered report, app version and OS metadata', () => {
  expect(appVersionLabel()).toBe('1.0.0 (1)');
  expect(feedbackReport('  Search closes  ')).toBe(
    'Feedback NextStep 1.0.0 (1)\nandroid 36\n\nSearch closes'
  );
});
it('offers sharing when a contact has not been configured', async () => {
  await openFeedback('Search closes');
  expect(Share.share).toHaveBeenCalledWith(
    expect.objectContaining({
      message: expect.stringContaining('Search closes'),
    })
  );
  expect(Linking.openURL).not.toHaveBeenCalled();
});
it('encodes an email draft and falls back when no mail app is installed', async () => {
  process.env.EXPO_PUBLIC_FEEDBACK_EMAIL = 'pilot@example.com';
  jest.mocked(Linking.openURL).mockRejectedValueOnce(new Error('No handler'));
  await openFeedback('A & B?');
  expect(Linking.openURL).toHaveBeenCalledWith(
    expect.stringContaining('A%20%26%20B%3F')
  );
  expect(Share.share).toHaveBeenCalledTimes(1);
});
it('rejects malformed contact addresses without losing the report', async () => {
  process.env.EXPO_PUBLIC_FEEDBACK_EMAIL =
    'pilot@example.com?bcc=other@example.com';
  await openFeedback('My report');
  expect(Linking.openURL).not.toHaveBeenCalled();
  expect(Share.share).toHaveBeenCalledTimes(1);
});
