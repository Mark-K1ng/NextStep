/* Native adaptation of ascii-reveal mediaTarget/buildStep, MIT, Quan Hoang.
 * See ../UPSTREAM-LICENSE. Sampling is supplied by the native renderer.
 */
import { clamp, hash, mediaPreset } from './upstream';
export interface GridCell {
  x: number;
  y: number;
  gate: number;
  ink: number;
  color: string;
}
export interface GridStep {
  cell: number;
  glyphs: GridCell[];
}
export function buildMediaGrid(
  width: number,
  height: number,
  pixels: Uint8Array,
  pixelWidth: number,
  pixelHeight: number,
  background: number[],
  preset: keyof typeof mediaPreset,
  origin: 'left' | 'center'
): GridStep[] {
  const p = mediaPreset[preset];
  const scale = clamp(Math.min(width, height) / 230, 0.4, 1);
  const bgLum =
    (0.2126 * background[0] + 0.7152 * background[1] + 0.0722 * background[2]) /
    255;
  const ox = origin === 'center' ? width / 2 : 0,
    oy = origin === 'center' ? height / 2 : 0;
  const maxD =
    Math.max(
      Math.hypot(ox, oy),
      Math.hypot(width - ox, oy),
      Math.hypot(ox, height - oy),
      Math.hypot(width - ox, height - oy)
    ) || 1;
  const sample = (x: number, y: number) => {
    const ix = Math.floor(clamp((x / width) * pixelWidth, 0, pixelWidth - 1)),
      iy = Math.floor(clamp((y / height) * pixelHeight, 0, pixelHeight - 1));
    const at = (iy * pixelWidth + ix) * 4,
      a = pixels[at + 3] / 255;
    const r = pixels[at] * a + background[0] * (1 - a),
      g = pixels[at + 1] * a + background[1] * (1 - a),
      b = pixels[at + 2] * a + background[2] * (1 - a);
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    return {
      ink: Math.abs(lum - bgLum) / Math.max(bgLum, 1 - bgLum),
      color: `rgb(${Math.floor(r)},${Math.floor(g)},${Math.floor(b)})`,
    };
  };
  return p.cells.map((size) => {
    // Keep the reference cell sizes; cap total cells only for giant native views.
    const cell = Math.max(3, size * scale, Math.sqrt((width * height) / 9000));
    const cw = cell * 0.62,
      cols = Math.ceil(width / cw),
      rows = Math.ceil(height / cell),
      glyphs: GridCell[] = [];
    for (let gy = 0; gy < rows; gy += 1) {
      for (let gx = 0; gx < cols; gx += 1) {
        const x = (gx + 0.5) * cw,
          y = (gy + 0.5) * cell,
          dx = cw / 3,
          dy = cell / 3;
        const samples = [
          sample(x, y),
          sample(x - dx, y - dy),
          sample(x + dx, y - dy),
          sample(x - dx, y + dy),
          sample(x + dx, y + dy),
        ];
        const best = samples.reduce((a, b) => (a.ink > b.ink ? a : b));
        if (best.ink < 0.04) {
          continue;
        }
        glyphs.push({
          x,
          y,
          ink: best.ink,
          color: best.color,
          gate:
            0.5 * hash(Math.floor(x / 6), Math.floor(y / 6), 11) +
            (0.5 * Math.hypot(x - ox, y - oy)) / maxD,
        });
      }
    }
    return { cell, glyphs };
  });
}
