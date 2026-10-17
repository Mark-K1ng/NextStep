import { typography as tokens } from './tokens';

export const display = {
  fontFamily: 'PlusJakartaSans-Medium',
  fontSize: tokens.fontSize.display,
  fontWeight: 'bold' as const,
  fontStyle: 'italic' as const,
};

export const title = {
  fontFamily: 'PlusJakartaSans-Medium',
  fontSize: tokens.fontSize.title,
  fontWeight: 'bold' as const,
  fontStyle: 'italic' as const,
};

export const heading = {
  fontFamily: 'PlusJakartaSans-Medium',
  fontSize: tokens.fontSize.heading,
  fontWeight: '600' as const,
};

export const body = {
  fontFamily: 'PlusJakartaSans-Medium',
  fontSize: tokens.fontSize.body,
  fontWeight: 'normal' as const,
};

export const caption = {
  fontFamily: 'PlusJakartaSans-Medium',
  fontSize: tokens.fontSize.caption,
  fontWeight: 'normal' as const,
};

export const label = {
  fontFamily: 'PlusJakartaSans-Medium',
  fontSize: tokens.fontSize.label,
  fontWeight: 'medium' as const,
};
