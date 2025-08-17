import { useTheme } from '@react-navigation/native';
import { Stack } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import NotificationSettings from '../components/NotificationSettings';
import { Colors } from '../constants/Colors';

export default function NotificationSettingsScreen() {
  const { dark } = useTheme();
  const color = dark ? Colors.dark : Colors.light;

  return (
    <View style={[styles.container, { backgroundColor: color.background }]}>
      <Stack.Screen
        options={{
          title: 'Notification Settings',
          headerStyle: { backgroundColor: color.background },
          headerTintColor: color.text,
          headerShadowVisible: false,
        }}
      />
      <NotificationSettings />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
