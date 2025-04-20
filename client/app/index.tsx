// app/index.tsx
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, TouchableNativeFeedback } from 'react-native';
import { useRouter } from 'expo-router';

export default function SplashScreen() {
  const router = useRouter();

  const handlePress = () => {
    router.push('/login-register'); // index redirige vers login/register si pas connecté
  };

  return (
    <TouchableNativeFeedback style={styles.container} onPress={handlePress}>
      <ImageBackground
        source={require('../assets/images/background.png')}
        style={styles.background}
        resizeMode="cover"
      >
      </ImageBackground>
    </TouchableNativeFeedback>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  background: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
});
