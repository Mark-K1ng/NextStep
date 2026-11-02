import { clamp, hash, sweepEase, variants } from './upstream';
import type { AsciiVariant } from './patterns';

/** Apply the reference shimmer only to cells occupied by the wrapped element. */
export function loadingSweep(
  variant: AsciiVariant,
  elapsed: number,
  width: number
) {
  'worklet';
  const v = variants[variant];
  const time = Math.floor(elapsed / 33) * 33;
  const band = width * v.band;
  const bx =
    (width - band) * (-1.2 + 3.4 * sweepEase((time % v.speed) / v.speed));
  return { time, band, bx };
}
export function loadingCell(
  variant: AsciiVariant,
  index: number,
  x: number,
  sweep: ReturnType<typeof loadingSweep>
) {
  'worklet';
  const v = variants[variant];
  const { time, band, bx } = sweep;
  const u = (x - bx) / Math.max(1, band);
  const strength =
    u < 0.45 ? clamp(u / 0.45) : u > 0.55 ? clamp((1 - u) / 0.45) : 1;
  const offset = Math.floor(time / 120) % 2 ? 600 : 300;
  return {
    base: v.base[
      Math.floor(Math.pow(hash(index, 97, 29), v.bias) * v.base.length)
    ],
    wave: v.wave[
      Math.floor(Math.pow(hash(index, 97 + offset, 29), v.bias) * v.wave.length)
    ],
    baseAlpha: v.baseAlpha,
    waveAlpha: strength * v.opacity,
  };
}
