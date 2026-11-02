import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { useTranslation } from './use-translation';

it('interpolates every occurrence without treating replacement text as a regex replacement', () => {
  const { t } = useTranslation();
  expect(t('home.greeting', { name: '$&' })).toBe('Bună, $&!');
  expect(t('missing.translation')).toBe('missing.translation');
});

it('has Romanian copy for every literal translation key used by a screen', () => {
  const { t } = useTranslation();
  const missing: string[] = [];
  const walk = (folder: string) => {
    for (const entry of readdirSync(folder, { withFileTypes: true })) {
      const path = join(folder, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (path.endsWith('.tsx') && !path.includes('.test.')) {
        for (const match of readFileSync(path, 'utf8').matchAll(/\bt\(['"]([^'"]+)['"]/g)) {
          if (t(match[1]) === match[1]) missing.push(match[1]);
        }
      }
    }
  };
  walk(join(__dirname, '..', 'app'));
  walk(join(__dirname, '..', 'features'));
  expect(missing).toEqual([]);
});
