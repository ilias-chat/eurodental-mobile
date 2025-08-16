import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import AnimatedDrawer from '../components/AnimatedDrawer';
import { AuthProvider } from '../components/AuthContext';
import { DrawerProvider } from '../components/DrawerContext';
import { ThemeProvider, useThemeToggle } from '../components/ThemeContext';

function AppContent() {
  const { isDark } = useThemeToggle();
  
  return (
    <NavigationThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <AuthProvider>
        <DrawerProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="forgot-password" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="+not-found" />
          </Stack>

          <AnimatedDrawer />
        </DrawerProvider>
      </AuthProvider>
    </NavigationThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
      <Toast />
    </>
  );
}
