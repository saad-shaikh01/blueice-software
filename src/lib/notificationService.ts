import { db } from '@/lib/db';
import { sendPushNotification } from './firebase-admin';

type NotificationPayload = {
  title: string;
  body: string;
  url: string;
  type?: string;
  senderId: string;
  taskId?: string;
  recipients: string[];
};

export const sendNotification = async ({
  title,
  body,
  url,
  type = 'general',
  taskId = '67fd476e21624654206f479d',
  senderId,
  recipients,
}: NotificationPayload) => {
  if (!recipients || recipients.length === 0) return;

  // 1. Push Notification

  // 2. Save Notification in DB
  const notification = await db.notification.create({
    data: {
      title,
      body,
      url,
      type,
      // id,
      senderId,
      recipients,
    },
  });

  // 3. Save Notification Receipts
  await db.notificationReceipt.createMany({
    data: recipients.map(userId => ({
      userId,
      notificationId: notification.id,
    })),
  });

  await sendPushNotification(recipients, title, body, { url, type, taskId });
};
export const sendPushNotificationInBackground = async ({
  title,
  body,
  url,
  type = 'general',
  taskId = '67fd476e21624654206f479d',
  senderId,
  recipients,
}: NotificationPayload) => {

  setImmediate(async () => {
    try {
      if (!recipients || recipients.length === 0) return;

      // 1. Push Notification

      // 2. Save Notification in DB
      const notification = await db.notification.create({
        data: {
          title,
          body,
          url,
          type,
          // id,
          senderId,
          recipients,
        },
      });

      // 3. Save Notification Receipts
      await db.notificationReceipt.createMany({
        data: recipients.map(userId => ({
          userId,
          notificationId: notification.id,
        })),
      });

      await sendPushNotification(recipients, title, body, { url, type, taskId });
    } catch (error) {
      console.error('Error in background notification processing:', error);
    }
  });
};

export const sendPushNotificsssationInBackground = (
  userIds: string[],
  title: string,
  body: string,
  data?: Record<string, string>
) => {
  // Use setImmediate to ensure this runs after HTTP response is sent
  setImmediate(async () => {
    try {
      await sendPushNotification(userIds, title, body, data);
    } catch (error) {
      console.error('[BACKGROUND_PUSH] Error in background push notification:', error);
    }
  });
};

///////////////////////////////////////

// export const sendNotificationInBackground = (notificationData: NotificationPayload) => {
//   // Use setImmediate to ensure this runs after the HTTP response is sent
//   setImmediate(async () => {
//     try {
//       console.log('[BACKGROUND_NOTIFICATION] Processing notification for', notificationData.recipients.length, 'recipients');

//       const {
//         title,
//         body,
//         url,
//         type = 'general',
//         taskId = '67fd476e21624654206f479d',
//         senderId,
//         recipients,
//       } = notificationData;

//       if (!recipients || recipients.length === 0) {
//         console.log('[BACKGROUND_NOTIFICATION] No recipients, skipping notification');
//         return;
//       }

//       // 1. Save Notification in DB first
//       let notification;
//       try {
//         notification = await db.notification.create({
//           data: {
//             title,
//             body,
//             url,
//             type,
//             senderId,
//             recipients,
//           },
//         });
//         console.log('[BACKGROUND_NOTIFICATION] Notification saved to DB:', notification.id);
//       } catch (dbError) {
//         console.error('[BACKGROUND_NOTIFICATION] Error saving notification to DB:', dbError);
//         // Continue with push notification even if DB save fails
//       }

//       // 2. Save Notification Receipts
//       if (notification) {
//         try {
//           await db.notificationReceipt.createMany({
//             data: recipients.map(userId => ({
//               userId,
//               notificationId: notification.id,
//             })),
//           });
//           console.log('[BACKGROUND_NOTIFICATION] Notification receipts created');
//         } catch (receiptError) {
//           console.error('[BACKGROUND_NOTIFICATION] Error creating notification receipts:', receiptError);
//           // Continue with push notification even if receipts fail
//         }
//       }

//       // 3. Send Push Notification
//       const pushResult = await sendPushNotification(
//         recipients,
//         title,
//         body,
//         { url, type, taskId }
//       );

//       console.log('[BACKGROUND_NOTIFICATION] Push notification result:', pushResult);

//     } catch (error) {
//       console.error('[BACKGROUND_NOTIFICATION] Critical error in background notification processing:', error);

//       // Store failed notification for potential retry
//       try {
//         // await db.failedNotification.create({
//         //   data: {
//         //     payload: JSON.stringify(notificationData),
//         //     error: error instanceof Error ? error.message : String(error),
//         //     createdAt: new Date(),
//         //     retryCount: 0,
//         //   },
//         // });
//         console.log('[BACKGROUND_NOTIFICATION] Failed notification stored for retry');
//       } catch (failedStorageError) {
//         console.error('[BACKGROUND_NOTIFICATION] Failed to store failed notification:', failedStorageError);
//       }
//     }
//   });
// };