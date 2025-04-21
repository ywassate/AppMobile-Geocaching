import { useEffect, useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ImageBackground,
  RefreshControl,
} from 'react-native';
import { Avatar, List, Text } from 'react-native-paper';
import { useRouter, useFocusEffect } from 'expo-router';
import { getToken } from '../../hooks/useToken';
import { API_URL } from '../../constants/api';
import { SafeAreaView } from 'react-native-safe-area-context';

function parseJwt(token: string): DecodedToken {
  const base64Url = token.split('.')[1];
  const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
  const jsonPayload = decodeURIComponent(
    atob(base64)
      .split('')
      .map((c) => {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      })
      .join('')
  );
  return JSON.parse(jsonPayload);
}

type DecodedToken = {
  id: string;
  username?: string;
  email?: string;
  exp: number;
};

type UserStats = {
  finds: number;
  hides: number;
  distance: number;
  score: number;
};

export default function ProfileScreen() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [findCount, setFindCount] = useState(0);
  const [hideCount, setHideCount] = useState(0);
  const router = useRouter();

  // Fonction pour calculer les compteurs précis en utilisant les mêmes méthodes que hides.tsx et finds.tsx
  const calculateAccurateCounts = async () => {
    const token = await getToken();
    if (!token) return;

    const decoded = parseJwt(token);
    const userId = decoded.id;
    console.log("Calcul des compteurs précis pour l'utilisateur ID:", userId);

    try {
      // 1. Récupérer toutes les caches
      const response = await fetch(`${API_URL}/api/caches`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        console.error("Erreur lors de la récupération des caches");
        return;
      }

      const allCaches = await response.json();
      console.log(`Récupéré ${allCaches.length} caches au total`);

      // 2. Compter les caches créées par l'utilisateur
      const createdCaches = allCaches.filter((cache) => 
        cache.creator && cache.creator._id === userId
      );
      console.log(`Nombre de caches créées: ${createdCaches.length}`);
      setHideCount(createdCaches.length);

      // 3. Compter les caches trouvées par l'utilisateur
      const foundCaches = allCaches.filter((cache) => {
        if (!cache.logs || !Array.isArray(cache.logs)) {
          return false;
        }
        
        return cache.logs.some(log => {
          const logUserId = typeof log.user === 'string' ? log.user : log.user?._id || log.user;
          return logUserId === userId && log.found === true;
        });
      });
      
      console.log(`Nombre de caches trouvées: ${foundCaches.length}`);
      setFindCount(foundCaches.length);

    } catch (error) {
      console.error("Erreur lors du calcul des compteurs:", error);
    }
  };

  const fetchUserInfo = async () => {
    try {
      setRefreshing(true);
      const token = await getToken();
      if (!token) return;

      const decoded = parseJwt(token);
      setEmail(decoded.email || '');
      setUsername(decoded.username || '');

      // Calcul précis des compteurs
      await calculateAccurateCounts();

      try {
        // 📦 1. Infos profil utilisateur
        const profileRes = await fetch(`${API_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profileData = await profileRes.json();

        console.log('→ PROFILE DATA:', profileData);

        if (profileRes.ok) {
          setEmail(profileData.email || decoded.email || '');
          setUsername(profileData.username || decoded.username || '');
          if (profileData.imageUrl) {
            setImageUrl(profileData.imageUrl);
            console.log('✅ imageUrl reçu :', profileData.imageUrl);
          } else {
            console.log('❌ Aucune image trouvée pour cet utilisateur');
          }
        }

        // 📊 2. Stats utilisateur depuis l'API (en complément)
        const statsRes = await fetch(`${API_URL}/api/users/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const statsData = await statsRes.json();

        if (statsRes.ok) {
          console.log("Stats reçues de l'API:", statsData);
          setStats(statsData);
        } else {
          console.error("Erreur lors de la récupération des stats:", statsData.message);
        }
      } catch (err) {
        console.error("Erreur réseau:", err);
      } finally {
        setRefreshing(false);
      }
    } catch (error) {
      console.error("Erreur générale:", error);
      setRefreshing(false);
    }
  };

  // Rafraîchir les données lors du premier chargement
  useEffect(() => {
    fetchUserInfo();
  }, []);

  // Rafraîchir les données chaque fois que l'écran redevient actif
  useFocusEffect(
    useCallback(() => {
      console.log("L'écran de profil est maintenant actif, rafraîchissement des données");
      fetchUserInfo();
      return () => {
        // Nettoyage si nécessaire
      };
    }, [])
  );

  const onRefresh = useCallback(() => {
    fetchUserInfo();
  }, []);

  return (
    <ImageBackground
      source={require('../../assets/images/home.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.overlay}>
        <ScrollView 
          contentContainerStyle={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          <View style={styles.header}>
            {/* 👇 DEBUG fallback image */}
            {imageUrl ? (
              <Avatar.Image size={72} source={{ uri: imageUrl }} />
            ) : (
              <Avatar.Image
                size={72}
                source={{ uri: 'https://i.pravatar.cc/150?img=8' }} // fallback public image
              />
            )}
            <Text style={styles.username}>{username || email}</Text>
          </View>

          <List.Item
            title="Finds"
            description="Caches found"
            left={() => <List.Icon icon="emoticon-outline" />}
            right={() => <Text style={styles.count}>{findCount}</Text>}
            onPress={() => router.push('/profile/finds')}
          />
          <List.Item
            title="Hides"
            description="Caches created"
            left={() => <List.Icon icon="star-outline" />}
            right={() => <Text style={styles.count}>{hideCount}</Text>}
            onPress={() => router.push('/profile/hides')}
          />
          <List.Item
            title="Statistics"
            description="Your full activity"
            left={() => <List.Icon icon="chart-bar" />}
            onPress={() => router.push('/profile/stats')}
          />
          <List.Item
            title="Souvenirs"
            description="Rewards & badges"
            left={() => <List.Icon icon="map-marker-check" />}
            onPress={() => {}}
          />
          <List.Item
            title="Drafts"
            left={() => <List.Icon icon="file-document-outline" />}
            onPress={() => {}}
          />
          <List.Item
            title="Trackable Inventory"
            left={() => <List.Icon icon="bug-outline" />}
            onPress={() => {}}
          />
        </ScrollView>
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
    backgroundColor: 'rgba(253, 246, 236, 0.12)',
  },
  scrollView: {
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    backgroundColor: '#0A4D4D',
  },
  username: {
    marginTop: 8,
    fontSize: 20,
    fontWeight: '600',
    color: '#0A4D4D',
  },
  count: {
    alignSelf: 'center',
    fontSize: 16,
    marginRight: 12,
    fontWeight: '600',
    color: '#0A4D4D',
  },
});