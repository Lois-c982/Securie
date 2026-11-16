import AsyncStorage from '@react-native-async-storage/async-storage';
import { getApp, getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  getReactNativePersistence,
  initializeAuth,
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyA6_XJNfuhy-MMj2-_1tg55wyLvCPwU8yk',
  authDomain: 'securie.firebaseapp.com',
  projectId: 'securie',
  storageBucket: 'securie.firebasestorage.app',
  messagingSenderId: '307713303179',
  appId: '1:307713303179:web:79ec005cd2a96fb4b66a8e',
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);

function setupAuth() {
  if (Platform.OS === 'web') {
    return getAuth(app);
  }

  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch (error) {
    if (error.code === 'auth/already-initialized') {
      return getAuth(app);
    }

    throw error;
  }
}

export const auth = setupAuth();