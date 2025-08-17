import NotificationService from '../services/NotificationService';



// Task-related notification helpers
export const notifyNewTask = async (taskTitle, taskId) => {
  try {
    await NotificationService.sendLocalNotification(
      'New Task Assigned',
      `You have a new task: ${taskTitle}`,
      { type: 'task', taskId, screen: '/task-details' }
    );
  } catch (error) {
    console.error('Error sending task notification:', error);
  }
};

export const notifyTaskReminder = async (taskTitle, taskId, dueDate) => {
  try {
    const dueTime = new Date(dueDate).getTime();
    const now = Date.now();
    const secondsUntilDue = Math.max(0, Math.floor((dueTime - now) / 1000));
    
    if (secondsUntilDue > 0) {
      await NotificationService.scheduleNotification(
        'Task Reminder',
        `Don't forget to complete: ${taskTitle}`,
        { seconds: secondsUntilDue },
        { type: 'task_reminder', taskId, screen: '/task-details' }
      );
    }
  } catch (error) {
    console.error('Error scheduling task reminder:', error);
  }
};

// Client-related notification helpers
export const notifyNewClient = async (clientName, clientId) => {
  try {
    await NotificationService.sendLocalNotification(
      'New Client Added',
      `New client: ${clientName}`,
      { type: 'client', clientId, screen: '/client-details' }
    );
  } catch (error) {
    console.error('Error sending client notification:', error);
  }
};

// Get current push token
export const getCurrentPushToken = () => {
  return NotificationService.getExpoPushToken();
};

// Check notification permissions
export const checkNotificationPermissions = async () => {
  try {
    const { status } = await NotificationService.getPermissionsAsync();
    return status;
  } catch (error) {
    console.error('Error checking notification permissions:', error);
    return 'unknown';
  }
};
