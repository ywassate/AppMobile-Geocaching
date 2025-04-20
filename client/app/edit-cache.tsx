//app/(tabs)/edit-cache.tsx

import { useState } from 'react';
import { View, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../constants/api';

export default function EditCache() {
  const router = useRouter();
  const { id, descriptionInitiale, difficulteInitiale } = useLocalSearchParams();

  const [description, setDescription] = useState(descriptionInitiale as string || '');
  const [difficulte, setDifficulte] = useState(difficulteInitiale as string || '');

  const handleUpdate = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const response = await fetch(`http://${API_URL}/api/caches/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          description,
          difficulty: parseInt(difficulte, 10), 
        }),
      });

      if (response.ok) {
        Alert.alert('Succès', 'Cache mise à jour !');
        router.back();
      } else {
        Alert.alert('Erreur', 'Impossible de modifier la cache.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Erreur', 'Une erreur est survenue.');
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        placeholder="Description"
        value={description}
        onChangeText={setDescription}
        style={styles.input}
      />
      <TextInput
        placeholder="Difficulté"
        value={difficulte}
        onChangeText={setDifficulte}
        keyboardType="numeric"
        style={styles.input}
      />
      <Button title="Modifier la cache" onPress={handleUpdate} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5,
  },
});
