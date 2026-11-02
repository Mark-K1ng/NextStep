import { StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { useStackMotion } from '@/hooks/use-stack-motion';
import { IosTabSegmentContext } from './ios-tab-context';
import { TabAsciiReveal } from './tab-ascii-reveal';
import { renderAsciiScreen } from './route-ascii-reveal';

export default function IosTabStack({ segment }: { segment: string }) {
  const options = useStackMotion();
  return (
    <IosTabSegmentContext.Provider value={segment}>
      <View style={styles.fill}>
        <TabAsciiReveal tab={segment}>
          <Stack
            id={undefined}
            screenOptions={options}
            screenLayout={renderAsciiScreen}
          />
        </TabAsciiReveal>
      </View>
    </IosTabSegmentContext.Provider>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1 } });
