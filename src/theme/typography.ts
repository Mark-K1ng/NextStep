import { typography as tokens } from './tokens';

export const display = {
  fontFamily: 'PlusJakartaSans-Medium',
  fontSize: tokens.fontSize.display,
  fontWeight: 'bold' as const,
  fontStyle: 'italic' as const,
  lineHeight: tokens.fontSize.display * 1.4,
};

export const title = {
  fontFamily: 'PlusJakartaSans-Medium',
  fontSize: tokens.fontSize.title,
  fontWeight: 'bold' as const,
  fontStyle: 'italic' as const,
  lineHeight: tokens.fontSize.title * 1.4,
};

export const heading = {
  fontFamily: 'PlusJakartaSans-Medium',
  fontSize: tokens.fontSize.heading,
  fontWeight: '600' as const,
  lineHeight: tokens.fontSize.heading * 1.5,
};

export const body = {
  fontFamily: 'PlusJakartaSans-Medium',
  fontSize: tokens.fontSize.body,
  fontWeight: 'normal' as const,
  lineHeight: tokens.fontSize.body * 1.6,
};

export const caption = {
  fontFamily: 'PlusJakartaSans-Medium',
  fontSize: tokens.fontSize.caption,
  fontWeight: 'normal' as const,
  lineHeight: tokens.fontSize.caption * 1.5,
};

export const label = {
  fontFamily: 'PlusJakartaSans-Medium',
  fontSize: tokens.fontSize.label,
  fontWeight: 'medium' as const,
  lineHeight: tokens.fontSize.label * 1.5,
};
