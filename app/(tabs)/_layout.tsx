import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import TopBar from '../../components/TopBar';
import { Colors } from '../../constants/Colors';


export default function TabsLayout() {
  return (
    <>
      <TopBar />
      <Tabs
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'cube-outline';
            if (route.name === 'clients') iconName = 'people-outline';
            else if (route.name === 'tasks') iconName = 'checkmark-done-circle-outline';
            else if (route.name === 'stock') iconName = 'cube-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: Colors.dark.primary,
          tabBarInactiveTintColor: 'gray',
          headerShown: false,
        })}
      >
        <Tabs.Screen name="tasks" options={{ title: 'Tâches' }} />
        <Tabs.Screen name="clients" options={{ title: 'Clients' }} />
        <Tabs.Screen name="stock" options={{ title: 'Stock' }} />
      </Tabs>
    </>
  );
}
