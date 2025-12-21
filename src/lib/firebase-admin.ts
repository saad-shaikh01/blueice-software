import * as admin from 'firebase-admin';
import { db } from './db';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const sendPushNotification = async (
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, string>
) => {
  try {
    // console.log('Sending notification to users:', userIds);

    // Get users' FCM tokens
    const users = await db.user.findMany({
      where: { id: { in: userIds } },
      select: { fcmTokens: true },
    });

    // console.log('Found users with tokens:', users);

    const tokens = users.flatMap((user) => user.fcmTokens || []);
    // console.log('FCM tokens to send to:', tokens);

    if (tokens.length === 0) {
      console.log('No FCM tokens found for users');
      return;
    }

    const message = {
      notification: {
        title,
        body,
      },
      data: {
        ...data,
        click_action: 'OPEN_TASK',
      },
      tokens,
    };

    // console.log('Sending message:', message);
    const response = await admin.messaging().sendEachForMulticast(message);
    // console.log('Successfully sent notifications:', response);

    // Log any failures
    // if (response.failureCount > 0) {
    //   console.error('Some notifications failed to send:', response.responses);
    // }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};