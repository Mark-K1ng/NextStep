import { readFileSync } from 'node:fs';
import { join } from 'node:path';

it('keeps the mutable reveal context out of compiled input worklet closures', () => {
  const { transformSync } = require('@babel/core');
  const source = readFileSync(
    join(process.cwd(), 'src/components/decoding-input.tsx'),
    'utf8'
  );
  const { code } = transformSync(source, {
    filename: join(process.cwd(), 'src/components/decoding-input.tsx'),
    configFile: false,
    babelrc: false,
    presets: [
      ['@babel/preset-typescript', { isTSX: true, allExtensions: true }],
    ],
    plugins: ['react-native-worklets/plugin'],
  });
  const closures = [...code.matchAll(/\.__closure\s*=\s*\[([^\]]*)\]/g)].map(
    (match: RegExpMatchArray) => match[1].split(',').map((name) => name.trim())
  );
  expect(closures.length).toBeGreaterThanOrEqual(5);
  expect(closures.flat()).not.toContain('animation');
  expect(closures.flat()).not.toContain('completion');
});
