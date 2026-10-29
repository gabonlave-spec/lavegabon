import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: 'AIzaSyBcqmEw4lrNLXCJB0gPoIVk3y_VrHwVCOI',
  authDomain: 'gabonlave-spec.firebaseapp.com',
  projectId: 'gabonlave-spec',
  storageBucket: 'gabonlave-spec.firebasestorage.app',
  messagingSenderId: '355950611556',
  appId: '1:355950611556:web:a7403f5e408390f2c5a371',
  measurementId: 'G-6SH8ZG41PL'
};

export const configOk = firebaseConfig.apiKey !== 'REMPLACER';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
