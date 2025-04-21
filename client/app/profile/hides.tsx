// app/profile/hides.tsx
import { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import { Card, Title, Paragraph } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { getToken } from '../../hooks/useToken';
import { API_URL } from '../../constants/api';
import { SafeAreaView } from 'react-native-safe-area-context';

type Geocache = {
  _id: string;
  description?: string;
  difficulty: number;
  coordinates?: {
    coordinates: [number, number];
  };
  creator: {
    email?: string;
    username?: string;
    _id: string;
  };
  createdAt?: string;
};

export default function HidesScreen() {
  const [caches, setCaches] = useState<Geocache[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchMyCaches();
  }, []);

  // Fonction pour décoder le JWT et extraire l'ID utilisateur
  const decodeToken = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error("Erreur décodage token:", e);
      return null;
    }
  };

  const fetchMyCaches = async () => {
    try {
      const token = await getToken();
      console.log("Token récupéré:", token ? "Oui" : "Non");
      
      if (!token) {
        Alert.alert('Erreur', 'Vous devez être connecté pour voir vos caches');
        return;
      }

      // Décodage du token pour obtenir l'ID utilisateur
      const decoded = decodeToken(token);
      const userId = decoded?.id;
      console.log("ID utilisateur:", userId);

      // Utiliser l'endpoint général des caches
      console.log("Récupération des caches CRÉÉES par moi");
      const response = await fetch(`${API_URL}/api/caches`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Statut de la réponse:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erreur API:", errorText);
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }

      const allCaches = await response.json();
      console.log("Nombre total de caches:", allCaches.length);
      
      // Filtrer pour ne garder QUE les caches CRÉÉES par l'utilisateur
      const createdCaches = allCaches.filter((cache: Geocache) => {
        const isCreator = cache.creator && 
          cache.creator._id === userId;
        
        if (isCreator) {
          console.log("Cache créée trouvée:", cache._id, cache.description);
        }
        
        return isCreator;
      });
      
      console.log(`J'ai CRÉÉ ${createdCaches.length} caches`);
      setCaches(createdCaches);
    } catch (error) {
      console.error('Erreur complète:', error);
      Alert.alert('Erreur', 'Impossible de charger vos caches');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Date inconnue';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const handleCachePress = (cache: Geocache) => {
    if (cache?.coordinates?.coordinates) {
      const [lng, lat] = cache.coordinates.coordinates;
      router.push({
        pathname: '/(tabs)/explore',
        params: { lat, lng }
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4e73df" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>🧭 Mes caches créées</Text>
        <Text style={styles.subtitle}>Vous avez créé {caches.length} cache{caches.length !== 1 ? 's' : ''}</Text>
      </View>

      {caches.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Vous n'avez pas encore créé de cache</Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => router.push('/(tabs)/add-cache')}
          >
            <Text style={styles.createButtonText}>Créer ma première cache</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={caches}
          keyExtractor={(item) => item?._id || Math.random().toString()}
          renderItem={({ item }) => {
            // Vérification de sécurité pour éviter les erreurs si item est undefined
            if (!item) return null;
            
            return (
              <TouchableOpacity onPress={() => handleCachePress(item)}>
                <Card style={styles.card}>
                  <Card.Content>
                    <Title>{item.description || 'Cache sans nom'}</Title>
                    <Paragraph>Difficulté: {item.difficulty || 0}/5</Paragraph>
                    {item.createdAt && (
                      <Paragraph>Créée le: {formatDate(item.createdAt)}</Paragraph>
                    )}
                    {item.coordinates?.coordinates && (
                      <Paragraph>
                        Position: {item.coordinates.coordinates[1].toFixed(4)}, {item.coordinates.coordinates[0].toFixed(4)}
                      </Paragraph>
                    )}
                  </Card.Content>
                </Card>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fc',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e3e6f0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4e73df',
  },
  subtitle: {
    fontSize: 16,
    color: '#858796',
    marginTop: 4,
  },
  list: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
    elevation: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyStateText: {
    fontSize: 18,
    color: '#858796',
    textAlign: 'center',
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#4e73df',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});