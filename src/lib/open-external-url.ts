import { Linking } from 'react-native';
import { showMessage } from './show-message';

export async function openExternalUrl(value: string) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      throw new Error('Unsupported link');
    }
    await Linking.openURL(url.toString());
  } catch {
    showMessage('Linkul nu este disponibil sau nu poate fi deschis.');
  }
}
