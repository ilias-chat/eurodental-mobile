# Push Notifications Implementation

## Overview
This app now includes a complete push notification system that works with Expo's push service and can integrate with your Laravel backend.

## Features

### ✅ What's Implemented
- **Local Notifications**: Send notifications immediately from within the app
- **Scheduled Notifications**: Schedule notifications for future delivery
- **Push Token Management**: Automatically registers and stores Expo push tokens
- **Permission Handling**: Manages notification permissions gracefully
- **Notification Settings**: User-configurable notification preferences
- **Test Notifications**: Built-in testing tools for all notification types
- **Deep Linking**: Notifications can navigate to specific screens

### 🔧 Components Created
1. **NotificationService** (`services/NotificationService.js`) - Core notification functionality
2. **NotificationHandler** (`components/NotificationHandler.js`) - Handles incoming notifications
3. **NotificationSettings** (`components/NotificationSettings.js`) - Settings UI
4. **notificationUtils** (`utils/notificationUtils.js`) - Helper functions
5. **Notification Settings Screen** (`app/notification-settings.js`) - Full settings page

## How to Use

### 1. Test Notifications
The tasks screen now has test notification buttons:
- **Test Notification**: Sends an immediate local notification
- **Test Scheduled (5s)**: Schedules a notification for 5 seconds later
- **Settings**: Opens the full notification settings page

### 2. Notification Settings
Access via the Settings button on the tasks screen or navigate to `/notification-settings`:
- View permission status
- Request permissions if needed
- View your push token
- Configure notification preferences
- Test different notification types

### 3. Programmatic Usage
```javascript
import { 
  notifyNewTask, 
  notifyNewClient, 
  notifyTaskReminder 
} from '@/utils/notificationUtils';

// Send task notification
await notifyNewTask('Complete client report', 123);

// Send client notification
await notifyNewClient('John Doe', 456);

// Schedule task reminder
await notifyTaskReminder('Client meeting', 789, '2024-01-15T10:00:00Z');
```

## Technical Details

### Push Token Flow
1. App starts → NotificationService registers for push notifications
2. User grants permissions → Expo provides push token
3. Token stored locally and sent to Laravel backend
4. Backend can use token to send push notifications

### Notification Types
- **Local**: Immediate, app-generated notifications
- **Scheduled**: Future notifications with custom timing
- **Push**: Server-sent notifications via Expo's service

### Data Structure
Notifications include metadata for navigation:
```javascript
{
  type: 'task',           // Notification type
  taskId: 123,            // Related entity ID
  screen: '/task-details' // Navigation target
}
```

## Testing

### Requirements
- **Physical Device**: Notifications don't work in simulators
- **Expo Go App**: Test with Expo Go first
- **Permissions**: Grant notification permissions when prompted

### Test Scenarios
1. **Basic Notification**: Tap "Test Notification" button
2. **Scheduled Notification**: Tap "Test Scheduled (5s)" button
3. **Task Notification**: Tap "Test Task Notification" in settings
4. **Client Notification**: Tap "Test Client Notification" in settings
5. **Permission Flow**: Test permission request/denial scenarios

## Integration with Laravel Backend

### API Endpoint
Your Laravel backend needs this endpoint:
```
POST /api/push-token
{
  "token": "ExponentPushToken[...]"
}
```

### Sending Notifications
Use Expo's push service to send notifications:
```php
// Example Laravel code
$response = Http::post('https://exp.host/--/api/v2/push/send', [
    'to' => $pushToken,
    'title' => 'New Task',
    'body' => 'You have a new task assigned',
    'data' => ['type' => 'task', 'taskId' => 123]
]);
```

## Configuration

### app.json
The app.json has been updated with:
- `expo-notifications` plugin
- `useNextNotificationsApi: true` for Android
- Notification icon and color settings

### Dependencies
Added these packages:
- `expo-notifications`
- `expo-device`
- `expo-constants`

## Troubleshooting

### Common Issues
1. **"Must use physical device"**: Notifications only work on real devices
2. **Permission denied**: Check device settings and request again
3. **Token not generated**: Ensure proper project ID in app.json
4. **Notifications not showing**: Check notification settings and permissions

### Debug Steps
1. Check console logs for error messages
2. Verify notification permissions in device settings
3. Test with Expo Go app first
4. Ensure proper EAS project ID configuration

## Next Steps

### For Development
1. Test all notification types on physical device
2. Verify push token is sent to backend
3. Test deep linking from notifications

### For Production
1. Build standalone app using EAS Build
2. Configure production push service
3. Implement server-side notification logic
4. Add notification analytics and tracking

## Support

If you encounter issues:
1. Check the console logs for error messages
2. Verify all dependencies are properly installed
3. Ensure you're testing on a physical device
4. Check that your EAS project ID is correct in app.json

The notification system is now fully integrated and ready for testing!
