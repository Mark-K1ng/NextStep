import { hash, clamp } from './upstream';
export type AsciiVariant = 'dither' | 'scan' | 'braille' | 'terminal';
export const patterns = {
  dither: { base: '░░░▒', wave: '▒▓█▓▒', opacity: 0.22 },
  scan: { base: '··:·-·', wave: '*+=#%@&', opacity: 0.28 },
  braille: { base: '⠂⠒⠑⠈⠢⠔', wave: '⣷⣯⣿⣟⣻⣽', opacity: 0.35 },
  terminal: { base: '010010', wave: '101101', opacity: 0.16 },
} as const;

/** Original deterministic generator: no random render/hydration differences. */
export function glyphs(seed: number, count: number, alphabet: string): string {
  let state = Math.abs(Math.trunc(seed)) % 4294967296 || 1;
  let result = '';
  const bounded = Math.max(0, Math.min(240, Math.floor(count)));
  for (let index = 0; index < bounded; index += 1) {
    state = (state * 1664525 + 1013904223) % 4294967296;
    result += alphabet[state % alphabet.length] || ' ';
  }
  return result;
}

export function glyphBlock(
  seed: number,
  columns: number,
  rows: number,
  alphabet: string
): string {
  return Array.from({ length: Math.max(1, Math.min(48, rows)) }, (_, index) =>
    glyphs(seed + index * 71, columns, alphabet)
  ).join('\n');
}

/** Worklet-safe text frame: real text is never changed in React state per frame. */
export function decodeFrame(
  characters: string[],
  progress: number,
  _tick: number,
  alphabet: string
): string {
  'worklet';
  if (progress >= 1) {
    return characters.join('');
  }
  let result = '';
  const length = characters.filter((char) => !/\s/.test(char)).length;
  const spread = Math.min(200, 40 + length * 4);
  const starts: number[] = [],
    ends: number[] = [];
  let total = 1;
  for (let k = 0; k < length; k += 1) {
    const start = (k / length) * spread * 0.72 + hash(k, 1, 1) * spread * 0.28;
    starts.push(start);
    const end = start + 90 + hash(k, 1, 2) * 110;
    ends.push(end);
    total = Math.max(total, end);
  }
  const elapsed = clamp(progress) * total;
  const ramp = ' .:-=+*#%@';
  let k = 0;
  for (const char of characters) {
    if (/\s/.test(char)) {
      result += char;
      continue;
    }
    if (elapsed >= ends[k]) {
      result += char;
    } else if (elapsed < starts[k]) {
      result += ' ';
    } else {
      const q = (elapsed - starts[k]) / (ends[k] - starts[k]);
      const t = Math.floor((elapsed + hash(k, 1, 3) * 1000) / 60);
      if (q < 0.7 && alphabet.length > 1) {
        let index = 1 + Math.floor((q / 0.7) * (ramp.length - 1));
        if (hash(k, t, 5) < 0.35) {
          index += hash(k, t, 6) < 0.5 ? -1 : 1;
        }
        result += ramp[clamp(index, 1, ramp.length - 1)];
      } else {
        result += alphabet[Math.floor(hash(k, t, 7) * alphabet.length)] || char;
      }
    }
    k += 1;
  }
  return result;
}

export const mascotFrames = {
  ghost: [" .-. \n(o o)\n| O |\n'~~~'", ' .-. \n(o o)\n| o |\n ~~~ '],
  robot: ['[o_o]\n /|\\ \n / \\ ', '[o_o]\n \\|/ \n / \\ '],
} as const;
