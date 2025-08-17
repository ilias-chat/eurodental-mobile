import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import React, { createContext, useContext, useEffect, useState } from 'react';
import NotificationService from '../services/NotificationService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Load user data from storage on app start
    const loadUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('user');
        const storedToken = await AsyncStorage.getItem('token');
        if (storedUser && storedToken) {
          setUser(JSON.parse(storedUser));
          setToken(storedToken);
        }
      } catch (error) {
        console.error('Failed to load user from storage', error);
      }
    };
    loadUser();
  }, []);

  useEffect(() => {
    // Setup notifications when both user and token are available
    if (user && token) {
      setupNotifications();
    }
  }, [user, token]);

  const setupNotifications = async () => {
    try {
      const pushToken = await NotificationService.registerForPushNotificationsAsync();
      if (pushToken) {
        // Store token in AsyncStorage for later use
        await AsyncStorage.setItem('expoPushToken', pushToken);
        
        // Send token to your Laravel backend
        await sendPushTokenToBackend(pushToken);
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };

    const sendPushTokenToBackend = async (pushToken) => {
    try {
      // Use the current token from state, or get it from storage as fallback
      const currentToken = token || await AsyncStorage.getItem('token');
      
      if (!currentToken) {
        return;
      }

      // Use the main api instance
      const api = axios.create({
        baseURL: 'https://eurodental.ma/api',
        timeout: 10000,
        headers: { Authorization: `Bearer ${currentToken}` }
      });

      await api.post('/push-token', { token: pushToken });
    } catch (error) {
      console.error('Error sending push token to backend:', error);
      
      // Retry once after a short delay if it's a network error
      if (error.message === 'Network Error' || error.code === 'NETWORK_ERROR') {
        setTimeout(async () => {
          try {
            const retryToken = token || await AsyncStorage.getItem('token');
            if (retryToken) {
              const retryApi = axios.create({
                baseURL: 'https://eurodental.ma/api',
                timeout: 10000,
                headers: { Authorization: `Bearer ${retryToken}` }
              });
              await retryApi.post('/push-token', { token: pushToken });
            }
          } catch (retryError) {
            console.error('Retry failed:', retryError);
          }
        }, 2000);
      }
    }
  };

  const login = async (userData, authToken) => {
    try {
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('token', authToken);
      setUser(userData);
      setToken(authToken);
    } catch (error) {
      console.error('Failed to save user to storage', error);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('expoPushToken');
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Failed to remove user from storage', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
