import { useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useAppRouter as useRouter } from '@/hooks/use-app-router';
import { Brand, Copy, Screen, Choice, design } from '@/components/design';
import { Button } from '@/components';
import { CountySelect } from '@/components/profile-selectors';
import { locationSchema } from '@/lib/validators';
import { ro } from '@/i18n/ro';
import { useTheme } from '@/hooks/use-theme';
export default function Onboarding3() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    gradeLevel?: string;
    favoriteSubjects?: string;
  }>();
  const theme = useTheme();
  const [county, setCounty] = useState('');
  const [sector, setSector] = useState<number | null>(null);
  const [interests, setInterests] = useState<string[]>([]);
  return (
    <Screen auth>
      <Brand />
      <Copy kind='title'>{ro.visual.personalize.interestsTitle}</Copy>
      <Copy style={{ color: theme.textSecondary }}>
        {ro.visual.personalize.interestsHint}
      </Copy>
      <View style={design.wrap}>
        {ro.visual.personalize.domains.map((value) => (
          <Choice
            key={value}
            selected={interests.includes(value)}
            onPress={() =>
              setInterests((current) =>
                current.includes(value)
                  ? current.filter((item) => item !== value)
                  : [...current, value]
              )
            }
          >
            {value}
          </Choice>
        ))}
      </View>
      <CountySelect
        county={county}
        sector={sector}
        onChange={(value, district) => {
          setCounty(value);
          setSector(district);
        }}
      />
      <Button
        disabled={!locationSchema.safeParse({ county, sector }).success}
        onPress={() =>
          router.push({
            pathname: '/(auth)/register',
            params: {
              ...params,
              county: county.trim(),
              sector: sector ? String(sector) : '',
              interests: JSON.stringify(interests),
            },
          })
        }
      >
        {ro.visual.personalize.continue}
      </Button>
    </Screen>
  );
}
