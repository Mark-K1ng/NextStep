import { z } from 'zod';

export const emailSchema = z.string().email('Email invalid');

export const passwordSchema = z
  .string()
  .min(10, 'Parola trebuie să aibă cel puțin 10 caractere');

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  displayName: z.string().min(2, 'Numele trebuie să aibă cel puțin 2 caractere'),
  gradeLevel: z.enum(['V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'student']),
  county: z.string().min(2, 'Județul este obligatoriu'),
  favoriteSubjects: z.array(z.string()).min(1, 'Selectează cel puțin o materie'),
  interests: z.array(z.string()).min(1, 'Selectează cel puțin un interes'),
});

export const profileUpdateSchema = z.object({
  displayName: z.string().min(2).optional(),
  gradeLevel: z.enum(['V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'student']).optional(),
  county: z.string().min(2).optional(),
  favoriteSubjects: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Parola curentă este obligatorie'),
  newPassword: passwordSchema,
});
