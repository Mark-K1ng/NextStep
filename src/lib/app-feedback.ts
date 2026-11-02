import Constants from 'expo-constants';
import { Platform, Share } from 'react-native';
import * as Linking from 'expo-linking';

export function appVersionLabel() {
  const config = Constants.expoConfig;
  const build =
    Platform.OS === 'android'
      ? config?.android?.versionCode
      : config?.ios?.buildNumber;
  return `${config?.version ?? '—'}${build ? ` (${build})` : ''}`;
}

export function feedbackReport(message: string) {
  return `Feedback NextStep ${appVersionLabel()}\n${Platform.OS} ${Platform.Version}\n\n${message.trim()}`;
}

export async function openFeedback(message: string) {
  const report = feedbackReport(message);
  const email = process.env.EXPO_PUBLIC_FEEDBACK_EMAIL?.trim();
  if (email && /^[^\s@?&#]+@[^\s@?&#]+\.[^\s@?&#]+$/.test(email)) {
    try {
      await Linking.openURL(
        `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent('Feedback NextStep')}&body=${encodeURIComponent(report)}`
      );
      return;
    } catch {
      // A device without an email app can still share or copy the report.
    }
  }
  await Share.share({ title: 'Feedback NextStep', message: report });
}
