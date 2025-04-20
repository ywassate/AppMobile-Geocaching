// app/(tabs)/settings/deconnexion.tsx
import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function DeconnexionScreen() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      await AsyncStorage.removeItem('token');
      setTimeout(() => {
        router.replace('/');
      }, 1000); // redirection après 1 seconde
    };
    logout();
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text style={styles.text}>Déconnexion en cours...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  text: { marginTop: 16, fontSize: 16, color: '#888' },
});
