import {
  Children,
  PropsWithChildren,
  createContext,
  useContext,
  useState,
} from 'react';
import {
  ScrollView,
  View,
  StyleSheet,
  TextProps,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useBottomSafeArea } from '@/hooks/use-bottom-safe-area';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SafeAreaView as NavigationSafeAreaView } from 'react-native-screens/experimental';
import { SafeAreaView } from '@/components/safe-area';
import { Check, ChevronRight, type LucideIcon } from 'lucide-react-native';
import { Image } from 'expo-image';
import nextstepLogo from '@/assets/brand/nextstep.svg';
import { useTheme } from '@/hooks/use-theme';
import { spacing as s, radius, typography } from '@/theme/tokens';
import { Stack } from 'expo-router';
import { useAppRouter as useRouter } from '@/hooks/use-app-router';
import { BottomNavigation } from './bottom-navigation';
import { useJourney } from '@/providers/journey';
import { MotionPressable } from './motion';
import { BackButton } from './back-button';
import { StudentPreviewBanner } from './student-preview-banner';
import { useAccountMode } from '@/providers/account-mode';
import { DecodingText } from './decoding-text';
import { AsciiSkinOverlay, AsciiContentGate, AsciiElement } from './ascii-skin';

const CompactContentContext = createContext(false);

export function Copy({
  kind = 'body',
  style,
  ...props
}: TextProps & { kind?: keyof typeof typography }) {
  const theme = useTheme();
  return (
    <AsciiElement>
      <DecodingText
        textBreakStrategy={Platform.OS === 'android' ? 'simple' : undefined}
        {...props}
        accessibilityRole={
          props.accessibilityRole ??
          (kind === 'title' || kind === 'heading' ? 'header' : undefined)
        }
        style={[
          typography[kind],
          Platform.OS === 'android' && uiStyles.androidText,
          { color: theme.textPrimary },
          style,
        ]}
      />
    </AsciiElement>
  );
}
export function Screen({
  children,
  tab,
  auth = false,
  nativeTitle,
  nativeActions,
  bottomSafeArea,
  scrollable = true,
}: PropsWithChildren<{
  tab?: 'home' | 'tutoring' | 'explore' | 'path' | 'profile';
  auth?: boolean;
  nativeTitle?: string;
  nativeActions?: React.ReactNode;
  bottomSafeArea?: 'viewport' | 'content';
  /** Set false when the child already owns a virtualized scrolling surface. */
  scrollable?: boolean;
}>) {
  const theme = useTheme();
  const journey = useJourney();
  const { isTeacher, isPreview } = useAccountMode();
  const insets = useSafeAreaInsets();
  const bottom = useBottomSafeArea();
  const bottomMode =
    bottomSafeArea ?? (bottom.content ? 'content' : 'viewport');
  const { height, width } = useWindowDimensions();
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const compact =
    !auth &&
    (width < 600 ||
      (viewportHeight ??
        height -
          insets.top -
          (Platform.OS === 'android' ? journey.barHeight : insets.bottom)) <
        740);
  return (
    <CompactContentContext.Provider value={compact}>
      <SafeAreaView
        edges={
          Platform.OS === 'ios' && nativeTitle
            ? ['left', 'right']
            : ['top', 'left', 'right']
        }
        style={[uiStyles.s0, { backgroundColor: theme.background }]}
      >
        {Platform.OS === 'ios' && nativeTitle && (
          <Stack.Screen
            options={{
              headerShown: true,
              title: nativeTitle,
              headerTitleStyle: {
                fontFamily: 'PlusJakartaSans',
                fontWeight: '600',
              },
              headerTintColor: theme.accentText,
              headerStyle: { backgroundColor: theme.background },
              headerShadowVisible: false,
              headerBackButtonDisplayMode: 'minimal',
              headerRight: nativeActions ? () => nativeActions : undefined,
              gestureEnabled: true,
            }}
          />
        )}
        <NavigationSafeAreaView
          edges={{
            bottom: Platform.OS === 'ios' && bottomMode === 'viewport',
          }}
        >
          <KeyboardAvoidingView
            style={uiStyles.s1}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            onLayout={({ nativeEvent }) =>
              setViewportHeight(nativeEvent.layout.height)
            }
          >
            <StudentPreviewBanner />
            {scrollable ? (
              <ScrollView
                keyboardShouldPersistTaps='handled'
                contentContainerStyle={[
                  design.screen,
                  compact && uiStyles.compactScreen,
                  auth && design.authScreen,
                  bottomMode === 'content' && {
                    paddingBottom: s.lg + insets.bottom,
                  },
                ]}
              >
                {children}
              </ScrollView>
            ) : (
              children
            )}
          </KeyboardAvoidingView>
        </NavigationSafeAreaView>
        {tab && Platform.OS === 'web' && (!isTeacher || isPreview) && (
          <BottomNavigation active={journey.activeTab || tab} />
        )}
      </SafeAreaView>
    </CompactContentContext.Provider>
  );
}
export function Brand() {
  return (
    <AsciiElement>
      <View style={design.brand}>
        <View style={design.brandMark}>
          <Image
            source={nextstepLogo}
            style={design.brandMark}
            contentFit='contain'
            accessible={false}
          />
          <AsciiSkinOverlay radius={radius.md} />
        </View>
        <Copy kind='display' style={uiStyles.s2}>
          NextStep
        </Copy>
      </View>
    </AsciiElement>
  );
}
export function IconTile({
  icon: Icon,
  active = false,
  compact = false,
  destructive = false,
}: {
  icon: LucideIcon;
  active?: boolean;
  compact?: boolean;
  destructive?: boolean;
}) {
  const theme = useTheme();
  return (
    <AsciiElement>
      <View
        style={[
          design.iconTile,
          compact && uiStyles.s3,
          {
            backgroundColor: destructive
              ? theme.dangerSurface
              : active
                ? theme.accent + '26'
                : theme.surfaceElevated,
          },
        ]}
      >
        <AsciiContentGate nativeOnly>
          <Icon
            size={24}
            color={destructive ? theme.danger : theme.accentText}
            strokeWidth={2}
          />
        </AsciiContentGate>
        <AsciiSkinOverlay radius={radius.md} />
      </View>
    </AsciiElement>
  );
}
export function Panel({
  children,
  accent = false,
}: PropsWithChildren<{ accent?: boolean }>) {
  const theme = useTheme();
  const compact = useContext(CompactContentContext);
  return (
    <AsciiElement>
      <View
        style={[
          design.panel,
          compact && uiStyles.compactPanel,
          {
            backgroundColor: theme.surface,
            borderColor: accent ? theme.accent : theme.border,
          },
        ]}
      >
        <AsciiSkinOverlay radius={radius.md} />
        {children}
      </View>
    </AsciiElement>
  );
}
export function Section({
  title,
  action,
  onPress,
}: {
  title: string;
  action?: string;
  onPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <View style={design.section}>
      <Copy kind='heading' style={uiStyles.s4}>
        {title}
      </Copy>
      {action && (
        <MotionPressable
          accessibilityRole='button'
          accessibilityLabel={`${action}: ${title}`}
          onPress={onPress}
          style={[design.touch, uiStyles.sectionAction]}
        >
          <Copy style={{ color: theme.accentText }}>{action}</Copy>
        </MotionPressable>
      )}
    </View>
  );
}
export function GroupedList({
  children,
  inset = false,
}: PropsWithChildren<{ inset?: boolean }>) {
  const theme = useTheme();
  const rows = Children.toArray(children);
  return (
    <AsciiElement>
      <View style={[uiStyles.group, { backgroundColor: theme.surface }]}>
        <AsciiSkinOverlay radius={radius.md} />
        {rows.map((child, index) => (
          <View
            key={
              typeof child === 'object' && 'key' in child ? child.key : index
            }
          >
            {index > 0 && (
              <View
                style={[
                  uiStyles.separator,
                  inset && uiStyles.insetSeparator,
                  { backgroundColor: theme.border },
                ]}
              />
            )}
            <View style={uiStyles.groupRow}>{child}</View>
          </View>
        ))}
      </View>
    </AsciiElement>
  );
}
export function Row({
  title,
  subtitle,
  icon,
  onPress,
  trailing,
  compact = false,
  destructive = false,
  accessibilityLabel,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  onPress?: () => void;
  trailing?: React.ReactNode;
  compact?: boolean;
  destructive?: boolean;
  accessibilityLabel?: string;
}) {
  const theme = useTheme();
  return (
    <MotionPressable
      feedback='highlight'
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={onPress ? 'button' : undefined}
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        design.row,
        compact && uiStyles.s5,
        { backgroundColor: pressed ? theme.surfaceElevated : 'transparent' },
      ]}
    >
      {icon && (
        <IconTile icon={icon} compact={compact} destructive={destructive} />
      )}
      <View style={[uiStyles.s6, { gap: s.xs }]}>
        <Copy style={[uiStyles.s7, destructive && { color: theme.dangerText }]}>
          {title}
        </Copy>
        {subtitle && (
          <Copy kind='caption' style={{ color: theme.textSecondary }}>
            {subtitle}
          </Copy>
        )}
      </View>
      <AsciiContentGate cover>
        {trailing ||
          (onPress && (
            <ChevronRight
              color={destructive ? theme.danger : theme.textSecondary}
              size={20}
            />
          ))}
      </AsciiContentGate>
    </MotionPressable>
  );
}
export function Choice({
  children,
  selected,
  onPress,
  exclusive = false,
  disabled = false,
  layout = 'compact',
  numberOfLines,
}: PropsWithChildren<{
  selected: boolean;
  onPress: () => void;
  exclusive?: boolean;
  disabled?: boolean;
  layout?: 'compact' | 'row';
  numberOfLines?: number;
}>) {
  const theme = useTheme();
  return (
    <AsciiElement>
      <MotionPressable
        feedback={layout === 'row' ? 'highlight' : undefined}
        accessibilityRole={exclusive ? 'radio' : 'checkbox'}
        accessibilityLabel={typeof children === 'string' ? children : undefined}
        accessibilityState={{ checked: selected, disabled }}
        disabled={disabled}
        aria-checked={selected}
        hitSlop={s.xs}
        onPress={onPress}
        style={({ pressed }) => [
          design.choice,
          layout === 'row' && uiStyles.choiceRow,
          {
            backgroundColor: selected ? theme.accent + '26' : theme.surface,
            borderColor: selected ? theme.accent : theme.border,
            opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
          },
        ]}
      >
        {layout === 'row' && (
          <View
            accessible={false}
            style={[
              uiStyles.choiceIndicator,
              selected
                ? { backgroundColor: theme.accent }
                : uiStyles.emptyIndicator,
              {
                borderRadius: exclusive ? radius.full : radius.sm,
                borderColor: selected ? theme.accent : theme.textSecondary,
              },
            ]}
          >
            {selected && <Check size={16} color={theme.onAccent} />}
          </View>
        )}
        <Copy
          kind={layout === 'row' ? 'body' : 'caption'}
          numberOfLines={numberOfLines}
          style={[
            design.choiceLabel,
            layout === 'row' && uiStyles.choiceRowLabel,
            {
              color: selected
                ? theme.accentText
                : layout === 'row'
                  ? theme.textPrimary
                  : theme.textSecondary,
            },
          ]}
        >
          {children}
        </Copy>
        <AsciiSkinOverlay radius={layout === 'row' ? radius.md : 24} />
      </MotionPressable>
    </AsciiElement>
  );
}
export const design = StyleSheet.create({
  flex: { flex: 1 },
  screen: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    padding: s.lg,
    paddingBottom: s.xl,
    gap: s.xl,
  },
  authScreen: { padding: s.xl },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.md,
    marginBottom: s.lg,
  },
  brandMark: {
    width: 36,
    height: 36,
    borderCurve: 'continuous',
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTile: {
    width: 36,
    height: 36,
    borderCurve: 'continuous',
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  panel: {
    borderWidth: 1,
    borderRadius: radius.md,
    borderCurve: 'continuous',
    padding: s.lg,
    gap: s.lg,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: s.md, minHeight: 48 },
  section: { flexDirection: 'row', alignItems: 'center', gap: s.sm },
  touch: { minHeight: 48, justifyContent: 'center' },
  choice: {
    borderWidth: 1,
    borderRadius: 24,
    borderCurve: 'continuous',
    paddingHorizontal: s.md,
    paddingVertical: s.sm,
    minHeight: 40,
    minWidth: 40,
    maxWidth: '100%',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceLabel: { flexShrink: 1, textAlign: 'center' },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: s.sm },
});

const uiStyles = StyleSheet.create({
  emptyIndicator: { backgroundColor: 'transparent' },
  choiceIndicator: {
    width: 24,
    height: 24,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  choiceRowLabel: { flex: 1, textAlign: 'left' },
  choiceRow: {
    minHeight: 52,
    padding: s.lg,
    borderRadius: radius.md,
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: s.md,
  },
  group: {
    borderRadius: radius.md,
    borderCurve: 'continuous',
    paddingHorizontal: s.lg,
  },
  groupRow: { paddingVertical: s.sm },
  separator: { height: StyleSheet.hairlineWidth },
  insetSeparator: { marginLeft: 48 },
  compactScreen: { gap: s.lg, paddingBottom: s.lg },
  compactPanel: { gap: s.md },
  s0: { flex: 1 },
  s1: { flex: 1 },
  s2: { fontSize: 22 },
  s3: { width: 36, height: 36 },
  s4: { flex: 1 },
  s5: { minHeight: 48 },
  s6: { flex: 1, minWidth: 0 },
  s7: { fontWeight: '600' },
  sectionAction: { minWidth: 48, maxWidth: '50%', alignItems: 'flex-end' },
  backHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: s.md,
  },
  androidText: { includeFontPadding: false },
  // Inline Android chrome occupies the top padding that iOS's native header owns.
  // The 48-unit controls stay entirely inside the status-bar-safe viewport.
  androidBackHeader: { marginTop: -s.lg, marginBottom: -s.xs },
});

export function BackHeader({
  title,
  trailing,
}: {
  title: string;
  trailing?: React.ReactNode;
}) {
  const router = useRouter();
  return (
    <View
      style={[
        uiStyles.backHeader,
        Platform.OS === 'android' && uiStyles.androidBackHeader,
      ]}
    >
      <BackButton onPress={() => router.back()} />
      <Copy kind='heading' style={design.flex}>
        {title}
      </Copy>
      {trailing}
    </View>
  );
}
