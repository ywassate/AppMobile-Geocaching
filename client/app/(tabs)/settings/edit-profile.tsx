import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Alert,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Text, TextInput, Button, Avatar } from 'react-native-paper';
import { getToken } from '../../../hooks/useToken';
import { API_URL } from '../../../constants/api';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditProfileScreen() {
  const [email, setEmail] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const token = await getToken();
      if (!token) return;

      try {
        const res = await fetch(`${API_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (res.ok) {
          setEmail(data.email || '');
          if (data.imageUrl) setImageUri(data.imageUrl);
        }
      } catch (err) {
        Alert.alert('Error', 'Unable to load profile info');
      }
    };

    fetchProfile();
  }, []);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.5,
    });

    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    const token = await getToken();
    if (!token) return;
  
    try {
      const formData = new FormData();
  
      formData.append('email', email);
  
      if (imageUri) {
        const fileName = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(fileName || '');
        const ext = match?.[1] || 'jpg';
  
        formData.append('avatar', {
          uri: imageUri,
          name: `avatar.${ext}`,
          type: `image/${ext}`,
        } as any);
      }
  
      const res = await fetch(`${API_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });
  
      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Error', data.message || 'Update failed');
      } else {
        Alert.alert('Success', 'Profile updated');
      }
    } catch (err) {
      Alert.alert('Error', 'Server unreachable');
    }
  };
  

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Edit your profile</Text>

        <TouchableOpacity style={styles.imageContainer} onPress={handlePickImage}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.avatar} />
          ) : (
            <Avatar.Icon icon="account" size={100} style={{ backgroundColor: '#0A4D4D' }} />
          )}
          <Text style={styles.imageText}>Tap to change your photo</Text>
        </TouchableOpacity>

        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Button mode="contained" onPress={handleSave} style={styles.button} labelStyle={styles.buttonLabel}>
          Save
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FDF6EC',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#0A4D4D',
    marginBottom: 20,
  },
  input: {
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#0A4D4D',
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonLabel: {
    fontWeight: 'bold',
    color: '#FDF6EC',
    fontSize: 16,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  imageText: {
    marginTop: 10,
    fontSize: 14,
    color: '#0A4D4D',
  },
});
