import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged as onAuthStateChangedFunction, User } from "firebase/auth";
import { getDatabase } from "firebase/database";
import { getStorage } from "firebase/storage";
import { getAnalytics, isSupported } from "firebase/analytics";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDc1iS4NX2um7sqJuYRSll9Il_7V6g6LsE",
  authDomain: "graduatinproject.firebaseapp.com",
  databaseURL: "https://graduatinproject-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "graduatinproject",
  storageBucket: "graduatinproject.appspot.com",
  messagingSenderId: "361149223809",
  appId: "1:361149223809:web:58467e248f81422f97ce80",
};

// Initialize Firebase once
const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const database = getDatabase(app);
export const storage = getStorage(app);

// Initialize Analytics conditionally
export const initializeAnalytics = async () => {
  try {
    if (await isSupported()) {
      return getAnalytics(app);
    }
  } catch (error) {
    console.warn('Firebase: Analytics not supported:', error);
  }
  return null;
};

// Enhanced authentication state monitoring
export const onAuthStateChanged = (callback: (user: User | null) => void) => {
  return onAuthStateChangedFunction(auth, (user) => {
    console.log('Firebase Auth: State changed:', user ? `User ${user.uid}` : 'No user');
    callback(user);
  });
};

// Exponential backoff retry utility
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`Firebase: Retry attempt ${attempt + 1} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

// Initialize Firebase services
console.log('Firebase: Initializing services for project:', firebaseConfig.projectId);