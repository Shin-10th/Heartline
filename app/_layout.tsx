import { useFonts, Fredoka_500Medium, Fredoka_600SemiBold } from "@expo-google-fonts/fredoka";
import { Quicksand_500Medium, Quicksand_600SemiBold, Quicksand_700Bold } from "@expo-google-fonts/quicksand";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider, useTheme } from "../theme/ThemeContext";

function ThemedStack() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      {/* Home and Settings draw their own full-bleed header to match the
          design -- the native Stack header is turned off for both. */}
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="settings" options={{ headerShown: false }} />
      <Stack.Screen name="schedule" options={{ title: "Golden Hour" }} />
      <Stack.Screen name="voice" options={{ title: "Voice Notes" }} />
      <Stack.Screen name="rituals" options={{ title: "Rituals" }} />
      <Stack.Screen name="world" options={{ title: "World" }} />
      <Stack.Screen name="pair" options={{ title: "Account & Pairing" }} />
    </Stack>
  );
}

// Root layout for all Heartlines screens.
// Wrap with auth/couple-pairing providers here once services/firebase.ts is wired up.
export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fredoka_500Medium,
    Fredoka_600SemiBold,
    Quicksand_500Medium,
    Quicksand_600SemiBold,
    Quicksand_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedStack />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
