import { institutionMap, MAP_DARK_FILTER } from '@/lib/institution-map';
import { openExternalUrl } from '@/lib/open-external-url';
import { Pressable, StyleSheet, View } from 'react-native';
import { Copy } from './design';
import { radius, spacing as s } from '@/theme/tokens';
import { useTheme } from '@/hooks/use-theme';
import { ro } from '@/i18n/ro';
export function InstitutionMap({
  name,
  city,
  county,
  address,
}: {
  name: string;
  city?: string;
  county?: string;
  address?: string;
}) {
  const urls = institutionMap(name, city, county, address);
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole='link'
      accessibilityLabel={`${ro.profileChoices.maps}: ${name}`}
      onPress={() => openExternalUrl(urls.search)}
      style={[styles.card, { borderColor: theme.border }]}
    >
      <View pointerEvents='none'>
        <iframe
          title={`${ro.profileChoices.mapTitle}: ${name}`}
          src={urls.embed}
          loading='lazy'
          tabIndex={-1}
          style={theme.isDark ? darkFrameStyle : frameStyle}
        />
      </View>
      <Copy kind='caption' style={{ color: theme.accentText, padding: s.md }}>
        {ro.profileChoices.maps}
      </Copy>
    </Pressable>
  );
}
const frameStyle = {
  height: 220,
  width: '100%',
  border: 0,
  pointerEvents: 'none' as const,
};
const darkFrameStyle = { ...frameStyle, filter: MAP_DARK_FILTER };
const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderCurve: 'continuous',
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
});
