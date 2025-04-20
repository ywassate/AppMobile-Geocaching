// ✅ app/profile/hides.tsx
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function HidesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🧱 Géocaches cachées</Text>
      <Text>Liste des caches créées par toi.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
});
