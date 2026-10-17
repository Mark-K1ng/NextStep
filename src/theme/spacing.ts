import { spacing as spacingTokens, radius as radiusTokens } from './tokens';

export const spacing = {
  xs: spacingTokens.xs,
  sm: spacingTokens.sm,
  md: spacingTokens.md,
  lg: spacingTokens.lg,
  xl: spacingTokens.xl,
  xxl: spacingTokens.xxl,
  xxxl: spacingTokens.xxxl,
} as const;

export const radius = {
  sm: radiusTokens.sm,
  md: radiusTokens.md,
  lg: radiusTokens.lg,
} as const;

export type Spacing = typeof spacing;
export type Radius = typeof radius;
