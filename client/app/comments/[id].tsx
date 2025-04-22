//app/(tabs)/comments/[cacheId].tsx

import { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TextInput, TouchableOpacity, ActivityIndicator, Alert, Text } from 'react-native';
import { Card, Avatar, Button, IconButton } from 'react-native-paper';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { getToken, getUserEmail } from '../../hooks/useToken';
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
  const router = useRouter();
  const params = useLocalSearchParams();
  const cacheId = params.id as string;

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    fetchUserEmail();
    if (cacheId) fetchComments();
  }, [cacheId, refreshCount]);

  const fetchUserEmail = async () => {
    const email = await getUserEmail();
    setUserEmail(email);
  };

  const fetchComments = async () => {
    setLoading(true);
    setError(null);
    const token = await getToken();
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/caches/${cacheId}/comments`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (!response.ok || !Array.isArray(data)) {
        setError("Erreur lors du chargement des commentaires");
        return;
      }

      setComments(data);
    } catch (err) {
      console.error("Erreur réseau:", err);
      setError("Impossible de charger les commentaires");
    } finally {
      setLoading(false);
    }
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    setSubmitting(true);

    const token = await getToken();
    if (!token) return;

    try {
      await fetch(`${API_URL}/api/caches/${cacheId}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ comment: newComment, found: false }),
      });

      setNewComment('');
      setRefreshCount((prev) => prev + 1);
    } catch (err) {
      console.error("Erreur d'ajout de commentaire:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const deleteComment = async (commentId: string) => {
    const token = await getToken();
    if (!token) return;

    try {
      await fetch(`${API_URL}/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setRefreshCount((prev) => prev + 1);
    } catch (err) {
      console.error("Erreur suppression:", err);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {/* Bouton Retour */}
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Commentaires</Text>
      </View>

      {loading ? (
        <ActivityIndicator size="large" style={styles.loader} />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
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
                  <View style={{ flex: 1 }}>
                    <Text style={styles.username}>{item.user?.username || item.user?.email}</Text>
                    <Text style={styles.date}>{formatDate(item.createdAt)}</Text>
                  </View>

                  {userEmail && (userEmail === item.user?.email || userEmail === item.user?.username) && (
                    <IconButton
                      icon="trash-can"
                      iconColor="#e74a3b"
                      size={20}
                      onPress={() =>
                        Alert.alert("Supprimer le commentaire", "Confirmer ?", [
                          { text: "Annuler", style: "cancel" },
                          { text: "Supprimer", onPress: () => deleteComment(item._id), style: "destructive" },
                        ])
                      }
                    />
                  )}
                </View>
                <Text style={styles.commentText}>{item.comment}</Text>
              </Card.Content>
            </Card>
          )}
          contentContainerStyle={styles.commentsList}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>Aucun commentaire</Text>
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
        />
        <TouchableOpacity
          style={[styles.sendButton, (!newComment.trim() || submitting) && styles.sendButtonDisabled]}
          onPress={addComment}
          disabled={!newComment.trim() || submitting}
        >
          <Text style={styles.sendButtonText}>
            {submitting ? '...' : 'Envoyer'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fc' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e3e6f0',
  },
  backText: {
    color: '#4e73df',
    fontWeight: 'bold',
    fontSize: 16,
    marginRight: 16,
  },
  title: { fontSize: 20, fontWeight: 'bold', color: '#4e73df' },
  loader: { marginTop: 40 },
  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: '#e74a3b', marginBottom: 20 },
  commentsList: { padding: 16 },
  commentCard: { marginBottom: 12 },
  commentHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  avatar: { backgroundColor: '#4e73df', marginRight: 12 },
  username: { fontWeight: 'bold' },
  date: { fontSize: 12, color: '#858796' },
  commentText: { fontSize: 16 },
  emptyState: { alignItems: 'center', marginTop: 30 },
  emptyText: { color: '#858796' },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#e3e6f0',
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e3e6f0',
    borderRadius: 20,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fc',
    height: 40,
  },
  sendButton: {
    backgroundColor: '#4e73df',
    borderRadius: 20,
    marginLeft: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  sendButtonDisabled: { backgroundColor: '#d1d3e2' },
  sendButtonText: { color: '#fff', fontWeight: 'bold' },
});
