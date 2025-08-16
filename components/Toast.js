import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, Text, View } from 'react-native';

const { width, height } = Dimensions.get('window');

const Toast = ({ visible, message, type = 'success', duration = 3000, onHide }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      // Slide in and fade in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onHide && onHide();
    });
  };

  if (!visible) return null;

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#00C851',
          borderColor: '#00A843',
        };
      case 'error':
        return {
          backgroundColor: '#FF4D4F',
          borderColor: '#E63946',
        };
      case 'info':
        return {
          backgroundColor: '#2CBEE8',
          borderColor: '#1E9BC8',
        };
      default:
        return {
          backgroundColor: '#00C851',
          borderColor: '#00A843',
        };
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'close-circle';
      case 'info':
        return 'information-circle';
      default:
        return 'checkmark-circle';
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        getToastStyle(),
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={styles.content}>
        <Ionicons name={getIcon()} size={20} color="white" style={styles.icon} />
        <Text style={styles.message} numberOfLines={3}>
          {message}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 9999,
    zIndex: 99999,
    // Force it to be above everything
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
});

export default Toast;
