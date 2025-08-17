import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import NotificationService from '../services/NotificationService';

export default function NotificationHandler() {
  const router = useRouter();
  const notificationListener = useRef();
  const responseListener = useRef();

  useEffect(() => {
    // Handle notifications received while app is running
    notificationListener.current = NotificationService.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // You can handle in-app notifications here
    });

    // Handle notification taps
    responseListener.current = NotificationService.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      // Navigate based on notification data
      if (data.screen) {
        router.push(data.screen);
      }
      
      // Handle specific notification types
      if (data.type === 'task') {
        router.push(`/task-details?id=${data.taskId}`);
      } else if (data.type === 'client') {
        router.push(`/client-details?id=${data.clientId}`);
      }
    });

    return () => {
      NotificationService.removeNotificationSubscription(notificationListener.current);
      NotificationService.removeNotificationSubscription(responseListener.current);
    };
  }, [router]);

  return null; // This component doesn't render anything
}
