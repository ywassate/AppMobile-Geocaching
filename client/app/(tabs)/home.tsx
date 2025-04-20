import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from 'react-native-paper';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ImageBackground
      source={require('../../assets/images/home.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <SafeAreaView style={styles.overlay}>
        <Text style={styles.title}>Welcome to GeoCaching!</Text>
        <Text style={styles.subtitle}>Explore the world, find hidden treasures!</Text>

        <View style={styles.buttons}>
          <Button
            mode="contained"
            style={styles.button}
            labelStyle={styles.buttonLabel}
            onPress={() => router.push('/(tabs)/explore')}
          >
            Explore
          </Button>
          <Button
            mode="contained"
            style={styles.button}
            labelStyle={styles.buttonLabel}
            onPress={() => router.push('/(tabs)/add-cache')}
          >
            Add Cache
          </Button>
          <Button
            mode="contained"
            style={styles.button}
            labelStyle={styles.buttonLabel}
            onPress={() => router.push('/(tabs)/profile')}
          >
            Profile
          </Button>
        </View>
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
    backgroundColor: 'rgba(253, 246, 236, 0.12)', // couche de couleur claire par-dessus l’image
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0A4D4D',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#0A4D4D',
    textAlign: 'center',
    marginBottom: 32,
  },
  buttons: {
    gap: 11,
    flexDirection: 'column',
    marginTop: 20,
    marginLeft: 30,
    marginRight: 30,
    padding: 20,



  
  },
  button: {
    backgroundColor: '#0A4D4D',
    borderRadius: 10,
    paddingVertical: 6,
  },
  buttonLabel: {
    color: '#FDF6EC',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
