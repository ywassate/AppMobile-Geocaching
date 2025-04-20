// ✅ app/profile/stats.tsx
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function StatsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📊 Détails des statistiques</Text>
      <Text>Progression, badges, niveau, etc.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
});
