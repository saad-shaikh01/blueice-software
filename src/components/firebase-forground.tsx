'use client'
import useFcmToken from "@/hooks/use-fcmtoken";
import { getMessaging, onMessage } from 'firebase/messaging';
import firebaseApp from '../../firebase';
import { ElementRef, useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from "@tanstack/react-query";

export default function FcmTokenComp() {
  const { token, notificationPermissionStatus } = useFcmToken();
  const ringAudioRef = useRef<ElementRef<'audio'>>(null)

  const playRingSound = () => {
    if (ringAudioRef?.current) {
      ringAudioRef.current.currentTime = 0
      ringAudioRef.current.play()
    }
  }

  const queryClient = useQueryClient();
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      if (notificationPermissionStatus === 'granted') {
        console.log("permission grandted")
        const messaging = getMessaging(firebaseApp);
        const unsubscribe = onMessage(messaging, (payload) => {
          console.log('Foreground push notification received:', payload);
          playRingSound()
          // queryClient.setQueryData(['notifications'], (old) => {
          //   return {
          //     ...old,
          //     notifications: [
          //       {
          //         id: payload.data.notificationId,
          //         title: payload.data.title,
          //         body: payload.data.body,
          //         read: false,
          //         createdAt: new Date().toISOString(),
          //       },
          //       ...old.notifications,
          //     ],
          //   };
          // });


          if (payload?.data?.type === 'comment') {
            queryClient.invalidateQueries({
              queryKey: ['comments', payload?.data?.taskId],
            })
          }
          setTimeout(() => {
            queryClient.invalidateQueries({
              queryKey: ['notifications'],
            });
          }, 1000);

          toast.message(payload?.data?.title || "📩 New Notification", {
            description: payload?.data?.body || "You have a new message.",
            duration: 5000,
            action: {
              label: "View",
              onClick: () => {
                // You can navigate or perform some action here
                // console.log("View clicked");
                const url = payload?.data?.url;
                if (url) {
                  window.location.href = url;
                } else {
                  console.log("No URL provided in the notification data.");
                }
              },
            },
          });
        });
        return () => {
          unsubscribe();
        };
      }
    }
  }, [notificationPermissionStatus]);

  return (
    <div>
      <audio ref={ringAudioRef} className="hidden invisible opacity-0" src="/files/new-msg-ring.wav" > </audio>
    </div>
  )
}