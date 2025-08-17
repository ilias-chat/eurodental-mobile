import { useTheme } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import NotificationService from '../services/NotificationService';
import {
    checkNotificationPermissions,
    getCurrentPushToken
} from '../utils/notificationUtils';

export default function NotificationSettings() {
  const { dark } = useTheme();
  const color = dark ? Colors.dark : Colors.light;
  
  const [pushToken, setPushToken] = useState('');
  const [permissionStatus, setPermissionStatus] = useState('unknown');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [taskNotifications, setTaskNotifications] = useState(true);
  const [clientNotifications, setClientNotifications] = useState(true);
  const [reminderNotifications, setReminderNotifications] = useState(true);

  useEffect(() => {
    loadNotificationSettings();
    checkPermissions();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const token = getCurrentPushToken();
      setPushToken(token || 'Not available');
    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  };

  const checkPermissions = async () => {
    try {
      const status = await checkNotificationPermissions();
      setPermissionStatus(status);
    } catch (error) {
      console.error('Error checking permissions:', error);
    }
  };

  const requestPermissions = async () => {
    try {
      const token = await NotificationService.registerForPushNotificationsAsync();
      if (token) {
        setPushToken(token);
        setPermissionStatus('granted');
        Alert.alert('Success', 'Notification permissions granted!');
      } else {
        setPermissionStatus('denied');
        Alert.alert('Permission Denied', 'Please enable notifications in your device settings.');
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Failed to request notification permissions.');
    }
  };



  const getPermissionStatusText = (status) => {
    switch (status) {
      case 'granted': return 'Granted';
      case 'denied': return 'Denied';
      case 'undetermined': return 'Not Determined';
      default: return 'Unknown';
    }
  };

  const getPermissionStatusColor = (status) => {
    switch (status) {
      case 'granted': return '#00C851';
      case 'denied': return '#FF4D4F';
      case 'undetermined': return '#FFC107';
      default: return '#999';
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: color.background }]}>
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: color.text }]}>
          Notification Permissions
        </Text>
        
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: color.text }]}>
            Status
          </Text>
          <Text style={[styles.settingValue, { color: getPermissionStatusColor(permissionStatus) }]}>
            {getPermissionStatusText(permissionStatus)}
          </Text>
        </View>

        {permissionStatus !== 'granted' && (
          <TouchableOpacity
            style={[styles.button, { backgroundColor: color.primary }]}
            onPress={requestPermissions}
          >
            <Text style={styles.buttonText}>Request Permissions</Text>
          </TouchableOpacity>
        )}

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: color.text }]}>
            Push Token
          </Text>
          <Text style={[styles.settingValue, { color: color.textSecondary }]} numberOfLines={2}>
            {pushToken}
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: color.text }]}>
          Notification Preferences
        </Text>
        
        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: color.text }]}>
            Enable Notifications
          </Text>
          <Switch
            value={notificationsEnabled}
            onValueChange={setNotificationsEnabled}
            trackColor={{ false: color.border, true: color.primary }}
            thumbColor={notificationsEnabled ? color.background : color.textSecondary}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: color.text }]}>
            Task Notifications
          </Text>
          <Switch
            value={taskNotifications}
            onValueChange={setTaskNotifications}
            trackColor={{ false: color.border, true: color.primary }}
            thumbColor={taskNotifications ? color.background : color.textSecondary}
            disabled={!notificationsEnabled}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: color.text }]}>
            Client Notifications
          </Text>
          <Switch
            value={clientNotifications}
            onValueChange={setClientNotifications}
            trackColor={{ false: color.border, true: color.primary }}
            thumbColor={clientNotifications ? color.background : color.textSecondary}
            disabled={!notificationsEnabled}
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={[styles.settingLabel, { color: color.text }]}>
            Reminder Notifications
          </Text>
          <Switch
            value={reminderNotifications}
            onValueChange={setReminderNotifications}
            trackColor={{ false: color.border, true: color.primary }}
            thumbColor={reminderNotifications ? color.background : color.textSecondary}
            disabled={!notificationsEnabled}
          />
        </View>
      </View>


    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingLabel: {
    fontSize: 16,
    flex: 1,
  },
  settingValue: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'right',
    flex: 1,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },

});
