import { useState } from 'react';
import { IosTabTouchBoundary } from './ios-tab-touch-boundary';
import {
  IosAppearingTabContext,
  startIosTabReveal,
  prepareIosTabReveal,
} from './ios-tab-context';
import { NativeTabs } from 'expo-router/native-tabs';
import { useSegments } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';
import { ro } from '@/i18n/ro';
import { typography } from '@/theme/tokens';

export default function AppTabs() {
  const [appearingTab, setAppearingTab] = useState<string | null>(null);
  const theme = useTheme();
  const segments = useSegments();
  return (
    <IosAppearingTabContext.Provider value={appearingTab}>
      <IosTabTouchBoundary>
        <NativeTabs
          hidden={segments[segments.length - 1] === 'palette'}
          tintColor={theme.accentText}
          backgroundColor={theme.surface}
          minimizeBehavior='never'
          labelStyle={{
            default: { ...typography.label, color: theme.textSecondary },
            selected: { ...typography.label, color: theme.accentText },
          }}
        >
          {/* Screens already own their safe areas; do not inset their scroll views twice. */}
          <NativeTabs.Trigger
            name='(home)'
            listeners={{
              tabPress: (event) => {
                if (!event.data.isPrevented) {
                  startIosTabReveal('(home)');
                  setAppearingTab('(home)');
                }
              },
            }}
            unstable_nativeProps={{
              onWillAppear: () => {
                startIosTabReveal('(home)');
                setAppearingTab('(home)');
              },
              onWillDisappear: () => prepareIosTabReveal('(home)'),
            }}
            disableAutomaticContentInsets
          >
            <NativeTabs.Trigger.Icon
              sf={{ default: 'house', selected: 'house.fill' }}
            />
            <NativeTabs.Trigger.Label>
              {ro.visual.homeTab}
            </NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger
            name='(tutoring)'
            listeners={{
              tabPress: (event) => {
                if (!event.data.isPrevented) {
                  startIosTabReveal('(tutoring)');
                  setAppearingTab('(tutoring)');
                }
              },
            }}
            unstable_nativeProps={{
              onWillAppear: () => {
                startIosTabReveal('(tutoring)');
                setAppearingTab('(tutoring)');
              },
              onWillDisappear: () => prepareIosTabReveal('(tutoring)'),
            }}
            disableAutomaticContentInsets
          >
            <NativeTabs.Trigger.Icon sf='square.and.pencil' />
            <NativeTabs.Trigger.Label>Meditații</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger
            name='(explore)'
            listeners={{
              tabPress: (event) => {
                if (!event.data.isPrevented) {
                  startIosTabReveal('(explore)');
                  setAppearingTab('(explore)');
                }
              },
            }}
            unstable_nativeProps={{
              onWillAppear: () => {
                startIosTabReveal('(explore)');
                setAppearingTab('(explore)');
              },
              onWillDisappear: () => prepareIosTabReveal('(explore)'),
            }}
            disableAutomaticContentInsets
          >
            <NativeTabs.Trigger.Icon
              sf={{ default: 'safari', selected: 'safari.fill' }}
            />
            <NativeTabs.Trigger.Label>
              {ro.explore.title}
            </NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger
            name='(path)'
            listeners={{
              tabPress: (event) => {
                if (!event.data.isPrevented) {
                  startIosTabReveal('(path)');
                  setAppearingTab('(path)');
                }
              },
            }}
            unstable_nativeProps={{
              onWillAppear: () => {
                startIosTabReveal('(path)');
                setAppearingTab('(path)');
              },
              onWillDisappear: () => prepareIosTabReveal('(path)'),
            }}
            disableAutomaticContentInsets
          >
            <NativeTabs.Trigger.Icon sf='point.topleft.down.to.point.bottomright.curvepath' />
            <NativeTabs.Trigger.Label>
              {ro.refinement.pathTab}
            </NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger
            name='(profile)'
            listeners={{
              tabPress: (event) => {
                if (!event.data.isPrevented) {
                  startIosTabReveal('(profile)');
                  setAppearingTab('(profile)');
                }
              },
            }}
            unstable_nativeProps={{
              onWillAppear: () => {
                startIosTabReveal('(profile)');
                setAppearingTab('(profile)');
              },
              onWillDisappear: () => prepareIosTabReveal('(profile)'),
            }}
            disableAutomaticContentInsets
          >
            <NativeTabs.Trigger.Icon
              sf={{
                default: 'person.crop.circle',
                selected: 'person.crop.circle.fill',
              }}
            />
            <NativeTabs.Trigger.Label>
              {ro.profile.title}
            </NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger name='home/index' hidden />
          <NativeTabs.Trigger name='tutoring/index' hidden />
          <NativeTabs.Trigger name='explore/index' hidden />
          <NativeTabs.Trigger name='path/index' hidden />
          <NativeTabs.Trigger name='profile/index' hidden />
          <NativeTabs.Trigger name='recommendations/index' hidden />
        </NativeTabs>
      </IosTabTouchBoundary>
    </IosAppearingTabContext.Provider>
  );
}
