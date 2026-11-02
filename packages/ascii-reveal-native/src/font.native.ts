import { useEffect, useMemo, useState } from 'react';
import {
  loadData,
  matchFont,
  Skia,
  type SkTypeface,
} from '@shopify/react-native-skia';
import type { AsciiVariant } from './patterns';

// Cache the two immutable bundled typefaces, including concurrent first loads.
// Each consumer still owns its mutable SkFont (reveal changes its size).
const typefaces = new Map<number, Promise<SkTypeface | null>>();
export function bundledTypeface(source: number): Promise<SkTypeface | null> {
  const existing = typefaces.get(source);
  if (existing) {
    return existing;
  }
  const promise = loadData(source, (data) =>
    Skia.Typeface.MakeFreeTypeFaceFromData(data)
  )
    .then((value) => {
      if (!value) {
        typefaces.delete(source);
      }
      return value;
    })
    .catch(() => {
      typefaces.delete(source);
      return null;
    });
  typefaces.set(source, promise);
  return promise;
}
export function useAsciiFont(
  variant: AsciiVariant,
  size: number,
  family?: string
) {
  const source: number =
    variant === 'braille'
      ? // Metro's static asset resolution requires literal require calls.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('../assets/DejaVuSans.ttf')
      : // eslint-disable-next-line @typescript-eslint/no-require-imports
        require('../assets/DejaVuSansMono.ttf');
  const [loaded, setLoaded] = useState<{
    source: number;
    typeface: SkTypeface;
  } | null>(null);
  useEffect(() => {
    if (family) {
      return;
    }
    let live = true;
    bundledTypeface(source).then((typeface) => {
      if (live && typeface) {
        setLoaded({ source, typeface });
      }
    });
    return () => {
      live = false;
    };
  }, [source, family]);
  return useMemo(() => {
    if (family) {
      return matchFont({ fontFamily: family, fontSize: size });
    }
    return loaded?.source === source ? Skia.Font(loaded.typeface, size) : null;
  }, [source, loaded, family, size]);
}
