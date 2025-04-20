import Constants from 'expo-constants';

const { manifest2, expoConfig } = Constants;

const ip = manifest2?.extra?.hostUri?.split(':')[0] || expoConfig?.hostUri?.split(':')[0];

export const API_URL = `http://${ip}:3000`;
