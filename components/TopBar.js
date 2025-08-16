import { useTheme } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDrawer } from '../components/DrawerContext';
import { Colors } from '../constants/Colors';
import { useAuth } from './AuthContext';

export default function TopBar() {
  const { dark } = useTheme();
  const color = dark ? Colors.dark : Colors.light;
  const { openDrawer } = useDrawer();
  const { user } = useAuth();

  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return '';
    const names = name.split(' ');
    const initials = names.map(n => n[0]?.toUpperCase() || '').join('');
    return initials.substring(0, 2);
  };

  // Don't render if user is null (during logout)
  if (!user) {
    return null;
  }

  return (
    <>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <SafeAreaView style={[styles.container, { backgroundColor: color.background }]} edges={['top']}>
      <Image
        source={{ uri: 'https://eurodental.ma/storage/uploads/page_blocks/cvHUbpQ5qSVioTrcPJB4go5oZvnKLeY4vAg7bHjl.png' }}
        style={styles.logo}
        />


        <TouchableOpacity onPress={openDrawer}>
          {user && user.image ? (
            <Image source={{ uri: user.image }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: color.primary }]}>
              <Text style={[styles.avatarText, {color: color.background}]}>{getInitials(user?.name || '')}</Text>
            </View>
          )}
        </TouchableOpacity>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
    logo: {
        width: 200,  // adjust width as you want
        height: 50,  // adjust height to fit your topbar
        resizeMode: 'contain', // keep correct aspect ratio
      },      
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 16,
      
        // Android shadow
        elevation: 8,
      
        // iOS shadow
        shadowColor: '#000',
        shadowOpacity: 0.3,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 4 },
      
        backgroundColor: '#fff', // Always include background color for shadows to render properly
      },      
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold'
  }
});
