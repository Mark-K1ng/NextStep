import { z } from 'zod';
import { ro } from '@/i18n/ro';
import { COUNTIES, GRADES } from '@/constants/profile-options';
export const emailSchema = z.string().trim().email(ro.validation.emailInvalid);
export const passwordSchema = z
  .string()
  .min(10, ro.validation.passwordMinLength);
export const gradeSchema = z.enum(GRADES, {
  error: ro.validation.gradeLevelRequired,
});
export const locationSchema = z
  .object({
    county: z.enum(COUNTIES, { error: ro.profileChoices.countyRequired }),
    sector: z.number().int().min(1).max(6).nullable().optional(),
  })
  .refine((value) => value.county !== 'București' || value.sector != null, {
    path: ['sector'],
    message: ro.profileChoices.sectorRequired,
  })
  .refine((value) => value.county === 'București' || value.sector == null, {
    path: ['sector'],
    message: ro.profileChoices.sectorOnlyCapital,
  });
export const registrationSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
    county: z.enum(COUNTIES, { error: ro.profileChoices.countyRequired }),
    sector: z.number().int().min(1).max(6).nullable().optional(),
    gradeLevel: gradeSchema,
    acceptedTerms: z.boolean().refine((value) => value, ro.auth.acceptTerms),
  })
  .refine((value) => locationSchema.safeParse(value).success, {
    path: ['county'],
    message: ro.profileChoices.locationRequired,
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: ro.validation.passwordsDoNotMatch,
  });
