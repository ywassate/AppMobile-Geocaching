import { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert, Text } from 'react-native';
import { Card, Avatar, Button } from 'react-native-paper';
import { useLocalSearchParams } from 'expo-router';
import { getToken } from '../../hooks/useToken';
import { API_URL } from '../../constants/api';
import { SafeAreaView } from 'react-native-safe-area-context';

type Comment = {
  _id: string;
  user: {
    username?: string;
    email?: string;
  };
  comment: string;
  createdAt: string;
};

export default function CommentsScreen() {
  const params = useLocalSearchParams();
  const cacheId = params.cacheId as string;

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cacheId) fetchComments();
  }, [cacheId]);

  const fetchComments = async () => {
    setLoading(true);
    setError(null);

    const token = await getToken();
    if (!token) {
      setError("Vous devez être connecté pour voir les commentaires");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/comments/${cacheId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const textResponse = await response.text();
      console.log("🟢 Réponse brute (GET comments) :", textResponse);

      let data;
      try {
        data = JSON.parse(textResponse);
      } catch (parseError) {
        console.error("❌ Erreur de parsing JSON:", parseError);
        setError("Réponse invalide du serveur.");
        setLoading(false);
        return;
      }

      if (!response.ok) {
        setError(data.message || "Erreur lors du chargement des commentaires");
        setLoading(false);
        return;
      }

      const logs = Array.isArray(data.logs) ? data.logs : data;
      if (!Array.isArray(logs)) {
        setError("Format de données incorrect");
        setLoading(false);
        return;
      }

      setComments(logs);
      setError(null);
    } catch (err) {
      console.error("❌ Erreur réseau:", err);
      setError("Impossible de se connecter au serveur");
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    setError(null);

    const token = await getToken();
    if (!token) {
      Alert.alert('Erreur', 'Vous devez être connecté pour ajouter un commentaire');
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/caches/${cacheId}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          comment: newComment, // ✅ champs corrigé
          found: false,
        }),
      });

      const textResponse = await response.text();
      console.log("🟢 Réponse ajout commentaire :", textResponse);

      let data;
      try {
        data = JSON.parse(textResponse);
      } catch (parseError) {
        console.error("❌ Erreur de parsing JSON:", parseError);
        setError("Réponse invalide du serveur.");
        setSubmitting(false);
        return;
      }

      if (!response.ok) {
        setError(data.message || "Erreur lors de l'ajout du commentaire");
        setSubmitting(false);
        return;
      }

      setNewComment('');
      fetchComments(); // recharger
    } catch (err) {
      console.error("❌ Erreur réseau:", err);
      setError("Impossible de se connecter au serveur");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Commentaires</Text>
        {cacheId && <Text style={styles.subtitle}>Cache #{cacheId}</Text>}
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Button mode="contained" onPress={fetchComments} style={styles.retryButton}>
            Réessayer
          </Button>
        </View>
      ) : (
        <FlatList
          data={comments}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <Card style={styles.commentCard}>
              <Card.Content>
                <View style={styles.commentHeader}>
                  <Avatar.Icon size={36} icon="account" style={styles.avatar} />
                  <View>
                    <Text style={styles.username}>{item.user?.username || item.user?.email || 'Utilisateur'}</Text>
                    <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                  </View>
                </View>
                <Text style={styles.commentText}>{item.comment}</Text>
              </Card.Content>
            </Card>
          )}
          contentContainerStyle={styles.commentsList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Aucun commentaire pour cette cache</Text>
            </View>
          }
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ajouter un commentaire"
          value={newComment}
          onChangeText={setNewComment}
          multiline
        />
        <TouchableOpacity
          style={[styles.sendButton, (!newComment.trim() || submitting) && styles.sendButtonDisabled]}
          onPress={addComment}
          disabled={!newComment.trim() || submitting}
        >
          <Text style={styles.sendButtonText}>
            {submitting ? 'Envoi...' : 'Envoyer'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc' },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e3e6f0',
  },
  title: { fontSize: 22, fontWeight: 'bold', color: '#4e73df' },
  subtitle: { fontSize: 14, color: '#858796', marginTop: 4 },
  loader: { marginTop: 40 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { color: '#e74a3b', textAlign: 'center', marginBottom: 20 },
  retryButton: { backgroundColor: '#4e73df' },
  commentsList: { padding: 16 },
  commentCard: { marginBottom: 12 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { backgroundColor: '#4e73df', marginRight: 12 },
  username: { fontWeight: 'bold' },
  date: { fontSize: 12, color: '#858796' },
  commentText: { fontSize: 16 },
  emptyState: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#858796', textAlign: 'center' },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e3e6f0',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#e3e6f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    marginRight: 12,
    backgroundColor: '#f8f9fc',
  },
  sendButton: {
    backgroundColor: '#4e73df',
    borderRadius: 20,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d3e2',
  },
  sendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
