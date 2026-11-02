import { View, StyleSheet } from 'react-native';
import { MotionPressable as Pressable } from './motion';
import { WebView } from 'react-native-webview';
import { useState } from 'react';
import { Copy } from './design';
import { institutionMap, institutionMapDocument } from '@/lib/institution-map';
import { openExternalUrl } from '@/lib/open-external-url';
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
  const [failedEmbed, setFailedEmbed] = useState<string | null>(null);
  return (
    <Pressable
      feedback='highlight'
      accessibilityRole='link'
      accessibilityLabel={`${ro.profileChoices.maps}: ${name}`}
      onPress={() => openExternalUrl(urls.search)}
      style={({ pressed }) => [
        styles.card,
        {
          borderColor: theme.border,
          backgroundColor: theme.surface,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      {failedEmbed !== urls.embed && (
        <View
          pointerEvents='none'
          accessible={false}
          importantForAccessibility='no-hide-descendants'
          style={styles.map}
        >
          <WebView
            key={urls.embed}
            source={{
              html: institutionMapDocument(urls.embed, theme.isDark),
              baseUrl: 'https://www.google.com/',
            }}
            originWhitelist={['*']}
            style={{ backgroundColor: theme.surface }}
            scrollEnabled={false}
            onError={() => setFailedEmbed(urls.embed)}
            onHttpError={() => setFailedEmbed(urls.embed)}
            onShouldStartLoadWithRequest={(request) =>
              request.url === 'about:blank' ||
              request.url.startsWith('https://maps.google.com/') ||
              request.url.startsWith('https://www.google.com/')
            }
          />
        </View>
      )}
      <Copy kind='caption' style={{ color: theme.accentText, padding: s.md }}>
        {ro.profileChoices.maps}
      </Copy>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radius.lg,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  map: { height: 220 },
});
