//firebase config and library imports

import { getApp, getApps, initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

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