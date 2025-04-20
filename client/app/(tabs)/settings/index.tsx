// app/(tabs)/settings/index.tsx
import { View, StyleSheet } from 'react-native';
import { List } from 'react-native-paper';
import { useRouter, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';

export default function SettingsHome() {
  const router = useRouter();
  const navigation = useNavigation();

  // Set the title of the screen
    useLayoutEffect(() => {
      navigation.setOptions({ title: 'Settings' });
    }, [navigation]);
  

  return (
    <View style={styles.container}>
      <List.Section>
        <List.Item
          title="Modifier le profil"
          left={() => <List.Icon icon="account-edit" />}
          onPress={() => router.push('/(tabs)/settings/edit-profile')}
        />
        <List.Item
          title="Changer le mot de passe"
          left={() => <List.Icon icon="lock" />}
          onPress={() => router.push('/(tabs)/settings/change-password')}
        />
        <List.Item
          title="Se déconnecter"
          left={() => <List.Icon icon="logout" />}
          onPress={() => router.push('/(tabs)/settings/deconnexion')}
        />
      </List.Section>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
});
