import {
  createPalette,
  DEFAULT_COLOR,
  contrast,
  hexToRgb,
  rgbToHex,
  rgbToHsl,
  hslToRgb,
  rgbToHsv,
  hsvToRgb,
  normalizeHex,
} from './palette';
import { darkColors, lightColors } from './tokens';

// Independent reference values from Python's standard-library colorsys.
it.each([
  ['#000000', [0, 0, 0], [0, 0, 0]],
  ['#FFFFFF', [0, 0, 100], [0, 0, 100]],
  ['#808080', [0, 0, 50.196078431373], [0, 0, 50.196078431373]],
  ['#FF0000', [0, 100, 50], [0, 100, 100]],
  ['#FFFF00', [60, 100, 50], [60, 100, 100]],
  ['#00FF00', [120, 100, 50], [120, 100, 100]],
  ['#00FFFF', [180, 100, 50], [180, 100, 100]],
  ['#0000FF', [240, 100, 50], [240, 100, 100]],
  ['#FF00FF', [300, 100, 50], [300, 100, 100]],
  ['#663399', [270, 50, 40], [270, 66.666666666667, 60]],
  ['#7C3AED', [262.122905027933, 83.255813953488, 57.843137254902],
    [262.122905027933, 75.527426160338, 92.941176470588]],
  ['#B26E66', [6.315789473684, 33.043478260870, 54.901960784314],
    [6.315789473684, 42.696629213483, 69.803921568627]],
  ['#0102FE', [239.762845849802, 99.215686274510, 50],
    [239.762845849802, 99.606299212598, 99.607843137255]],
  ['#FEFDFC', [30, 50, 99.215686274510],
    [30, 0.787401574803, 99.607843137255]],
] as const)('matches independent HSL and HSV references for %s', (hex, hsl, hsv) => {
  const rgb = hexToRgb(hex);
  rgbToHsl(rgb).forEach((value, i) => expect(value).toBeCloseTo(hsl[i], 9));
  rgbToHsv(rgb).forEach((value, i) => expect(value).toBeCloseTo(hsv[i], 9));
  expect(hslToRgb([...hsl])).toEqual(rgb);
  expect(hsvToRgb([...hsv])).toEqual(rgb);
});

it('preserves all channels across a 4096-color RGB cube', () => {
  for (let r = 0; r <= 255; r += 17)
    for (let g = 0; g <= 255; g += 17)
      for (let b = 0; b <= 255; b += 17) {
        const rgb: [number, number, number] = [r, g, b];
        expect(hslToRgb(rgbToHsl(rgb))).toEqual(rgb);
        expect(hsvToRgb(rgbToHsv(rgb))).toEqual(rgb);
      }
});

it('treats both hue endpoints identically and handles achromatic HSL', () => {
  expect(hslToRgb([360, 100, 50])).toEqual([255, 0, 0]);
  expect(hsvToRgb([360, 100, 100])).toEqual([255, 0, 0]);
  expect(hslToRgb([123, 0, 50])).toEqual([128, 128, 128]);
  expect(hslToRgb([123, 100, 0])).toEqual([0, 0, 0]);
  expect(hslToRgb([123, 100, 100])).toEqual([255, 255, 255]);
});

it('restores the exact original palette and rejects malformed saved colors', () => {
  expect(createPalette(DEFAULT_COLOR, true)).toBe(darkColors);
  expect(createPalette(DEFAULT_COLOR, false)).toBe(lightColors);
  expect(createPalette('invalid', true)).toBe(darkColors);
  expect(normalizeHex('#ffcc00')).toBe('#FFCC00');
  expect(normalizeHex('#fff')).toBeNull();
});
it.each([
  '#000000',
  '#FFFFFF',
  '#808080',
  '#FF0000',
  '#00FF00',
  '#0000FF',
  '#7C3AED',
  '#10B981',
])('round-trips %s through each editable color space', (hex) => {
  const rgb = hexToRgb(hex);
  expect(rgbToHex(hslToRgb(rgbToHsl(rgb)))).toBe(hex);
  expect(rgbToHex(hsvToRgb(rgbToHsv(rgb)))).toBe(hex);
});
it.each([true, false])(
  'generates readable palettes across the full color wheel (dark=%s)',
  (dark) => {
    const seeds = ['#000000', '#FFFFFF', '#808080'];
    for (let h = 0; h < 360; h += 15)
      for (const l of [5, 25, 50, 75, 95])
        seeds.push(rgbToHex(hslToRgb([h, 100, l])));
    for (const seed of seeds) {
      const palette = createPalette(seed, dark);
      expect(palette.primary).toBe(seed);
      expect(palette.isDark).toBe(dark);
      expect(palette.danger).toBe(darkColors.danger);
      expect(palette.warning).toBe(darkColors.warning);
      expect(palette.success).toBe(darkColors.success);
      for (const foreground of [
        palette.textPrimary,
        palette.textSecondary,
        palette.accentText,
        palette.successText,
        palette.warningText,
        palette.dangerText,
      ]) {
        for (const background of [
          palette.background,
          palette.surface,
          palette.surfaceElevated,
        ])
          expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
      }
      expect(contrast(palette.onAccent, palette.accent)).toBeGreaterThanOrEqual(
        4.5
      );
      for (const surface of [
        palette.background,
        palette.surface,
        palette.surfaceElevated,
      ]) {
        for (const alpha of [0x1f / 255, 0x26 / 255]) {
          const accent = hexToRgb(palette.accent);
          const tinted = rgbToHex(
            hexToRgb(surface).map(
              (channel, i) => channel * (1 - alpha) + accent[i] * alpha
            ) as [number, number, number]
          );
          expect(contrast(palette.accentText, tinted)).toBeGreaterThanOrEqual(
            4.5
          );
        }
      }
      if (!dark) {
        expect(palette.background).toBe(lightColors.background);
        expect(palette.surface).toBe(lightColors.surface);
        expect(palette.surfaceElevated).toBe(lightColors.surfaceElevated);
      }
    }
  }
);
