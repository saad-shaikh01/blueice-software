import { User } from '@prisma/client';

export type AppUser = Omit<User, 'createdAt' | 'updatedAt' | 'birthDate' | 'resetPasswordExpire' | 'passwordChangedAt'> & {
  createdAt: string | Date;
  updatedAt: string | Date;
  birthDate: string | Date | null;
  resetPasswordExpire: string | Date | null;
  passwordChangedAt: string | Date | null;
};
