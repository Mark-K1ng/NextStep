import { darkColors, lightColors } from './tokens';

export const DEFAULT_COLOR = '#7C3AED';
export type RGB = [number, number, number];
export type HSL = [number, number, number];
export const clamp = (n: number, max = 100) => Math.max(0, Math.min(max, n));
export const normalizeHex = (hex: string) =>
  /^#[0-9a-f]{6}$/i.test(hex) ? hex.toUpperCase() : null;
export const hexToRgb = (hex: string): RGB =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as RGB;
export const rgbToHex = (rgb: RGB) =>
  '#' +
  rgb
    .map((n) => Math.round(clamp(n, 255)).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

export function rgbToHsl(rgb: RGB): HSL {
  const [r, g, b] = rgb.map((n) => n / 255);
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  const d = max - min,
    l = (max + min) / 2;
  if (!d) {
    return [0, 0, l * 100];
  }
  const h =
    max === r
      ? ((g - b) / d + 6) % 6
      : max === g
        ? (b - r) / d + 2
        : (r - g) / d + 4;
  return [h * 60, (d / (1 - Math.abs(2 * l - 1))) * 100, l * 100];
}

export function hslToRgb([h, s, l]: HSL): RGB {
  s = clamp(s) / 100;
  l = clamp(l) / 100;
  h = (((h % 360) + 360) % 360) / 60;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs((h % 2) - 1));
  const m = l - c / 2;
  const channels =
    h < 1
      ? [c, x, 0]
      : h < 2
        ? [x, c, 0]
        : h < 3
          ? [0, c, x]
          : h < 4
            ? [0, x, c]
            : h < 5
              ? [x, 0, c]
              : [c, 0, x];
  return channels.map((n) => Math.round((n + m) * 255)) as RGB;
}

export function rgbToHsv(rgb: RGB): HSL {
  const h = rgbToHsl(rgb)[0];
  const max = Math.max(...rgb),
    min = Math.min(...rgb);
  return [h, max ? ((max - min) / max) * 100 : 0, (max / 255) * 100];
}
export function hsvToRgb([h, s, v]: HSL): RGB {
  'worklet';
  const saturation = Math.max(0, Math.min(100, s)) / 100;
  const value = Math.max(0, Math.min(100, v)) / 100;
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return Math.round(
      (value - value * saturation * Math.max(0, Math.min(k, 4 - k, 1))) * 255
    );
  };
  return [f(5), f(3), f(1)];
}

function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((n) => {
    const v = n / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}
export function contrast(a: string, b: string) {
  const x = luminance(a),
    y = luminance(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}
function readable(color: string, surfaces: string[], dark: boolean) {
  const [h, s, l] = rgbToHsl(hexToRgb(color));
  for (let step = 0; step <= 100; step++) {
    const candidate = rgbToHex(
      hslToRgb([h, s, dark ? Math.min(100, l + step) : Math.max(0, l - step)])
    );
    if (surfaces.every((bg) => contrast(candidate, bg) >= 4.5)) {
      return candidate;
    }
  }
  return dark ? '#FFFFFF' : '#000000';
}

/** Shift the original palette relative to its base; never tint semantic status colors. */
export function createPalette(hex: string, dark: boolean) {
  const base = dark ? darkColors : lightColors;
  const selected = normalizeHex(hex) ?? DEFAULT_COLOR;
  if (selected === DEFAULT_COLOR) {
    return base;
  }
  const original = rgbToHsl(hexToRgb(DEFAULT_COLOR));
  const chosen = rgbToHsl(hexToRgb(selected));
  const derive = (color: string, surface = false) => {
    const [h, s, l] = rgbToHsl(hexToRgb(color));
    return rgbToHex(
      hslToRgb([
        h + chosen[0] - original[0],
        clamp((s * chosen[1]) / original[1]),
        surface ? l : clamp(l + chosen[2] - original[2]),
      ])
    );
  };
  const palette = {
    ...base,
    primary: selected,
    primaryPressed: derive(base.primaryPressed),
    accent: derive(base.accent),
    accentText: derive(base.accentText),
    ...(dark
      ? {
          background: derive(base.background, true),
          surface: derive(base.surface, true),
          surfaceElevated: derive(base.surfaceElevated, true),
          border: derive(base.border, true),
          textPrimary: derive(base.textPrimary, true),
          textSecondary: derive(base.textSecondary, true),
        }
      : {}),
  };
  const surfaces = [
    palette.background,
    palette.surface,
    palette.surfaceElevated,
  ];
  // Existing choices, selected rows and navigation use 12–15% accent overlays.
  const accentRgb = hexToRgb(palette.accent);
  const textSurfaces = [
    ...surfaces,
    ...surfaces.flatMap((surface) =>
      [0x1f / 255, 0x26 / 255].map((alpha) =>
        rgbToHex(
          hexToRgb(surface).map(
            (channel, i) => channel * (1 - alpha) + accentRgb[i] * alpha
          ) as RGB
        )
      )
    ),
  ];
  for (const key of [
    'textPrimary',
    'textSecondary',
    'accentText',
    'successText',
    'warningText',
    'dangerText',
  ] as const) {
    palette[key] = readable(palette[key], textSurfaces, dark);
  }
  palette.onAccent =
    contrast('#18171F', palette.accent) >= 4.5
      ? '#18171F'
      : contrast('#FFFFFF', palette.accent) >= 4.5
        ? '#FFFFFF'
        : '#000000';
  return palette;
}
