// ✅ app/(tabs)/settings/_layout.tsx
import { Stack } from 'expo-router';

export default function SettingsStackLayout() {
  return <Stack screenOptions={{ headerShown: true }} />;
}
