import { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  ImageBackground,
} from 'react-native';
import { Avatar, List, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
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
  email: string;
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
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserInfo = async () => {
      const token = await getToken();
      if (!token) return;

      const decoded = parseJwt(token);
      setEmail(decoded.email);

      try {
        // 📦 1. Infos profil utilisateur
        const profileRes = await fetch(`${API_URL}/api/users/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const profileData = await profileRes.json();

        console.log('→ PROFILE DATA:', profileData);

        if (profileRes.ok) {
          setEmail(profileData.email || '');
          if (profileData.imageUrl) {
            setImageUrl(profileData.imageUrl);
            console.log('✅ imageUrl reçu :', profileData.imageUrl);
          } else {
            console.log('❌ Aucune image trouvée pour cet utilisateur');
          }
        }

        // 📊 2. Stats utilisateur
        const statsRes = await fetch(`${API_URL}/api/users/stats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const statsData = await statsRes.json();

        if (statsRes.ok) {
          setStats(statsData);
        } else {
          Alert.alert('Error', statsData.message || 'Stats fetch failed');
        }
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Unable to load profile');
      }
    };

    fetchUserInfo();
  }, []);

  return (
    <ImageBackground
      source={require('../../assets/images/home.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.scrollView}>
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
            <Text style={styles.username}>{email}</Text>
          </View>

          <List.Item
            title="Finds"
            description="Caches found"
            left={() => <List.Icon icon="emoticon-outline" />}
            right={() => <Text style={styles.count}>{stats?.finds ?? 0}</Text>}
            onPress={() => router.push('/profile/finds')}
          />
          <List.Item
            title="Hides"
            description="Caches created"
            left={() => <List.Icon icon="star-outline" />}
            right={() => <Text style={styles.count}>{stats?.hides ?? 0}</Text>}
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
