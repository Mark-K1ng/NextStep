import { SelectField } from './SelectField';
import { GraduationCap, MapPin, Building2 } from 'lucide-react-native';
import {
  COUNTIES,
  GRADES,
  SECTORS,
  gradeLabel,
  normalizeCounty,
} from '@/constants/profile-options';
import { ro } from '@/i18n/ro';
export function GradeSelect({
  value,
  onChange,
  error,
}: {
  value: string;
  onChange(value: string): void;
  error?: string;
}) {
  return (
    <SelectField
      label={ro.profile.gradeLevel}
      icon={GraduationCap}
      value={value}
      onChange={onChange}
      error={error}
      options={GRADES.map((grade, index) => ({
        value: grade,
        label: gradeLabel(grade),
        description:
          grade === 'student'
            ? undefined
            : index < 4
              ? ro.profileChoices.middle
              : ro.profileChoices.high,
      }))}
    />
  );
}
export function CountySelect({
  county,
  sector,
  onChange,
  error,
}: {
  county: string;
  sector?: number | null;
  onChange(county: string, sector: number | null): void;
  error?: string;
}) {
  const selected = normalizeCounty(county);
  return (
    <>
      <SelectField
        label={ro.profile.county}
        icon={MapPin}
        searchPlaceholder={ro.profileChoices.searchCounty}
        value={selected}
        options={COUNTIES.map((value) => ({ value, label: value }))}
        error={error}
        onChange={(value) => onChange(value, null)}
      />
      {selected === 'București' && (
        <SelectField
          label={ro.profileChoices.sector}
          icon={Building2}
          value={sector ? String(sector) : ''}
          options={SECTORS.map((value) => ({
            value: String(value),
            label: `${ro.profileChoices.sector} ${value}`,
          }))}
          onChange={(value) => onChange(selected, Number(value))}
          error={!sector ? ro.profileChoices.sectorRequired : undefined}
        />
      )}
    </>
  );
}
