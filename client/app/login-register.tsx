// app/login-register.tsx
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // pour une jolie icône de retour

export default function LoginRegisterChoice() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
        <Text style={styles.backText}> Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Welcome !</Text>
      <Text style={styles.subtitle}>Login or Sign Up to get started !</Text>

      <Button
        mode="contained"
        style={styles.button1}
        labelStyle={styles.label1}
        onPress={() => router.push('/login')}
      >
        Login
      </Button>

      <Button
        mode="outlined"
        style={styles.button2}
        labelStyle={styles.label2}
        onPress={() => router.push('/register')}
      >
        Sign Up
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0A4D4D',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    color: '#FDF6EC',
    fontSize: 16,
    marginLeft: 4,
  },
  title: {
    fontSize: 44,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FDF6EC',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: '#FDF6EC',
    marginBottom: 40,
    textAlign: 'center',
  },
  button1: {
    marginVertical: 10,
    backgroundColor: '#00BFA6',
    borderRadius: 12,
    paddingVertical: 6,
  },
  label1: {
    color: '#FDF6EC',
    fontSize: 16,
    fontWeight: 'bold',
  },
  button2: {
    marginVertical: 10,
    borderColor: '#00BFA6',
    borderWidth: 2,
    borderRadius: 12,
    paddingVertical: 6,
  },
  label2: {
    color: '#00BFA6',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
