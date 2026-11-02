import { glyphRow, sweepEase, variants } from '../../packages/ascii-reveal-native/src/upstream';
import { buildMediaGrid } from '../../packages/ascii-reveal-native/src/media-grid';

it.each([
  ['dither', '░░░░░░░░▒░░░░░░░░░░░▒▒░░'],
  ['scan', '········-:······:·:·-:  '],
  ['braille', '⠔⠢⠡⠌⠤⠑⠊⠔⠪⠌⠢⠢⠡⠔⠔⠢⠌⠒⠒⠢⠪⠕⠢ '],
  ['terminal', '00 1100011000000111011  '],
] as const)('matches upstream 0.3.0 %s glyph fixtures', (name, expected) => {
  const v = variants[name];
  expect(glyphRow(97, 24, v.base, v.gap, v.bias)).toBe(expected);
});
it('matches the reference sweep endpoints, symmetry and slow entry/exit', () => {
  expect(sweepEase(0)).toBeCloseTo(0, 7);
  expect(sweepEase(1)).toBeCloseTo(1, 7);
  expect(sweepEase(0.5)).toBeCloseTo(0.5, 7);
  expect(sweepEase(0.25)).toBeLessThan(0.25);
  expect(sweepEase(0.25) + sweepEase(0.75)).toBeCloseTo(1, 7);
});
it('samples actual contrasting pixels and leaves transparent/background areas empty', () => {
  const transparent = new Uint8Array(4 * 16 * 16);
  expect(buildMediaGrid(64, 64, transparent, 16, 16, [0, 0, 0], 'dither', 'center').every(s => !s.glyphs.length)).toBe(true);
  const white = new Uint8Array(4 * 16 * 16).fill(255);
  const grid = buildMediaGrid(64, 64, white, 16, 16, [0, 0, 0], 'dither', 'center');
  expect(grid).toHaveLength(5);
  expect(grid[4].glyphs.length).toBeGreaterThan(grid[0].glyphs.length);
  expect(grid[0].glyphs[0].ink).toBeCloseTo(1);
  expect(grid[0].glyphs[0].color).toBe('rgb(255,255,255)');
  expect(buildMediaGrid(64, 64, white, 16, 16, [255, 255, 255], 'dither', 'center').every(s => !s.glyphs.length)).toBe(true);
});
