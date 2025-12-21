// 'use server';

// import { createSessionClient } from '@/lib/appwrite';

// export const getCurrent = async () => {
//   try {
//     const { account } = await createSessionClient();

//     return await account.get();
//   } catch {
//     return null;
//   }
// };




'use server';

import { cookies } from 'next/headers';

import { AUTH_COOKIE } from './constants';
import { verifyToken } from '@/lib/authenticate';

export const getCurrent = async () => {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE)?.value;

    if (!token) {
      return null;
    }

    const user = await verifyToken(token);
    return user;
  } catch {
    return null;
  }
};

export const getSession = () => {
  const cookieStore = cookies();
  return cookieStore.get(AUTH_COOKIE)?.value;
};