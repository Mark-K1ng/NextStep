import { Alert, Platform } from 'react-native';
export function showMessage(message: string) {
  if (Platform.OS === 'web') {
    globalThis.alert(message);
  } else {
    Alert.alert('NextStep', message);
  }
}
