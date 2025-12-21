import { UserRole } from '@prisma/client';
import { z } from 'zod';

export const signInFormSchema = z.object({
  emailOrPhone: z.string().trim().min(1, 'Email or phone number is required.'),
  password: z.string({
    required_error: 'Password is required.',
  }),
});

export const signUpFormSchema = z.object({
  name: z.string().trim().min(1, 'Full name is required.'),
  email: z.string().trim().email({
    message: 'Invalid email.',
  }).optional().or(z.literal('')).transform((val) => val === '' ? null : val),
  phoneNumber: z.string().trim().min(10, 'Phone number must be at least 10 digits.'),
  password: z.string().min(8, 'Password must be atleast 8 characters.').max(256, 'Password cannot exceed 256 characters.'),
  role: z.nativeEnum(UserRole).optional(),
});
export const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  image: z.union([z.instanceof(File), z.string().transform((value) => (value === '' ? undefined : value))]).optional(),
  phoneNumber: z.string().optional(),
  birthDate: z.coerce.date().optional(),
  gender: z.enum(['MALE', 'FEMALE', 'NONBINARY']).optional(),
  designation: z.string().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8),
  confirmPassword: z.string().min(8)
});