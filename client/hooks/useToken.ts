// hooks/useToken.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'token';

export async function saveToken(token: string) {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (err) {
    console.error('Erreur lors de la sauvegarde du token', err);
  }
}

export async function getToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch (err) {
    console.error('Erreur lors de la lecture du token', err);
    return null;
  }
}

export async function removeToken() {
  try {
    await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    console.error('Erreur lors de la suppression du token', err);
  }
}

export const getUserEmail = async () => {
  return await AsyncStorage.getItem('email');
};