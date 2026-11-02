import { clearDataExport, saveDataExport } from './export-data.native';
const mockCreate = jest.fn();
const mockWrite = jest.fn();
const mockDelete = jest.fn();
const mockAvailable = jest.fn();
const mockShare = jest.fn();
jest.mock('expo-file-system', () => ({
  Paths: { cache: 'cache://' },
  File: jest.fn().mockImplementation(() => ({
    uri: 'cache://nextstep-export.json',
    exists: true,
    create: (...args: unknown[]) => mockCreate(...args),
    write: (...args: unknown[]) => mockWrite(...args),
    delete: () => mockDelete(),
  })),
}));
jest.mock('expo-sharing', () => ({
  isAvailableAsync: () => mockAvailable(),
  shareAsync: (...args: unknown[]) => mockShare(...args),
}));
beforeEach(() => {
  jest.clearAllMocks();
  mockAvailable.mockResolvedValue(true);
  mockShare.mockResolvedValue(undefined);
});
it('writes valid JSON and shares a file with the JSON MIME type', async () => {
  await saveDataExport({ userId: 'owner', profile: { county: 'Bihor' } });
  expect(mockCreate).toHaveBeenCalledWith({ overwrite: true });
  expect(JSON.parse(mockWrite.mock.calls[0][0])).toEqual({
    userId: 'owner',
    profile: { county: 'Bihor' },
  });
  expect(mockShare).toHaveBeenCalledWith(
    'cache://nextstep-export.json',
    expect.objectContaining({ mimeType: 'application/json' })
  );
});
it('does not write private data when sharing is unavailable', async () => {
  mockAvailable.mockResolvedValue(false);
  await expect(saveDataExport({ userId: 'owner' })).rejects.toThrow();
  expect(mockWrite).not.toHaveBeenCalled();
  expect(mockShare).not.toHaveBeenCalled();
});
it('removes the temporary export when clearing deleted-account data', async () => {
  await clearDataExport();
  expect(mockDelete).toHaveBeenCalled();
});
