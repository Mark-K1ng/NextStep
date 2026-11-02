import { darkTheme, lightTheme } from './tokens';
const luminance = (hex: string) => {
  const values = hex
    .slice(1)
    .match(/../g)!
    .map((value) => parseInt(value, 16) / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
    );
  return values[0] * 0.2126 + values[1] * 0.7152 + values[2] * 0.0722;
};
const contrast = (a: string, b: string) => {
  const values = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (values[0] + 0.05) / (values[1] + 0.05);
};
it.each([darkTheme, lightTheme])(
  'keeps normal text, selected labels and destructive labels readable on each content surface',
  (theme) => {
    for (const foreground of [
      theme.textPrimary,
      theme.textSecondary,
      theme.accentText,
      theme.dangerText,
      theme.successText,
      theme.warningText,
    ]) {
      for (const background of [
        theme.background,
        theme.surface,
        theme.surfaceElevated,
      ])
        expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrast(theme.onAccent, theme.accent)).toBeGreaterThanOrEqual(4.5);
  }
);
