import { Fragment, useCallback, useRef, useState } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Host, Slider } from '@expo/ui';
import { Bookmark, Minus, Plus, RotateCcw } from 'lucide-react-native';
import { Button, Input } from '@/components';
import { MotionPressable, StateFeedback } from '@/components/motion';
import { BackHeader, Copy, Panel, Screen } from '@/components/design';
import { ColorWheel } from '@/components/color-wheel';
import { usePalettePreference } from '@/providers/palette';
import { useTheme } from '@/hooks/use-theme';
import { useToast } from '@/providers/toast';
import {
  DEFAULT_COLOR,
  hexToRgb,
  hslToRgb,
  hsvToRgb,
  normalizeHex,
  rgbToHex,
  rgbToHsl,
  rgbToHsv,
  type HSL,
  type RGB,
} from '@/theme/palette';
import { radius, spacing as s } from '@/theme/tokens';

const spaces = {
  RGB: ['R', 'G', 'B'],
  HSL: ['H', 'S', 'L'],
} as const;
type Space = keyof typeof spaces;
const paletteRoles = [
  ['primary', 'Culoare principală', 'Prim.'],
  ['primaryPressed', 'Culoare la apăsare', 'Apăs.'],
  ['accent', 'Accent', 'Acc.'],
  ['accentText', 'Text de accent', 'T.acc'],
  ['background', 'Fundal', 'Fund.'],
  ['surface', 'Suprafață', 'Sup.'],
  ['surfaceElevated', 'Suprafață ridicată', 'Sup.+'],
  ['border', 'Contur', 'Cont.'],
  ['textSecondary', 'Text secundar', 'T.sec'],
] as const;
const limit = (space: Space, index: number) =>
  space === 'RGB' ? 255 : space === 'HSL' && index === 0 ? 360 : 100;
function valid(space: Space, values: string[]) {
  return values.every(
    (text, i) => /^\d+$/.test(text) && Number(text) <= limit(space, i)
  );
}
const parseHexInput = (text: string) => {
  const trimmed = text.trim();
  return normalizeHex(trimmed.startsWith('#') ? trimmed : `#${trimmed}`);
};

function BrightnessStep({
  direction,
  disabled,
  onPress,
}: {
  direction: -1 | 1;
  disabled: boolean;
  onPress(): void;
}) {
  const theme = useTheme();
  const Icon = direction === -1 ? Minus : Plus;
  return (
    <MotionPressable
      accessibilityRole='button'
      accessibilityLabel={
        direction === -1
          ? 'Scade luminozitatea cu 1%'
          : 'Crește luminozitatea cu 1%'
      }
      accessibilityState={{ disabled }}
      disabled={disabled}
      hitSlop={s.sm}
      onPress={onPress}
      style={styles.stepTarget}
    >
      <View
        style={[
          styles.stepSurface,
          {
            backgroundColor: theme.surfaceElevated,
            borderColor: theme.border,
          },
          disabled && styles.stepDisabled,
        ]}
      >
        <Icon size={18} color={theme.textPrimary} />
      </View>
    </MotionPressable>
  );
}

export default function PaletteEditor() {
  const { savedColor, ready, loadError, preview, save, retry } =
    usePalettePreference();
  const theme = useTheme();
  const { width, fontScale = 1 } = useWindowDimensions();
  const toast = useToast();
  const contentWidth = Math.min(width - s.lg * 4, 536);
  const stackFormats = contentWidth / fontScale < 288;
  const wheelSize = stackFormats
    ? contentWidth
    : Math.min(contentWidth, Math.max(192, Math.min(208, contentWidth * 0.56)));
  const [hex, setHex] = useState(savedColor);
  const [hexInput, setHexInput] = useState<string | null>(null);
  const [hsv, setHsv] = useState<HSL>(() => rgbToHsv(hexToRgb(savedColor)));
  const [editing, setEditing] = useState<{
    space: Space;
    values: string[];
  } | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);
  const writing = useRef(false);
  const active = useRef(false);
  useFocusEffect(
    useCallback(() => {
      active.current = true;
      setHex(savedColor);
      setHsv(rgbToHsv(hexToRgb(savedColor)));
      setEditing(null);
      setHexInput(null);
      return () => {
        active.current = false;
        preview(null);
      };
    }, [savedColor, preview])
  );
  const apply = (next: string, nextHsv = rgbToHsv(hexToRgb(next))) => {
    setHex(next);
    setHsv(nextHsv);
    preview(next);
    setMessage('');
    setFailed(false);
  };
  const fromWheel = (next: HSL) => {
    if (!active.current || saving) {
      return;
    }
    setEditing(null);
    setHexInput(null);
    apply(rgbToHex(hsvToRgb(next)), next);
  };
  const rgb = hexToRgb(hex);
  const values = { RGB: rgb, HSL: rgbToHsl(rgb) };
  const invalidNumbers =
    editing !== null && !valid(editing.space, editing.values);
  const invalidHex = hexInput !== null && !parseHexInput(hexInput);
  const invalid = invalidNumbers || invalidHex;
  const matchesSaved = ready && !loadError && !invalid && hex === savedColor;
  const saved = matchesSaved && hex !== DEFAULT_COLOR;
  const saveDisabled = !ready || loadError || invalid || matchesSaved || saving;
  const resetDisabled =
    saving ||
    !ready ||
    loadError ||
    (hex === DEFAULT_COLOR &&
      savedColor === DEFAULT_COLOR &&
      !invalid &&
      !failed);
  const brightnessPercent = Math.round(hsv[2]);
  const adjustBrightness = (delta: number) =>
    fromWheel([
      hsv[0],
      hsv[1],
      Math.max(0, Math.min(100, brightnessPercent + delta)),
    ]);
  const persistColor = async (color: string, reset = false) => {
    if (writing.current || !ready || loadError) {
      return;
    }
    writing.current = true;
    setSaving(true);
    setMessage('');
    setFailed(false);
    try {
      await save(color);
      if (active.current) {
        toast(
          reset
            ? 'Culoarea implicită a fost restaurată și salvată.'
            : color === DEFAULT_COLOR
              ? 'Paleta implicită a fost salvată pe acest dispozitiv.'
              : 'Paleta a fost salvată pe acest dispozitiv.',
          'success'
        );
      }
    } catch {
      if (active.current) {
        setFailed(true);
        setMessage(
          reset
            ? 'Culoarea implicită nu a putut fi salvată. Apasă din nou Resetează.'
            : 'Paleta nu a putut fi salvată. Încearcă din nou.'
        );
      }
    } finally {
      writing.current = false;
      setSaving(false);
    }
  };
  const actions = (
    <View style={styles.headerActions}>
      <MotionPressable
        accessibilityRole='button'
        accessibilityLabel='Salvează paleta'
        accessibilityHint='Păstrează culoarea pe acest dispozitiv.'
        aria-pressed={saved}
        accessibilityState={{
          selected: saved,
          disabled: saveDisabled,
          busy: saving,
        }}
        disabled={saveDisabled}
        onPress={() => {
          if (!saveDisabled) {
            return persistColor(hex);
          }
        }}
        style={({ pressed }) => [
          styles.iconAction,
          { opacity: pressed || saving ? 0.7 : 1 },
        ]}
      >
        <StateFeedback value={saved}>
          <Bookmark
            size={22}
            color={saved ? theme.accentText : theme.textSecondary}
            fill={saved ? theme.accentText : 'none'}
          />
        </StateFeedback>
      </MotionPressable>
      <MotionPressable
        accessibilityRole='button'
        accessibilityLabel='Resetează la violetul original'
        accessibilityHint='Restaurează și salvează imediat culoarea implicită pe acest dispozitiv.'
        accessibilityState={{ disabled: resetDisabled, busy: saving }}
        disabled={resetDisabled}
        onPress={async () => {
          if (resetDisabled || writing.current) {
            return;
          }
          setEditing(null);
          setHexInput(null);
          apply(DEFAULT_COLOR);
          await persistColor(DEFAULT_COLOR, true);
        }}
        style={({ pressed }) => [
          styles.iconAction,
          { opacity: resetDisabled ? 0.45 : pressed ? 0.7 : 1 },
        ]}
      >
        <RotateCcw size={22} color={theme.textSecondary} />
      </MotionPressable>
    </View>
  );
  return (
    <Screen
      nativeTitle='Paletă de culori'
      bottomSafeArea='content'
      nativeActions={Platform.OS === 'ios' ? actions : undefined}
    >
      {Platform.OS !== 'ios' && (
        <BackHeader title='Paletă de culori' trailing={actions} />
      )}
      {loadError && (
        <Panel>
          <Copy accessibilityRole='alert'>
            Paleta salvată nu a putut fi încărcată.
          </Copy>
          <Button variant='outline' onPress={retry}>
            Reîncearcă
          </Button>
        </Panel>
      )}
      <Panel>
        <View style={styles.section}>
          <View style={[styles.preview, stackFormats && styles.stackedPreview]}>
            <View style={[styles.wheelColumn, { width: wheelSize }]}>
              <View style={[styles.hexGroup, { width: wheelSize }]}>
                <View style={styles.summary}>
                  <Copy
                    kind='heading'
                    style={styles.hexLabel}
                    accessible={false}
                  >
                    HEX
                  </Copy>
                  <View
                    accessibilityIgnoresInvertColors
                    style={[
                      styles.hexSample,
                      { backgroundColor: hex, borderColor: theme.border },
                    ]}
                  />
                  <Input
                    containerStyle={styles.grow}
                    size='sm'
                    accessibilityLabel='Culoare HEX'
                    placeholder='#RRGGBB'
                    value={hexInput ?? hex}
                    editable={ready && !loadError && !saving}
                    autoCapitalize='characters'
                    autoCorrect={false}
                    spellCheck={false}
                    selectTextOnFocus
                    error={
                      invalidHex
                        ? 'Introdu 6 cifre hexazecimale (0–9, A–F).'
                        : undefined
                    }
                    onChangeText={(text) => {
                      setHexInput(text);
                      setEditing(null);
                      setMessage('');
                      const normalized = parseHexInput(text);
                      if (normalized) {
                        apply(normalized);
                      }
                    }}
                    onEndEditing={() => {
                      if (!invalidHex) {
                        setHexInput(null);
                      }
                    }}
                  />
                </View>
              </View>
              <ColorWheel
                value={hsv}
                onChange={fromWheel}
                size={wheelSize}
                disabled={saving || !ready || loadError}
              />
            </View>
            <View
              accessible={false}
              style={[
                stackFormats
                  ? styles.horizontalDivider
                  : styles.verticalDivider,
                { backgroundColor: theme.border },
              ]}
            />
            <View
              style={[styles.palette, stackFormats && styles.stackedPalette]}
            >
              <View style={styles.paletteHeading}>
                <Copy
                  kind='body'
                  style={[styles.sectionTitle, styles.paletteTitle]}
                >
                  Paleta generată
                </Copy>
              </View>
              <View style={[styles.paletteGrid, { minHeight: wheelSize }]}>
                {paletteRoles.map(([key, label, short]) => (
                  <View
                    key={key}
                    accessible
                    accessibilityLabel={`${label}, ${theme[key]}`}
                    style={styles.paletteCell}
                  >
                    <View
                      accessibilityIgnoresInvertColors
                      style={[
                        styles.colorSample,
                        {
                          backgroundColor: theme[key],
                          borderColor: theme.border,
                        },
                      ]}
                    />
                    <Copy
                      kind='label'
                      accessible={false}
                      style={{ color: theme.textSecondary }}
                    >
                      {short}
                    </Copy>
                  </View>
                ))}
              </View>
            </View>
          </View>
          <View style={styles.brightness}>
            <View style={styles.brightnessHeading}>
              <Copy kind='caption'>Luminozitate</Copy>
              <View style={styles.percentageColumn}>
                <Copy
                  kind='caption'
                  style={[styles.valueLabel, { color: theme.textSecondary }]}
                >
                  {brightnessPercent}%
                </Copy>
              </View>
            </View>
            <View style={styles.brightnessControls}>
              <BrightnessStep
                direction={-1}
                disabled={
                  saving || !ready || loadError || brightnessPercent <= 0
                }
                onPress={() => adjustBrightness(-1)}
              />
              <Host
                matchContents={{ vertical: true }}
                colorScheme={theme.isDark ? 'dark' : 'light'}
                seedColor={theme.accent}
                style={styles.host}
              >
                <Slider
                  value={hsv[2]}
                  min={0}
                  max={100}
                  disabled={saving || !ready || loadError}
                  testID='palette-brightness'
                  onValueChange={(v) => fromWheel([hsv[0], hsv[1], v])}
                />
              </Host>
              <BrightnessStep
                direction={1}
                disabled={
                  saving || !ready || loadError || brightnessPercent >= 100
                }
                onPress={() => adjustBrightness(1)}
              />
            </View>
          </View>
        </View>
      </Panel>
      <Panel>
        <View style={[styles.formats, stackFormats && styles.stackedFormats]}>
          {(Object.keys(spaces) as Space[]).map((space, index) => {
            const displayed =
              editing?.space === space
                ? editing.values
                : values[space].map((n) => String(Math.round(n)));
            return (
              <Fragment key={space}>
                {index > 0 && (
                  <View
                    accessible={false}
                    style={[
                      stackFormats
                        ? styles.horizontalDivider
                        : styles.verticalDivider,
                      { backgroundColor: theme.border },
                    ]}
                  />
                )}
                <View style={styles.format}>
                  <Copy kind='caption' style={styles.sectionTitle}>
                    {space}
                  </Copy>
                  {spaces[space].map((label, i) => (
                    <View key={label} style={styles.channelRow}>
                      <Copy
                        kind='caption'
                        style={[
                          styles.channelLabel,
                          { width: s.lg * fontScale },
                        ]}
                        accessible={false}
                      >
                        {label}
                      </Copy>
                      <Input
                        containerStyle={styles.grow}
                        suffix={`/${limit(space, i)}${space === 'HSL' ? (i > 0 ? '%' : '°') : ''}`}
                        accessibilityLabel={`${space} ${label}`}
                        accessibilityHint={`De la 0 la ${limit(space, i)}${space === 'HSL' ? (i > 0 ? ' la sută' : ' de grade') : ''}`}
                        keyboardType='number-pad'
                        editable={ready && !loadError && !saving}
                        value={displayed[i]}
                        selectTextOnFocus
                        onChangeText={(text) => {
                          const next = [...displayed];
                          next[i] = text;
                          setEditing({ space, values: next });
                          setHexInput(null);
                          setMessage('');
                          if (valid(space, next)) {
                            const numbers = next.map(Number);
                            const nextRgb =
                              space === 'RGB'
                                ? (numbers as RGB)
                                : hslToRgb(numbers as HSL);
                            apply(rgbToHex(nextRgb));
                          }
                        }}
                        onEndEditing={() => {
                          if (!invalid) {
                            setEditing(null);
                          }
                        }}
                      />
                    </View>
                  ))}
                </View>
              </Fragment>
            );
          })}
        </View>
        <Copy kind='caption' style={{ color: theme.textSecondary }}>
          Valorile pornesc de la 0.
        </Copy>
      </Panel>
      <View style={styles.notes}>
        <Copy kind='caption' style={{ color: theme.textSecondary }}>
          Alege culoarea principală. Accentele și suprafețele întunecate se
          adaptează automat. Fundalurile luminoase rămân neschimbate.
        </Copy>
        <Copy kind='caption' style={{ color: theme.textSecondary }}>
          Previzualizare live. Dacă pleci fără să salvezi, revine paleta
          salvată.
        </Copy>
      </View>
      {invalidNumbers && (
        <Copy accessibilityRole='alert' style={{ color: theme.dangerText }}>
          Introdu doar numere întregi în intervalul indicat.
        </Copy>
      )}
      {!!message && (
        <Copy
          accessibilityRole={failed ? 'alert' : undefined}
          accessibilityLiveRegion='polite'
          style={{ color: failed ? theme.dangerText : theme.textSecondary }}
        >
          {message}
        </Copy>
      )}
      <View style={styles.actions}>
        <Copy kind='caption' style={{ color: theme.textSecondary }}>
          Resetarea restaurează și salvează automat violetul original.
          Preferința rămâne pe acest dispozitiv, inclusiv după deconectare.
        </Copy>
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  section: { gap: s.lg },
  sectionTitle: { fontWeight: '600' },
  paletteTitle: { textAlign: 'center' },
  paletteHeading: { minHeight: 48, justifyContent: 'center' },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    minHeight: 48,
  },
  notes: { gap: s.sm },
  hexGroup: { minWidth: 0, gap: s.sm },
  hexLabel: { lineHeight: 40 },
  grow: { flex: 1, minWidth: 0 },
  brightness: { minWidth: 0, gap: s.sm },
  brightnessControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    minHeight: 48,
  },
  stepTarget: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDisabled: { opacity: 0.45 },
  stepSurface: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    borderCurve: 'continuous',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brightnessHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: s.sm,
  },
  percentageColumn: { width: 32, alignItems: 'center' },
  valueLabel: {
    fontVariant: ['tabular-nums'],
    textAlign: 'center',
    minWidth: 48,
  },
  actions: { gap: s.md },
  headerActions: { flexDirection: 'row', alignItems: 'center' },
  iconAction: {
    minWidth: 48,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  host: { flex: 1, minWidth: 0 },
  preview: { flexDirection: 'row', alignItems: 'flex-start', gap: s.sm },
  wheelColumn: { gap: s.lg },
  stackedPreview: { flexDirection: 'column', alignItems: 'flex-start' },
  palette: { flex: 1, minWidth: 0, gap: s.lg, alignSelf: 'stretch' },
  stackedPalette: { flex: 0, width: '100%' },
  paletteGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    alignContent: 'space-around',
    rowGap: s.sm,
  },
  paletteCell: { width: '30%', minWidth: 0, alignItems: 'center', gap: s.xs },
  channelRow: { flexDirection: 'row', alignItems: 'center', gap: s.sm },
  channelLabel: { flexShrink: 0 },
  formats: { flexDirection: 'row', gap: s.sm },
  stackedFormats: { flexDirection: 'column' },
  format: { flex: 1, minWidth: 0, gap: s.md },
  verticalDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  horizontalDivider: {
    height: StyleSheet.hairlineWidth,
    alignSelf: 'stretch',
  },
  colorSample: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderRadius: radius.sm,
    borderCurve: 'continuous',
  },
  hexSample: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: radius.md,
    borderCurve: 'continuous',
  },
});
