import { DecodingInput as TextInput } from './decoding-input';
import { DecodingText as Text } from './decoding-text';
import { SelectionSheet } from './selection-sheet';
import { SelectionList } from './selection-list';
import { AsciiSkinOverlay, AsciiElement } from './ascii-skin';
import { useState, type ReactNode } from 'react';
import { Keyboard, StyleSheet, useWindowDimensions, View } from 'react-native';
import { MotionPressable as Pressable, MotionChevron } from './motion';
import {
  Check,
  ChevronDown,
  Search,
  RotateCcw,
  X,
  type LucideIcon,
} from 'lucide-react-native';
import { useTheme } from '@/hooks/use-theme';
import { spacing as s, radius, typography } from '@/theme/tokens';
import { ro } from '@/i18n/ro';

type Option = { value: string; label: string; description?: string };
const OptionSeparator = () => <View style={styles.separator} />;
const fold = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('ro')
    .trim();

export function SelectField({
  label,
  value,
  options,
  onChange,
  error,
  icon: Icon,
  searchPlaceholder,
  sheetTitle,
  presented,
  onDismiss,
  hideTrigger = false,
  onReset,
  content,
}: {
  label: string;
  value: string;
  options: readonly Option[];
  onChange(value: string): void;
  error?: string;
  icon?: LucideIcon;
  searchPlaceholder?: string;
  sheetTitle?: string;
  presented?: boolean;
  onDismiss?(): void;
  hideTrigger?: boolean;
  onReset?(): void;
  content?: ReactNode;
}) {
  const theme = useTheme();
  const { width } = useWindowDimensions();
  const [internalOpen, setOpen] = useState(false);
  const open = presented ?? internalOpen;
  const [search, setSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(52);
  const [searchHeight, setSearchHeight] = useState(42);
  const selected = options.find((option) => option.value === value);
  const query = fold(search);
  // A closed selector (or an empty search) needs no locale normalization of
  // the entire catalogue on every navigation/context update.
  const matches =
    open && query
      ? options.filter((option) => fold(option.label).includes(query))
      : options;
  const dismiss = () => {
    Keyboard.dismiss();
    setOpen(false);
    setSearch('');
    setSearchFocused(false);
    onDismiss?.();
  };

  return (
    <AsciiElement>
      <View style={styles.field}>
        {!hideTrigger && (
          <>
            <Text style={[typography.caption, { color: theme.textPrimary }]}>
              {label}
            </Text>
            <Pressable
              accessibilityRole='button'
              accessibilityLabel={label}
              accessibilityHint={error}
              accessibilityValue={{
                text: selected?.label || ro.profileChoices.choose,
              }}
              accessibilityState={{ expanded: open }}
              onPress={() => {
                Keyboard.dismiss();
                setOpen(true);
              }}
              style={({ pressed }) => [
                styles.control,
                {
                  backgroundColor: pressed
                    ? theme.surfaceElevated
                    : theme.surface,
                  borderColor: error
                    ? theme.danger
                    : open
                      ? theme.accent
                      : theme.border,
                },
              ]}
            >
              {Icon && <Icon size={20} color={theme.accentText} />}
              <Text
                style={[
                  typography.body,
                  styles.value,
                  { color: selected ? theme.textPrimary : theme.textSecondary },
                ]}
              >
                {selected?.label || ro.profileChoices.choose}
              </Text>
              <MotionChevron expanded={open}>
                <ChevronDown
                  size={18}
                  color={open ? theme.accentText : theme.textSecondary}
                />
              </MotionChevron>
              <AsciiSkinOverlay radius={radius.md} />
            </Pressable>
            {!!error && (
              <Text
                accessibilityRole='alert'
                accessibilityLiveRegion='polite'
                style={[typography.caption, { color: theme.dangerText }]}
              >
                {error}
              </Text>
            )}
          </>
        )}
        <SelectionSheet isPresented={open} onDismiss={dismiss}>
          {(sheetHeight) => (
            <View
              style={[
                { height: sheetHeight, width, backgroundColor: theme.surface },
              ]}
              accessibilityViewIsModal
              onAccessibilityEscape={dismiss}
            >
              <View
                style={styles.header}
                onLayout={(event) =>
                  setHeaderHeight(event.nativeEvent.layout.height)
                }
              >
                <View style={styles.title}>
                  <Text
                    accessibilityRole='header'
                    style={[typography.heading, { color: theme.textPrimary }]}
                  >
                    {sheetTitle || label}
                  </Text>
                </View>
                {!!onReset && (
                  <Pressable
                    accessibilityRole='button'
                    accessibilityLabel={ro.refinement.reset}
                    onPress={() => {
                      setSearch('');
                      onReset();
                    }}
                    style={({ pressed }) => [
                      styles.resetTarget,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <View
                      style={[
                        styles.reset,
                        { backgroundColor: theme.surfaceElevated },
                      ]}
                    >
                      <RotateCcw size={16} color={theme.textSecondary} />
                      <Text
                        style={[
                          typography.caption,
                          { color: theme.textPrimary },
                        ]}
                      >
                        {ro.refinement.reset}
                      </Text>
                    </View>
                  </Pressable>
                )}
                <Pressable
                  accessibilityRole='button'
                  accessibilityLabel={ro.common.close}
                  onPress={dismiss}
                  style={({ pressed }) => [
                    styles.close,
                    {
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <View
                    style={[
                      styles.closeIcon,
                      { backgroundColor: theme.surfaceElevated },
                    ]}
                  >
                    <X size={18} color={theme.textSecondary} />
                  </View>
                </Pressable>
              </View>
              {!content && !!searchPlaceholder && (
                <View
                  onLayout={(event) =>
                    setSearchHeight(event.nativeEvent.layout.height)
                  }
                  style={[
                    styles.search,
                    {
                      backgroundColor: theme.background,
                      borderColor: searchFocused
                        ? theme.accentText
                        : theme.border,
                    },
                  ]}
                >
                  <Search size={18} color={theme.textSecondary} />
                  <TextInput
                    accessibilityLabel={searchPlaceholder}
                    placeholder={searchPlaceholder}
                    placeholderTextColor={theme.textSecondary}
                    value={search}
                    onChangeText={setSearch}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => setSearchFocused(false)}
                    onSubmitEditing={Keyboard.dismiss}
                    selectionColor={theme.accentText}
                    autoCorrect={false}
                    autoCapitalize='none'
                    returnKeyType='search'
                    hitSlop={s.xs}
                    style={[
                      typography.caption,
                      styles.searchInput,
                      { color: theme.textPrimary },
                    ]}
                  />
                  {!!search && (
                    <Pressable
                      feedback='highlight'
                      accessibilityRole='button'
                      accessibilityLabel={ro.profileChoices.clearSearch}
                      hitSlop={s.xs}
                      onPress={() => setSearch('')}
                      style={styles.clearSearch}
                    >
                      <X size={18} color={theme.textSecondary} />
                    </Pressable>
                  )}
                </View>
              )}
              {content || (
                <SelectionList
                  selectedValue={value}
                  onChoose={(next) => {
                    if (next !== value) {
                      onChange(next);
                    }
                    dismiss();
                  }}
                  style={[
                    styles.list,
                    {
                      height: Math.max(
                        48,
                        sheetHeight -
                          headerHeight -
                          (searchPlaceholder ? searchHeight + s.sm : 0)
                      ),
                    },
                  ]}
                  data={matches}
                  keyExtractor={(option) => option.value}
                  nestedScrollEnabled={false}
                  showsVerticalScrollIndicator
                  keyboardShouldPersistTaps='handled'
                  keyboardDismissMode='on-drag'
                  contentContainerStyle={styles.options}
                  ItemSeparatorComponent={OptionSeparator}
                  ListEmptyComponent={
                    <View accessibilityLiveRegion='polite' style={styles.empty}>
                      <Text
                        style={[typography.body, { color: theme.textPrimary }]}
                      >
                        {ro.profileChoices.noMatches}
                      </Text>
                      <Text
                        style={[
                          typography.caption,
                          { color: theme.textSecondary },
                        ]}
                      >
                        {ro.profileChoices.searchAgain}
                      </Text>
                    </View>
                  }
                  renderItem={({ item }) => {
                    const checked = item.value === value;
                    return (
                      <Pressable
                        feedback='highlight'
                        accessibilityRole='radio'
                        accessibilityLabel={[item.label, item.description]
                          .filter(Boolean)
                          .join(', ')}
                        accessibilityState={{ checked }}
                        onPress={() => {
                          if (item.value !== value) {
                            onChange(item.value);
                          }
                          dismiss();
                        }}
                        style={({ pressed }) => [
                          styles.option,
                          {
                            borderColor: checked ? theme.accent : theme.border,
                            backgroundColor: checked
                              ? theme.accent + '1F'
                              : pressed
                                ? theme.surfaceElevated
                                : theme.surface,
                          },
                        ]}
                      >
                        <View style={styles.value}>
                          <Text
                            style={[
                              typography.body,
                              checked && styles.selectedText,
                              {
                                color: checked
                                  ? theme.accentText
                                  : theme.textPrimary,
                              },
                            ]}
                          >
                            {item.label}
                          </Text>
                          {!!item.description && (
                            <Text
                              style={[
                                typography.caption,
                                { color: theme.textSecondary },
                              ]}
                            >
                              {item.description}
                            </Text>
                          )}
                        </View>
                        <View style={styles.indicator}>
                          {checked && (
                            <Check
                              size={20}
                              strokeWidth={3}
                              color={theme.accentText}
                            />
                          )}
                        </View>
                      </Pressable>
                    );
                  }}
                />
              )}
            </View>
          )}
        </SelectionSheet>
      </View>
    </AsciiElement>
  );
}

const styles = StyleSheet.create({
  field: { gap: s.sm },
  control: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.md,
    paddingHorizontal: s.md,
    paddingVertical: s.sm,
    borderWidth: 1,
    borderRadius: radius.md,
    borderCurve: 'continuous',
  },
  value: { flex: 1, minWidth: 0, gap: s.xs },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.md,
    paddingHorizontal: s.lg,
    paddingBottom: s.sm,
  },
  title: { flex: 1, gap: s.xs },
  resetTarget: { minHeight: 44, justifyContent: 'center', flexShrink: 0 },
  reset: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: s.xs,
    paddingHorizontal: s.md,
    paddingVertical: s.xs,
    borderRadius: radius.full,
    borderCurve: 'continuous',
  },
  close: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    borderCurve: 'continuous',
  },
  closeIcon: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSearch: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.sm,
    marginHorizontal: s.lg,
    marginBottom: s.sm,
    paddingLeft: s.md,
    paddingRight: s.xs,
    borderWidth: 1,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
  },
  searchInput: {
    flex: 1,
    minWidth: 0,
    minHeight: 40,
    paddingVertical: s.xs,
    includeFontPadding: false,
  },
  list: { flexGrow: 0, flexShrink: 1, minHeight: 0, marginHorizontal: s.lg },
  options: { paddingBottom: s.xl },
  separator: { height: s.sm },
  option: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.md,
    padding: s.md,
    borderWidth: 1,
    borderRadius: radius.md,
    borderCurve: 'continuous',
  },
  indicator: {
    width: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedText: { fontWeight: '600' },
  empty: { paddingVertical: s.xl, paddingHorizontal: s.md, gap: s.sm },
});
