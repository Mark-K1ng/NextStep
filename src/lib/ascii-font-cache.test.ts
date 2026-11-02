import { bundledTypeface } from '../../packages/ascii-reveal-native/src/font.native';
import { loadData } from '@shopify/react-native-skia';
jest.mock('@shopify/react-native-skia', () => ({ loadData: jest.fn(async () => ({ type: 'typeface' })), Skia: {} }));
it('parses one typeface per asset across concurrent cells and repeated remounts', async () => {
  const faces = await Promise.all(Array.from({ length: 100 }, () => bundledTypeface(1001)));
  expect(loadData).toHaveBeenCalledTimes(1);
  expect(faces.every(face => face === faces[0])).toBe(true);
  await bundledTypeface(1001);
  expect(loadData).toHaveBeenCalledTimes(1);
  await bundledTypeface(1002);
  expect(loadData).toHaveBeenCalledTimes(2);
});
it('allows a failed native font read to retry on a later mount', async () => {
  jest.mocked(loadData).mockRejectedValueOnce(new Error('read failed'));
  expect(await bundledTypeface(1003)).toBeNull();
  expect(await bundledTypeface(1003)).not.toBeNull();
});
