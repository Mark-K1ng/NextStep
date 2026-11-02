/* Adapted from ascii-reveal, Quan Hoang, MIT. See ../UPSTREAM-LICENSE.
 * Source f602e204232d2d31de2b67c66a166bcdbde51602: core/util.ts,
 * skeleton.ts, skeleton-anim.ts, presets.ts and engine.ts.
 * Keep numerical behavior shared with the reference; only drawing is native.
 */
/* eslint-disable no-bitwise */
export function hash(a: number, b: number, c: number): number {
  'worklet';
  let h =
    Math.imul(a | 0, 0x27d4eb2d) ^
    Math.imul(((b | 0) + 0x9e3779b9) | 0, 0x85ebca6b) ^
    Math.imul(((c | 0) + 0x632be5ab) | 0, 0xc2b2ae35);
  h ^= h >>> 15;
  h = Math.imul(h, 0x2c1b3c6d);
  h ^= h >>> 12;
  h = Math.imul(h, 0x297a2d39);
  h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}
export function clamp(value: number, min = 0, max = 1) {
  'worklet';
  return Math.max(min, Math.min(max, value));
}
export function ease(value: number) {
  'worklet';
  return 1 - Math.pow(1 - clamp(value), 3);
}
export function easeIO(value: number) {
  'worklet';
  const x = clamp(value);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
}
export const variants = {
  dither: {
    base: '░░░░▒',
    wave: '▒▓▓█▓▒',
    gap: 0,
    bias: 0.9,
    baseAlpha: 0.22,
    opacity: 0.75,
    band: 0.55,
    speed: 1800,
  },
  scan: {
    base: '··:·:-',
    wave: '+=*#%@&$',
    gap: 0.08,
    bias: 1.6,
    baseAlpha: 0.28,
    opacity: 0.95,
    band: 0.38,
    speed: 1800,
  },
  braille: {
    base: '⠢⠔⠑⠊⠡⠌⠒⠤⠕⠪',
    wave: '⣿⣷⣯⣟⡿⢿⣻⣽⣾⣶',
    gap: 0.02,
    bias: 1,
    baseAlpha: 0.35,
    opacity: 1,
    band: 0.4,
    speed: 1800,
  },
  terminal: {
    base: '01',
    wave: '01',
    gap: 0.12,
    bias: 1,
    baseAlpha: 0.16,
    opacity: 1,
    band: 0.35,
    speed: 1500,
  },
} as const;
export function glyphRow(
  seed: number,
  len: number,
  ramp: string,
  gap: number,
  bias: number
): string {
  let out = '';
  for (let i = 0; i < len; i += 1) {
    out +=
      hash(i, seed, 17) < gap
        ? ' '
        : ramp[Math.floor(Math.pow(hash(i, seed, 29), bias) * ramp.length)];
  }
  return out;
}
export function sweepEase(p: number) {
  'worklet';
  // Same inversion as the reference LUT, evaluated at its 1/256 sample points.
  const t = Math.round(clamp(p) * 256) / 256;
  let lo = 0,
    hi = 1,
    u = t;
  for (let n = 0; n < 28; n += 1) {
    u = (lo + hi) / 2;
    const x = 3 * (1 - u) ** 2 * u * 0.45 + 3 * (1 - u) * u * u * 0.55 + u ** 3;
    if (x < t) {
      lo = u;
    } else {
      hi = u;
    }
  }
  return 3 * (1 - u) ** 2 * u * 0.05 + 3 * (1 - u) * u * u * 0.95 + u ** 3;
}
export const mediaPreset = {
  decode: {
    ramp: ' .:-=+*#%@',
    cells: [24, 16, 11, 8, 6],
    tick: 60,
    color: 'mono',
  },
  dither: {
    ramp: ' ░▒▓█',
    cells: [20, 14, 10, 7, 5],
    tick: 85,
    color: 'source',
  },
  terminal: {
    ramp: ' .-:=+*#',
    cells: [22, 15, 10, 7, 6],
    tick: 40,
    color: 'mono',
  },
  blueprint: {
    ramp: ' ·-+=x#',
    cells: [26, 18, 13, 9, 7],
    tick: 95,
    color: 'accent',
  },
} as const;
