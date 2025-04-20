// app/(tabs)/explore.tsx

import { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity, Modal, Animated, Button, ScrollView } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { getToken, getUserEmail } from '../../hooks/useToken';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { API_URL } from '../../constants/api';

console.log('🔁 ExploreScreen chargé');

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
  found?: boolean;
};

export default function ExploreScreen() {
  const [caches, setCaches] = useState<Geocache[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [selectedCache, setSelectedCache] = useState<Geocache | null>(null);
  const [showCongrats, setShowCongrats] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const router = useRouter();
  const { lat, lng } = useLocalSearchParams();
  const mapRef = useRef<MapView>(null);

  const defaultLat = 43.6;
  const defaultLng = 1.433;

  const initialLat = lat ? parseFloat(lat as string) : defaultLat;
  const initialLng = lng ? parseFloat(lng as string) : defaultLng;

  const [region, setRegion] = useState<Region>({
    latitude: initialLat,
    longitude: initialLng,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  });

  async function fetchCaches(): Promise<void> {
    const token = await getToken();
    const email = await getUserEmail();
    setUserEmail(email);

    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/api/caches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const allCaches = await response.json();

      const foundRes = await fetch(`${API_URL}/api/caches/found`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const found = await foundRes.json();
      const foundIds = found.map((c: any) => c._id);

      const enriched = allCaches.map((cache: any) => ({
        ...cache,
        found: foundIds.includes(cache._id),
      }));

      setCaches(enriched);

      if (lat && lng) {
        const targetLat = parseFloat(lat as string);
        const targetLng = parseFloat(lng as string);
        const newRegion = {
          latitude: targetLat,
          longitude: targetLng,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 300);
      }
    } catch (err) {
      console.error('Erreur lors du chargement des caches :', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCaches();
  }, [lat, lng]);

  const handleZoom = (factor: number) => {
    const newRegion = {
      ...region,
      latitudeDelta: region.latitudeDelta * factor,
      longitudeDelta: region.longitudeDelta * factor,
    };
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 200);
  };

  const showSuccessPopup = () => {
    setShowCongrats(true);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }).start(() => {
          setShowCongrats(false);
          setSelectedCache(null); 
        });
      }, 2000); 
    });
  };
  

  const handleMarkFound = async (cacheId: string) => {
    const token = await getToken();
    try {
      const response = await fetch(`${API_URL}/api/caches/${cacheId}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ found: true, comment: 'Trouvée !' }),
      });
  
      if (!response.ok) return;
  
      console.log('✅ Marquage réussi, on affiche la popup');
      showSuccessPopup();
  
      await fetchCaches(); // ✅ Rechargement des pins
  
    } catch (err) {
      console.error('❌ Erreur lors du marquage comme trouvée :', err);
    }
  };
  
  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 100 }} />;

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={(r) => setRegion(r)}
      >
        {caches.map((cache) => {
          if (!cache.coordinates || !Array.isArray(cache.coordinates.coordinates)) return null;
          const [lng, lat] = cache.coordinates.coordinates;
          if (typeof lat !== 'number' || typeof lng !== 'number') return null;

          return (
            <Marker
              key={cache._id}
              coordinate={{ latitude: lat, longitude: lng }}
              pinColor={cache.found ? 'green' : 'red'}
              onPress={() => setSelectedCache(cache)}
            />
          );
        })}
      </MapView>

      <View style={styles.zoomButtons}>
        <TouchableOpacity onPress={() => handleZoom(0.5)} style={styles.zoomButton}>
          <Text style={styles.zoomText}>＋</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleZoom(2)} style={styles.zoomButton}>
          <Text style={styles.zoomText}>−</Text>
        </TouchableOpacity>
      </View>

      <Modal transparent visible={showCongrats}>
        <View style={styles.modalContainer}>
          <Animated.View style={[styles.modalBox, { opacity: fadeAnim }]}> 
            <Text style={styles.modalText}>🎉 Félicitations !</Text>
            <Text style={styles.modalText}>Vous avez trouvé une cache !</Text>
          </Animated.View>
        </View>
      </Modal>

      <Modal visible={!!selectedCache} transparent animationType="slide">
        <View style={styles.detailsContainer}>
          <View style={styles.detailsBox}>
            <Text style={styles.title}>{selectedCache?.description || 'Géocache'}</Text>
            <Text>Difficulté : {selectedCache?.difficulty}</Text>
            <Text>Créée par : {selectedCache?.creator?.email || selectedCache?.creator?.username}</Text>

            <View style={{ marginTop: 10 }}>
              <Button title="Commenter" color="#4e73df" onPress={() => {
                if (selectedCache) {
                  router.push(`/comments/${selectedCache._id}`);
                  console.log("🔽 Ouverture de la page de commentaire", selectedCache?._id);

                  setSelectedCache(null);
                }
              }} />
            </View>

            <View style={{ marginTop: 10 }}>
              <Button title="Marquer comme trouvée" color="#1cc88a" onPress={() => {
                if (selectedCache) {
                  handleMarkFound(selectedCache._id);
                  setSelectedCache(null);
                }
              }} />
            </View>

            {selectedCache?.creator && (userEmail === selectedCache.creator.email || userEmail === selectedCache.creator.username) && (
              <View style={{ marginTop: 10 }}>
                <Button title="Modifier" color="#f6c23e" onPress={() => {
                  router.push({
                    pathname: '/edit-cache',
                    params: {
                      id: selectedCache._id,
                      descriptionInitiale: selectedCache.description || '',
                      difficulteInitiale: selectedCache.difficulty.toString(),
                    },
                  });
                  setSelectedCache(null);
                }} />
              </View>
            )}


            <View style={{ marginTop: 20 }}>
              <Button title="Fermer" onPress={() => setSelectedCache(null)} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  zoomButtons: {
    position: 'absolute',
    right: 10,
    bottom: 100,
    flexDirection: 'column',
    gap: 4,
  },
  zoomButton: {
    backgroundColor: 'lightgray',
    padding: 8,
    borderRadius: 20,
    elevation: 4,
    alignItems: 'center',
  },
  zoomText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 5,
  },
  modalText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2e7d32',
    textAlign: 'center',
    marginVertical: 4,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    padding: 20,
  },
  detailsBox: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
  },
  title: { fontWeight: 'bold', fontSize: 18, marginBottom: 10 },
});