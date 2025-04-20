import { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, FlatList, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getToken } from '../../hooks/useToken';
import { API_URL } from '../../constants/api';
import { SafeAreaView } from 'react-native-safe-area-context';

type Log = {
  user?: { email: string };
  comment: string;
  found: boolean;
  date: string;
};

export default function CommentsPage() {
  const { id } = useLocalSearchParams();
  const [logs, setLogs] = useState<Log[]>([]);
  const [newComment, setNewComment] = useState('');
  const router = useRouter();

  const fetchLogs = async () => {
    const token = await getToken();
    try {
      const res = await fetch(`${API_URL}/api/caches/${id}/logs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setLogs(data);
    } catch (err) {
      console.error('Erreur chargement logs :', err);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    const token = await getToken();
    try {
      const res = await fetch(`${API_URL}/api/caches/${id}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ comment: newComment, found: false }),
      });

      if (!res.ok) {
        Alert.alert('Erreur', 'Impossible d’ajouter le commentaire');
        return;
      }

      setNewComment('');
      fetchLogs();
    } catch (err) {
      console.error('Erreur ajout commentaire :', err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Commentaires</Text>

      <FlatList
        data={logs}
        keyExtractor={(_, index) => index.toString()}
        renderItem={({ item }) => (
          <View style={styles.comment}>
            <Text style={styles.author}>{item.user?.email || 'Utilisateur inconnu'}</Text>
            <Text>{item.comment}</Text>
            <Text style={styles.date}>{new Date(item.date).toLocaleString()}</Text>
          </View>
        )}
      />

      <TextInput
        style={styles.input}
        placeholder="Ajouter un commentaire"
        value={newComment}
        onChangeText={setNewComment}
      />
      <Button title="Envoyer" onPress={handleAddComment} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  comment: {
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    paddingBottom: 10,
  },
  author: { fontWeight: '600', marginBottom: 2 },
  date: { fontSize: 12, color: '#999', marginTop: 2 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginTop: 20,
    marginBottom: 10,
  },
});
