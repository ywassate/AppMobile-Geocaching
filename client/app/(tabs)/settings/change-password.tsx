// ✅ app/settings/change-password.tsx
import { useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { getToken } from '../../../hooks/useToken';
import { API_URL } from '../../../constants/api';

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const handleChangePassword = async () => {
    const token = await getToken();
    if (!token) return;

    try {
      const res = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Erreur', data.message || 'Échec du changement');
      } else {
        Alert.alert('Succès', 'Mot de passe mis à jour');
        setCurrentPassword('');
        setNewPassword('');
      }
    } catch (err) {
      Alert.alert('Erreur', 'Serveur injoignable');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Changer le mot de passe</Text>

      <TextInput
        label="Mot de passe actuel"
        value={currentPassword}
        onChangeText={setCurrentPassword}
        secureTextEntry
        style={styles.input}
        mode="outlined"
      />
      <TextInput
        label="Nouveau mot de passe"
        value={newPassword}
        onChangeText={setNewPassword}
        secureTextEntry
        style={styles.input}
        mode="outlined"
      />

      <Button mode="contained" onPress={handleChangePassword} style={styles.button}>
        Enregistrer
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
});