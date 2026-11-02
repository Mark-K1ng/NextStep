import { StyleSheet, View } from 'react-native';
import { MotionPressable } from '@/components/motion';
import { Copy, Panel, design } from '@/components/design';
import { SaveButton } from '@/components/save-button';
import { useTheme } from '@/hooks/use-theme';
import { radius, spacing as s, squircle } from '@/theme/tokens';
import type { ExploreItem } from '@/types/models';

export function CatalogueResult({
  item,
  category,
  onPress,
}: {
  item: ExploreItem;
  category?: string;
  onPress(): void;
}) {
  const theme = useTheme();
  const schoolProfiles =
    item.type === 'schools'
      ? [
          ...new Set(
            (item.specialization || '')
              .split(' · ')
              .map((value) => value.trim())
              .filter(Boolean)
          ),
        ]
      : [];
  const metadata = [
    item.county,
    item.specialization === item.name
      ? item.track
      : item.specialization || item.domain || item.provider,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Panel>
      <View style={styles.row}>
        <MotionPressable
          feedback='highlight'
          accessibilityRole='button'
          accessibilityLabel={[
            item.name || item.title,
            item.county,
            item.domain,
          ]
            .filter(Boolean)
            .join(', ')}
          onPress={onPress}
          style={({ pressed }) => [
            styles.content,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          {!!category && (
            <Copy kind='label' style={{ color: theme.accentText }}>
              {category}
            </Copy>
          )}
          <Copy style={styles.name}>{item.name || item.title}</Copy>
          {!!schoolProfiles.length && (
            <View style={styles.profiles}>
              <Copy
                kind='caption'
                numberOfLines={2}
                style={[styles.profileNames, { color: theme.textSecondary }]}
              >
                {schoolProfiles.slice(0, 2).join(' · ')}
              </Copy>
              {schoolProfiles.length > 2 && (
                <Copy
                  kind='caption'
                  accessibilityLabel={`Profiluri suplimentare: ${schoolProfiles.length - 2}`}
                  style={{ color: theme.textSecondary }}
                >
                  +{schoolProfiles.length - 2}
                </Copy>
              )}
            </View>
          )}
          {item.type !== 'schools' && !!metadata && (
            <Copy
              kind='caption'
              numberOfLines={3}
              style={{ color: theme.textSecondary }}
            >
              {metadata}
            </Copy>
          )}
          {item.type !== 'schools' && !!item.description && (
            <Copy
              kind='caption'
              numberOfLines={3}
              style={{ color: theme.textSecondary }}
            >
              {item.description}
            </Copy>
          )}
        </MotionPressable>
        <SaveButton item={item} />
      </View>
      {!!item.subjects?.length && (
        <View style={design.wrap}>
          {item.subjects.map((subject) => (
            <Copy
              key={subject}
              kind='caption'
              style={[
                styles.subject,
                { backgroundColor: theme.surfaceElevated },
              ]}
            >
              {subject}
            </Copy>
          ))}
        </View>
      )}
    </Panel>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: s.md },
  content: {
    flex: 1,
    minWidth: 0,
    minHeight: 48,
    justifyContent: 'center',
    gap: s.xs,
  },
  name: { fontWeight: '600' },
  profiles: { flexDirection: 'row', alignItems: 'flex-end', gap: s.xs },
  profileNames: { flexShrink: 1 },
  subject: { ...squircle, borderRadius: radius.sm, padding: s.sm },
});
