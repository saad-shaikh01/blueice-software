import { PrismaClient, User, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export interface AuthUser {
  id: string;
  email: string | null;
  name: string;
  role: UserRole;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

export function generateToken(user: AuthUser): string {
  return jwt.sign({ id: user.id, email: user.email, name: user.name, role: user.role }, process.env.JWT_SECRET!, { expiresIn: '30d' });
}

export async function verifyToken(token: string): Promise<User | null> {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as AuthUser & { iat: number };
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
    });

    if (!user) {
      return null;
    }

    // Check if password was changed after token was issued
    if (user.passwordChangedAt) {
      const passwordChangedTimestamp = Math.floor(user.passwordChangedAt.getTime() / 1000);
      if (decoded.iat < passwordChangedTimestamp) {
        // Token was issued before password change - invalidate it
        return null;
      }
    }

    return user;
  } catch {
    return null;
  }
}

export async function createUser(name: string, email: string | null, phoneNumber: string, password: string, role?: UserRole) {
  const hashedPassword = await hashPassword(password);
  return prisma.user.create({
    data: {
      name,
      email,
      phoneNumber,
      password: hashedPassword,
      role: role || UserRole.CUSTOMER,
    },
    select: {
      id: true,
      email: true,
      name: true,
      phoneNumber: true,
      role: true,
    },
  });
}

export async function authenticateUser(emailOrPhone: string, password: string) {
  // Try to find user by email first, then by phoneNumber
  const user = await prisma.user.findFirst({
    where: {
      OR: [{ email: emailOrPhone }, { phoneNumber: emailOrPhone }],
    },
  });

  if (!user || !user.password) {
    throw new Error('Invalid credentials');
  }

  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    throw new Error('Invalid credentials');
  }

  return user;
}
