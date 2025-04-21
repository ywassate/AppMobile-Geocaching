// app/profile/finds.tsx
import { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text, ActivityIndicator, Alert } from 'react-native';
import { Card, Title, Paragraph, Avatar } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { getToken } from '../../hooks/useToken';
import { API_URL } from '../../constants/api';
import { SafeAreaView } from 'react-native-safe-area-context';

type CacheLog = {
  user: string;
  found: boolean;
  comment?: string;
  date: string;
};

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
  logs?: CacheLog[];
  found?: boolean;
};

export default function FindsScreen() {
  const [foundCaches, setFoundCaches] = useState<Geocache[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchFoundCaches();
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

  const fetchFoundCaches = async () => {
    try {
      const token = await getToken();
      
      console.log("Token récupéré:", token ? "Oui" : "Non");
      
      if (!token) {
        Alert.alert('Erreur', 'Vous devez être connecté pour voir vos trouvailles');
        return;
      }

      // Décodage du token pour obtenir l'ID utilisateur
      const decoded = decodeToken(token);
      const userId = decoded?.id;
      console.log("ID utilisateur:", userId);

      // Essayer d'abord l'endpoint /api/caches/found
      console.log("Essai de l'API:", `${API_URL}/api/caches/found`);
      try {
        const foundResponse = await fetch(`${API_URL}/api/caches/found`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        console.log("Statut de la réponse found:", foundResponse.status);
        
        if (foundResponse.ok) {
          const foundData = await foundResponse.json();
          console.log("Nombre de caches trouvées (API):", foundData.length);
          
          if (foundData.length > 0) {
            setFoundCaches(foundData);
            setLoading(false);
            return;
          } else {
            console.log("L'API a retourné un tableau vide, essai de la solution alternative");
          }
        } else {
          console.log("L'endpoint /found n'a pas fonctionné, essai de la solution alternative");
        }
      } catch (foundError) {
        console.error("Erreur avec l'endpoint /found:", foundError);
      }

      // Solution de repli: utiliser l'endpoint général et filtrer les caches marquées comme trouvées
      console.log("Appel API général:", `${API_URL}/api/caches`);
      const response = await fetch(`${API_URL}/api/caches`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Statut de la réponse générale:", response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erreur API:", errorText);
        throw new Error(`Erreur ${response.status}: ${errorText}`);
      }

      const allCaches = await response.json();
      console.log("Nombre total de caches:", allCaches.length);
      
      // Filtrer pour ne garder que les caches trouvées
      const found = allCaches.filter((cache: Geocache) => {
        // Vérifier si la cache a des logs
        if (!cache.logs || !Array.isArray(cache.logs)) {
          return false;
        }
        
        // Vérifier si l'un des logs correspond à l'utilisateur et indique que la cache a été trouvée
        const isFound = cache.logs.some(log => {
          const logUserId = typeof log.user === 'string' ? log.user : log.user?._id || log.user;
          return logUserId === userId && log.found === true;
        });
        
        if (isFound) {
          console.log("Cache trouvée:", cache._id, cache.description);
          
          // Trouver le log correspondant pour obtenir la date et le commentaire
          const userLog = cache.logs.find(log => {
            const logUserId = typeof log.user === 'string' ? log.user : log.user?._id || log.user;
            return logUserId === userId && log.found === true;
          });
          
          // Enrichir la cache avec les informations de découverte
          cache.found = true;
          cache.foundAt = userLog?.date;
          cache.comment = userLog?.comment;
        }
        
        return isFound;
      });
      
      console.log("Nombre de caches trouvées (filtrage client):", found.length);
      setFoundCaches(found);
    } catch (error) {
      console.error('Erreur complète:', error);
      Alert.alert('Erreur', 'Impossible de charger vos trouvailles');
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
        <ActivityIndicator size="large" color="#1cc88a" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>📍 Mes caches trouvées</Text>
        <Text style={styles.subtitle}>Vous avez trouvé {foundCaches.length} cache{foundCaches.length !== 1 ? 's' : ''}</Text>
      </View>

      {foundCaches.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Vous n'avez pas encore trouvé de cache</Text>
          <TouchableOpacity 
            style={styles.exploreButton}
            onPress={() => router.push('/(tabs)/explore')}
          >
            <Text style={styles.exploreButtonText}>Explorer la carte</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={foundCaches}
          keyExtractor={(item) => item?._id || Math.random().toString()}
          renderItem={({ item }) => {
            // Vérification de sécurité pour éviter les erreurs si item est undefined
            if (!item) return null;
            
            return (
              <TouchableOpacity onPress={() => handleCachePress(item)}>
                <Card style={styles.card}>
                  <Card.Content>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardHeaderContent}>
                        <Title>{item.description || 'Cache sans nom'}</Title>
                        {item.foundAt && (
                          <Paragraph>Trouvée le: {formatDate(item.foundAt)}</Paragraph>
                        )}
                      </View>
                      <Avatar.Icon
                        size={40}
                        icon="check-circle"
                        color="#fff"
                        style={styles.foundIcon}
                      />
                    </View>
                    <Paragraph>Difficulté: {item.difficulty || 0}/5</Paragraph>
                    {item.comment && (
                      <View style={styles.commentBox}>
                        <Text style={styles.commentTitle}>Votre commentaire:</Text>
                        <Text style={styles.comment}>{item.comment}</Text>
                      </View>
                    )}
                    {item.creator?.username && (
                      <Paragraph style={styles.creator}>
                        Créée par: {item.creator.username || item.creator.email}
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
    color: '#1cc88a',
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
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  cardHeaderContent: {
    flex: 1,
  },
  foundIcon: {
    backgroundColor: '#1cc88a',
  },
  commentBox: {
    backgroundColor: '#f2f9f6',
    padding: 10,
    borderRadius: 5,
    marginTop: 8,
    marginBottom: 8,
  },
  commentTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  comment: {
    fontStyle: 'italic',
  },
  creator: {
    marginTop: 8,
    color: '#6c757d',
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
  exploreButton: {
    backgroundColor: '#1cc88a',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  exploreButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});