import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RecordsProvider } from '@/src/state/RecordsContext';
import { colors } from '@/src/ui/theme';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  return (
    <SafeAreaProvider>
      <RecordsProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="customers/new" />
          <Stack.Screen name="customers/[customerId]/index" />
          <Stack.Screen name="customers/[customerId]/edit" />
          <Stack.Screen name="jobs/new" />
          <Stack.Screen name="jobs/[jobId]/index" />
          <Stack.Screen name="jobs/[jobId]/edit" />
          <Stack.Screen name="estimates/new" />
          <Stack.Screen name="estimates/[estimateId]/edit" />
          <Stack.Screen name="quotes/[quoteId]/index" />
          <Stack.Screen name="quotes/[quoteId]/preview" />
          <Stack.Screen name="quotes/[quoteId]/versions" />
          <Stack.Screen name="quotes/[quoteId]/approval" />
          <Stack.Screen name="settings/app" />
          <Stack.Screen name="settings/data" />
          <Stack.Screen name="settings/templates/index" />
          <Stack.Screen name="settings/templates/labor/new" />
          <Stack.Screen name="settings/templates/labor/[templateId]" />
          <Stack.Screen name="settings/templates/material/new" />
          <Stack.Screen name="settings/templates/material/[templateId]" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </RecordsProvider>
    </SafeAreaProvider>
  );
}
