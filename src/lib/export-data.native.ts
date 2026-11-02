import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function clearDataExport() {
  const file = new File(Paths.cache, 'nextstep-export.json');
  if (file.exists) {
    file.delete();
  }
}

export async function saveDataExport(data: unknown) {
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('File sharing unavailable');
  }
  const file = new File(Paths.cache, 'nextstep-export.json');
  file.create({ overwrite: true });
  file.write(JSON.stringify(data, null, 2));
  await Sharing.shareAsync(file.uri, {
    mimeType: 'application/json',
    UTI: 'public.json',
    dialogTitle: 'NextStep — export date',
  });
}
