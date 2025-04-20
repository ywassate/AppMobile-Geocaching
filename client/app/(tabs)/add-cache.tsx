import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ImageBackground,
} from 'react-native';
import { useRouter } from 'expo-router';
import { getToken } from '../../hooks/useToken';
import { API_URL } from '../../constants/api';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';

export default function AddCacheScreen() {
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [description, setDescription] = useState('');
  const router = useRouter();

  const handleSubmit = async () => {
    const token = await getToken();

    if (!token) {
      Alert.alert('Erreur', 'Vous devez être connecté');
      return;
    }

    if (!lat || !lng || !difficulty) {
      Alert.alert('Champs obligatoires', 'Latitude, longitude et difficulté sont requis');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/caches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          difficulty: parseInt(difficulty),
          description,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Erreur serveur :', data);
        Alert.alert('Erreur', data.message || 'Erreur lors de l’ajout');
        return;
      }

      Alert.alert('Succès', 'Cache ajoutée !');

      const [lngSaved, latSaved] = data.coordinates.coordinates;
      router.replace({
        pathname: '/(tabs)/explore',
        params: {
          lat: latSaved.toString(),
          lng: lngSaved.toString(),
        },
      });
    } catch (err) {
      console.error('Erreur réseau :', err);
      Alert.alert('Erreur', 'Impossible de contacter le serveur');
    }
  };

  return (
    <ImageBackground
      source={require('../../assets/images/home.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.title}>Add a New Geocache</Text>

            <TextInput
              style={styles.input}
              placeholder="Latitude (e.g., 48.8584)"
              keyboardType="numeric"
              value={lat}
              onChangeText={setLat}
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.input}
              placeholder="Longitude (e.g., 2.2945)"
              keyboardType="numeric"
              value={lng}
              onChangeText={setLng}
              placeholderTextColor="#999"
            />
            <TextInput
              style={styles.input}
              placeholder="Difficulty (1-5)"
              keyboardType="numeric"
              value={difficulty}
              onChangeText={setDifficulty}
              placeholderTextColor="#999"
            />
            <TextInput
              style={[styles.input, { height: 100, textAlignVertical: 'top' }]}
              placeholder="Description (optional)"
              value={description}
              onChangeText={setDescription}
              multiline
              placeholderTextColor="#999"
            />

            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.button}
              labelStyle={styles.buttonLabel}
            >
              Add Cache
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(253, 246, 236, 0.12)', // fond transparent clair
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#0A4D4D',
    textAlign: 'center',
    marginBottom: 30,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  button: {
    marginTop: 10,
    backgroundColor: '#0A4D4D',
    borderRadius: 10,
    paddingVertical: 8,
  },
  buttonLabel: {
    color: '#FDF6EC',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
