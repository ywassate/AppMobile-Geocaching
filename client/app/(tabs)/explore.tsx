// app/(tabs)/explore.tsx

import { useEffect, useState, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, TouchableOpacity, Modal, Animated, Button, ScrollView, Alert } from 'react-native';
import MapView, { Marker, Region, Circle } from 'react-native-maps';
import { getToken, getUserEmail } from '../../hooks/useToken';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { API_URL } from '../../constants/api';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

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
  distance?: number; // Pour stocker la distance par rapport à l'utilisateur
};

export default function ExploreScreen() {
  const [caches, setCaches] = useState<Geocache[]>([]);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [selectedCache, setSelectedCache] = useState<Geocache | null>(null);
  const [showCongrats, setShowCongrats] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [userLocation, setUserLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [locationPermission, setLocationPermission] = useState(false);
  const [nearbyCaches, setNearbyCaches] = useState<Geocache[]>([]);

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

  // Demander la permission de localisation au chargement
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      setLocationPermission(status === 'granted');
      
      if (status === 'granted') {
        await getCurrentLocation();
      }
    })();
  }, []);

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

      // Si l'utilisateur a partagé sa position, calculer les caches à proximité
      if (userLocation) {
        filterNearbyCaches(enriched, userLocation);
      }

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
  }, [lat, lng, userLocation]);

  const handleZoom = (factor: number) => {
    const newRegion = {
      ...region,
      latitudeDelta: region.latitudeDelta * factor,
      longitudeDelta: region.longitudeDelta * factor,
    };
    setRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 200);
  };

  // Obtenir la position actuelle de l'utilisateur
  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      
      const { latitude, longitude } = location.coords;
      setUserLocation({ latitude, longitude });
      
      // Centrer la carte sur la position de l'utilisateur
      const newRegion = {
        latitude,
        longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 1000);
      
      // Filtrer les caches à proximité
      if (caches.length > 0) {
        filterNearbyCaches(caches, { latitude, longitude });
      }
    } catch (error) {
      console.error('Erreur de géolocalisation:', error);
      Alert.alert('Erreur', 'Impossible d\'obtenir votre position actuelle.');
    }
  };
  
  // Filtrer les caches dans un rayon de 5km
  const filterNearbyCaches = (allCaches: Geocache[], location: {latitude: number, longitude: number}) => {
    const RADIUS_KM = 5; // 5 kilomètres
    
    const nearby = allCaches.filter(cache => {
      if (!cache.coordinates || !Array.isArray(cache.coordinates.coordinates)) return false;
      const [lng, lat] = cache.coordinates.coordinates;
      if (typeof lat !== 'number' || typeof lng !== 'number') return false;
      
      // Calcul de la distance (formule Haversine simplifiée)
      const lat1 = location.latitude;
      const lon1 = location.longitude;
      const lat2 = lat;
      const lon2 = lng;
      
      const R = 6371; // Rayon de la Terre en km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2); 
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
      const distance = R * c;
      
      // Ajouter la distance à la cache
      cache.distance = distance;
      
      return distance <= RADIUS_KM;
    });
    
    setNearbyCaches(nearby);
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
      if (!userLocation) {
        Alert.alert('Erreur', 'Position utilisateur inconnue.');
        return;
      }
  
      const response = await fetch(`${API_URL}/api/caches/${cacheId}/logs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          found: true,
          comment: 'Trouvée !',
          location: userLocation
        }),
      });
  
      if (!response.ok) {
        console.error('❌ Erreur serveur:', await response.text());
        return;
      }
  
      console.log('✅ Marquage réussi');
      showSuccessPopup();
      await fetchCaches();
  
    } catch (err) {
      console.error('❌ Erreur réseau lors du marquage:', err);
      Alert.alert('Erreur', 'Problème réseau');
    }
  };
  
  

  return (
    <SafeAreaView style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        region={region}
        onRegionChangeComplete={(r) => setRegion(r)}
        showsUserLocation={locationPermission}
      >
        {caches.map((cache) => {
          if (!cache.coordinates || !Array.isArray(cache.coordinates.coordinates)) return null;
          const [lng, lat] = cache.coordinates.coordinates;
          if (typeof lat !== 'number' || typeof lng !== 'number') return null;

          // Déterminer la couleur du marqueur en fonction de son statut
          let pinColor = 'red';
          if (cache.found) {
            pinColor = 'green';
          } else if (nearbyCaches.includes(cache)) {
            pinColor = 'orange'; // Les caches à proximité non trouvées sont orange
          }

          return (
            <Marker
              key={cache._id}
              coordinate={{ latitude: lat, longitude: lng }}
              pinColor={pinColor}
              onPress={() => setSelectedCache(cache)}
            />
          );
        })}
        
        {/* Afficher le rayon de 5km autour de l'utilisateur */}
        {userLocation && (
          <Circle 
            center={userLocation}
            radius={5000} // 5km en mètres
            strokeWidth={1}
            strokeColor="rgba(78, 115, 223, 0.5)"
            fillColor="rgba(78, 115, 223, 0.1)"
          />
        )}
      </MapView>

      <View style={styles.zoomButtons}>
        <TouchableOpacity onPress={() => handleZoom(0.5)} style={styles.zoomButton}>
          <Text style={styles.zoomText}>＋</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleZoom(2)} style={styles.zoomButton}>
          <Text style={styles.zoomText}>−</Text>
        </TouchableOpacity>
      </View>
      
      {/* Bouton "Me localiser" */}
      <TouchableOpacity 
        style={styles.locateButton} 
        onPress={getCurrentLocation}
      >
        <Ionicons name="locate" size={24} color="#4e73df" />
      </TouchableOpacity>
      
      {/* Indicateur du nombre de caches à proximité */}
      {userLocation && nearbyCaches.length > 0 && (
        <View style={styles.nearbyIndicator}>
          <Ionicons name="pin" size={16} color="#fff" />
          <Text style={styles.nearbyText}>
            {nearbyCaches.length} cache{nearbyCaches.length !== 1 ? 's' : ''} à proximité
          </Text>
        </View>
      )}

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
            
            {/* Afficher la distance si disponible */}
            {selectedCache?.distance && (
              <Text style={styles.distanceText}>
                Distance : {selectedCache.distance.toFixed(2)} km
              </Text>
            )}

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
  locateButton: {
    position: 'absolute',
    bottom: 160,
    right: 10,
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  nearbyIndicator: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(78, 115, 223, 0.8)',
    padding: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nearbyText: {
    color: 'white',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  distanceText: {
    marginTop: 5,
    color: '#4e73df',
    fontWeight: '500',
  },
});