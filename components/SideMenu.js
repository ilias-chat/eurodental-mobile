import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import React from 'react';
import { Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';
import { useAuth } from './AuthContext';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.85, 350);

export default function SideMenu({ onClose }) {
  const { dark } = useTheme();
  const color = dark ? Colors.dark : Colors.light;
  const router = useRouter();
  const { user } = useAuth();

  const getInitials = (name) => {
    if (!name) return '';
    const names = name.split(' ');
    const initials = names.map(n => n[0].toUpperCase()).join('');
    return initials.substring(0, 2);
  };

  const { logout } = useAuth();

  const handleLogout = () => {
    onClose(); // close drawer
    logout();  // clear user & token from AuthContext
    router.replace('/login'); // navigate back to login screen
  };
  

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: color.background }]}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Ionicons name="close" size={28} color={color.text} />
      </TouchableOpacity>

      <View style={styles.content}>
        <View style={styles.profileContainer}>
            {user?.image ? (
                <Image source={{ uri: user.image }} style={styles.avatar} />
            ) : (
                <View style={[styles.avatar, { backgroundColor: color.primary }]}>
                <Text style={styles.avatarText}>{getInitials(user?.name)}</Text>
                </View>
            )}
            <View style={styles.userInfo}>
                <Text style={[styles.name, { color: color.text }]}>{user?.name}</Text>
                <Text style={[styles.email, { color: color.icon }]}>{user?.email}</Text>
            </View>
        </View>

        <View style={styles.menu}>
          <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={24} color={color.text} />
            <Text style={[styles.menuText, { color: color.text }]}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: DRAWER_WIDTH,
    height: '100%',
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 72,
    right: 20,
    zIndex: 10,
  },
  content: {
    flex: 1,
    paddingTop: 70,
    paddingHorizontal: 24,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 50,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  userInfo: {
    marginLeft: 16,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 14,
    marginTop: 4,
  },
  menu: {
    marginTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  menuText: {
    marginLeft: 16,
    fontSize: 16,
  },
});
