import { ro } from '@/i18n/ro';

export type SchoolAdmission = {
  id: string;
  specialization: string;
  track?: string;
  admission_year?: number | null;
  admission_code?: string | null;
  seats_total?: number | null;
  seats_occupied?: number | null;
  last_admission_average?: number | string | null;
  previous_admission_average?: number | string | null;
  teaching_language?: string | null;
  bilingual_language?: string | null;
  is_dual?: boolean;
  study_form?: string | null;
  pathway?: string | null;
  key_subjects?: string[];
  subjects_source_url?: string | null;
  subjects_note?: string | null;
  is_current?: boolean;
};

export function admissionVariant(profile: Partial<SchoolAdmission>) {
  return [
    profile.teaching_language,
    profile.bilingual_language &&
      `${ro.admissions.bilingual}: ${profile.bilingual_language}`,
    profile.is_dual && ro.admissions.dual,
  ]
    .filter(Boolean)
    .join(' · ');
}

export function currentAdmissions(profiles: SchoolAdmission[]) {
  const current = profiles.filter((profile) => profile.is_current !== false);
  const year = Math.max(
    0,
    ...current.map((profile) => profile.admission_year || 0)
  );
  return current
    .filter((profile) => !year || profile.admission_year === year)
    .sort((a, b) =>
      (a.admission_code || '').localeCompare(b.admission_code || '', 'ro', {
        numeric: true,
      })
    );
}

export function admissionAverage(value?: number | string | null) {
  const numeric = typeof value === 'string' ? Number(value) : value;
  return numeric != null &&
    Number.isFinite(numeric) &&
    numeric >= 1 &&
    numeric <= 10
    ? numeric.toFixed(2).replace('.', ',')
    : '—';
}

// Data-file provenance remains internal; people open the readable report.
export function readableSourceUrl(value?: string | null) {
  if (!value) {
    return undefined;
  }
  try {
    const url = new URL(value);
    if (!['https:', 'http:'].includes(url.protocol)) {
      return undefined;
    }
    const match = url.pathname.match(
      /^\/(\d{4})\/repartizare\/([A-Z]{2})\/data\/(highschool|specialization)\.json$/
    );
    if (url.hostname === 'static.admitere.edu.ro' && match) {
      return `https://static.admitere.edu.ro/${match[1]}/repartizare/${match[2]}/index.html#${match[3]}`;
    }
    return /\.json$/i.test(url.pathname) ? undefined : url.toString();
  } catch {
    return undefined;
  }
}
