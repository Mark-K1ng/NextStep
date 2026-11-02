import type { PropsWithChildren } from 'react';
import { AsciiSkin } from '@/components/ascii-skin';
import { radius } from '@/theme/tokens';
import type { PreviewElement } from './loading-preview-catalogue';

/** Shape comes from the mounted child. Only its existing layout/corner contract is selected here. */
export function previewSkinOptions(id: PreviewElement[0]) {
  const internal =
    id.startsWith('button-') ||
    id.startsWith('text-') ||
    [
      'input',
      'email',
      'password',
      'search',
      'multiline',
      'input-error',
      'select',
      'account',
      'social',
      'brand',
      'row',
      'compact-row',
      'group',
      'section',
      'panel',
      'accent-panel',
      'detail',
      'path-step',
      'catalogue',
      'admission',
      'tutor',
      'qa',
      'empty',
      'error',
      'choice',
      'radio',
      'badge',
    ].includes(id);
  const fit =
    id.startsWith('text-') ||
    [
      'back',
      'bookmark',
      'icon',
      'filter',
      'choice',
      'radio',
      'badge',
      'avatar',
      'wheel',
      'image',
      'swatch',
    ].includes(id);
  const corner = ['avatar', 'wheel'].includes(id)
    ? radius.full
    : ['back', 'choice', 'radio'].includes(id)
      ? 24
      : ['badge', 'progress', 'swatch'].includes(id)
        ? radius.sm
        : [
              'icon',
              'choice',
              'radio',
              'panel',
              'accent-panel',
              'group',
              'catalogue',
              'tutor',
            ].includes(id)
          ? radius.md
          : 0;
  return { internal, fit, radius: corner };
}
export function PreviewElementSkin({
  id,
  enabled,
  active,
  children,
}: PropsWithChildren<{
  id: PreviewElement[0];
  enabled: boolean;
  active?: boolean;
}>) {
  return (
    <AsciiSkin enabled={enabled} active={active} {...previewSkinOptions(id)}>
      {children}
    </AsciiSkin>
  );
}
