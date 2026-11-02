import { z } from 'zod';
import type { ExploreItem } from '@/types/models';

const schema = z.preprocess(
  (value) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return value;
    }
    // Postgres catalogue results include explicit nulls for unused metadata.
    return Object.fromEntries(
      Object.entries(value).filter(
        ([, field]) => field !== null && field !== undefined
      )
    );
  },
  z.object({
    id: z.string().min(1),
    pathSynced: z.boolean().optional(),
    type: z.enum([
      'schools',
      'school_profiles',
      'universities',
      'programs',
      'careers',
      'courses',
      'skills',
    ]),
    name: z.string().optional(),
    title: z.string().optional(),
    description: z.string().optional(),
    county: z.string().optional(),
    domain: z.string().optional(),
    provider: z.string().optional(),
    specialization: z.string().optional(),
    track: z.string().optional(),
    subjects: z.array(z.string()).optional(),
    sourceUrl: z.string().optional(),
    verifiedAt: z.string().optional(),
    degreeLevel: z.string().optional(),
    duration: z.string().optional(),
    language: z.string().optional(),
    isFree: z.boolean().optional(),
    level: z.string().optional(),
  })
);

export function normalizeSavedOption(value: unknown): ExploreItem {
  return schema.parse(value);
}

export function readSavedOptions(value: unknown): ExploreItem[] {
  if (!Array.isArray(value)) {
    throw new Error('Invalid saved options');
  }
  const items = new Map<string, ExploreItem>();
  for (const entry of value) {
    const parsed = schema.safeParse(entry);
    if (parsed.success) {
      items.set(`${parsed.data.type}:${parsed.data.id}`, parsed.data);
    }
  }
  return [...items.values()];
}
