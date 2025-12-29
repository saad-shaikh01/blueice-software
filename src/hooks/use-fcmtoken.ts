'use client';

import { getMessaging, getToken } from 'firebase/messaging';
import { useEffect, useState } from 'react';

// import { getCurrent } from '@/features/auth/queries';
import { useCurrent } from '@/features/auth/api/use-current';
// import { getCurrent } from '@/features/auth/queries';
import { client } from '@/lib/hono';

import firebaseApp from '../../firebase';

const useFcmToken = () => {
  const [token, setToken] = useState('');
  const [notificationPermissionStatus, setNotificationPermissionStatus] = useState('');
  const { data: user } = useCurrent();

  useEffect(() => {
    const retrieveToken = async () => {
      if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

      if (!user) {
        console.log('No logged in user. Skipping FCM token registration.');
        return;
      }

      const permission = await Notification.requestPermission();
      setNotificationPermissionStatus(permission);
      if (permission !== 'granted') {
        console.log('Notification permission denied.');
        return;
      }
      const messaging = getMessaging(firebaseApp);
      const currentToken = await getToken(messaging, { vapidKey: process.env.VAPID_KEY });
      if (!currentToken) {
        console.log('No FCM token available.');
        return;
      }
      console.log('FCM Token retrieved:', currentToken);

      // Check if token is already stored locally
      const storedToken = localStorage.getItem('fcmToken');
      if (storedToken === currentToken) {
        console.log('FCM token already saved. Skipping API call.');
        return;
      }

      // Send token to backend via your Hono API
      const response = await client.api.auth.token['$post']({
        json: { token: currentToken },
      });

      if (response.ok) {
        localStorage.setItem('fcmToken', currentToken);
        console.log('FCM token sent to server and saved in localStorage.');
      } else {
        console.error('Failed to save FCM token to the server.');
      }

      // try {
      //   if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      //     const messaging = getMessaging(firebaseApp);

      //     const permission = await Notification.requestPermission();
      //     setNotificationPermissionStatus(permission);

      //     if (permission === 'granted') {
      //       const currentToken = await getToken(messaging, {
      //         vapidKey: 'BIf_iDy2KZGrwAPiudp5yxSt5RdMLN6HHrHgKXw_iMdB8p8bP3BRYWnzqhMJBatyJ4pwnp_kbeCSO9D1-yr2bIU', // Replace with your Firebase project's VAPID key
      //       });
      //       if (currentToken) {
      //         setToken(currentToken);
      //         console.log("FCM Token:", currentToken);  // ✅ Add this for debugging

      //         const localToken = localStorage.getItem('fcmToken');

      //         if (localToken !== currentToken) {
      //           const res = await client.api.auth.token['$post']({
      //             json: { token: currentToken },
      //           });

      //           // const user = await getCurrent(); // your /auth/current API
      //           if (res.ok) {
      //             // await saveFcmTokenToServer(currentToken); // Call backend only if needed
      //             localStorage.setItem('fcmToken', currentToken); // Save to localStorage
      //             console.log('🔐 Token sent to server and saved in localStorage.');
      //           } else {
      //             console.log('Failed to save token to server.');
      //           }
      //         } else {
      //           console.log('📦 Token already stored, skipping API call.');
      //         }
      //       }
      //     }
      //   }
      // } catch (error) {
      //   console.log('Error retrieving token:', error);
      // }
    };

    retrieveToken();
  }, [user]);

  return { token, notificationPermissionStatus };
};

export default useFcmToken;
