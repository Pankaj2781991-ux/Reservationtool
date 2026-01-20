import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyDFkFfDN0gKl6qpldeYXMz2LN4hFM7iieM",
    authDomain: "reservation-tool-66e42.firebaseapp.com",
    projectId: "reservation-tool-66e42",
    storageBucket: "reservation-tool-66e42.firebasestorage.app",
    messagingSenderId: "393182551386",
    appId: "1:393182551386:web:72e53e2351f57365cca763",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();
