import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';
import 'react-native-reanimated';
import Toast from 'react-native-toast-message';
import AnimatedDrawer from '../components/AnimatedDrawer';
import { AuthProvider } from '../components/AuthContext';
import { DrawerProvider } from '../components/DrawerContext';

export default function RootLayout() {
  const scheme = useColorScheme();

  return (
    <>
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
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
    </ThemeProvider>
      <Toast />
    </>
  );
}
