import { ro } from '@/i18n/ro';

type TranslationParams = Record<string, string | number>;

function getNestedValue(
  obj: Record<string, unknown>,
  path: string
): string | undefined {
  if (!obj || typeof obj !== 'object') {
    return undefined;
  }
  const parts = path.split('.');
  let current: unknown = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = (current as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

export function useTranslation() {
  const t = (key: string, params?: TranslationParams): string => {
    let text = getNestedValue(ro, key);
    if (text === undefined) {
      const flatValue = (ro as Record<string, unknown>)[key];
      text = typeof flatValue === 'string' ? flatValue : key;
    }
    if (typeof text !== 'string') {
      return key;
    }
    if (params) {
      Object.entries(params).forEach(([paramKey, val]) => {
        text = (text as string).split(`{${paramKey}}`).join(String(val));
      });
    }
    return text;
  };

  return { t, language: 'ro' };
}
