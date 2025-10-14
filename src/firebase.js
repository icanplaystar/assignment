// Firebase initialization with lazy guards
import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyCepCWbh5WcwPYiDDTq24qwXcL6H9sL6MA',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'jiezhi-bd9f2.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'jiezhi-bd9f2',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'jiezhi-bd9f2.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '61464182917',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:61464182917:web:099b34cb79aa7ca92529ec'
}

export function getFirebaseAuth() {
  if (!firebaseConfig.apiKey) {
    return null
  }
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  return getAuth(app)
}

export function getFirestoreDb() {
  if (!firebaseConfig.apiKey) {
    return null
  }
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig)
  return getFirestore(app)
}


