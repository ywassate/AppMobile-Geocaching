// ✅ app/profile/finds.tsx
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function FindsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>📍 Géocaches trouvées</Text>
      <Text>Liste des trouvailles à afficher ici.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
});
