import { ref, set, onValue, off, DataSnapshot } from 'firebase/database';
import { database } from '../lib/firebase';
import { auth } from '../lib/firebase';

// Types for health readings
export interface HealthReading {
  value: number;
  timestamp: number;
}

export interface BloodPressureReading {
  systolic: number;
  diastolic: number;
  timestamp: number;
}

type HealthReadingType = 'heartRate' | 'spo2' | 'temperature' | 'steps' | 'calories' | 'glucose';

// Function to generate a unique session ID
const generateSessionId = () => {
  return `session_${Date.now()}`;
};

// Store the current session ID
let currentSessionId = generateSessionId();

// Reset session ID
export const resetSession = () => {
  currentSessionId = generateSessionId();
  return currentSessionId;
};

// Get current session ID
export const getCurrentSessionId = () => currentSessionId;

/**
 * Store a health reading in Firebase Realtime Database
 * @param type Type of health reading (heartRate, spo2, temperature, steps, calories, glucose)
 * @param value The reading value
 * @returns Promise that resolves when the data is stored
 */
export const storeHealthReading = async (
  type: HealthReadingType,
  value: number
): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  const timestamp = Date.now();
  const readingRef = ref(
    database,
    `users/${user.uid}/readings/${currentSessionId}/${type}/${timestamp}`
  );

  try {
    await set(readingRef, { value, timestamp });
    console.log(`${type} reading stored successfully`);
  } catch (error) {
    console.error(`Error storing ${type} reading:`, error);
    throw error;
  }
};

/**
 * Store blood pressure reading in Firebase Realtime Database
 * @param systolic Systolic pressure value
 * @param diastolic Diastolic pressure value
 * @returns Promise that resolves when the data is stored
 */
export const storeBloodPressureReading = async (
  systolic: number,
  diastolic: number
): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }

  const timestamp = Date.now();
  const readingRef = ref(
    database,
    `users/${user.uid}/readings/${currentSessionId}/bloodPressure/${timestamp}`
  );

  try {
    await set(readingRef, { systolic, diastolic, timestamp });
    console.log('Blood pressure reading stored successfully');
  } catch (error) {
    console.error('Error storing blood pressure reading:', error);
    throw error;
  }
};

/**
 * Subscribe to health readings from Firebase Realtime Database
 * @param type Type of health reading (heartRate, spo2, temperature, steps, calories, glucose)
 * @param callback Function to call when data changes
 * @returns Function to unsubscribe
 */
export const subscribeToHealthReadings = (
  type: HealthReadingType,
  callback: (readings: HealthReading[]) => void
): (() => void) => {
  const user = auth.currentUser;
  if (!user) {
    console.error('User not authenticated');
    return () => {};
  }

  const readingsRef = ref(
    database,
    `users/${user.uid}/readings/${currentSessionId}/${type}`
  );

  const handleDataChange = (snapshot: DataSnapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }

    const readings: HealthReading[] = Object.keys(data).map((key) => ({
      value: data[key].value,
      timestamp: data[key].timestamp,
    }));

    // Sort readings by timestamp
    readings.sort((a, b) => a.timestamp - b.timestamp);
    callback(readings);
  };

  onValue(readingsRef, handleDataChange);

  // Return unsubscribe function
  return () => off(readingsRef, 'value', handleDataChange);
};

/**
 * Subscribe to blood pressure readings from Firebase Realtime Database
 * @param callback Function to call when data changes
 * @returns Function to unsubscribe
 */
export const subscribeToBloodPressure = (
  callback: (readings: BloodPressureReading[]) => void
): (() => void) => {
  const user = auth.currentUser;
  if (!user) {
    console.error('User not authenticated');
    return () => {};
  }

  const readingsRef = ref(
    database,
    `users/${user.uid}/readings/${currentSessionId}/bloodPressure`
  );

  const handleDataChange = (snapshot: DataSnapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }

    const readings: BloodPressureReading[] = Object.keys(data).map((key) => ({
      systolic: data[key].systolic,
      diastolic: data[key].diastolic,
      timestamp: data[key].timestamp,
    }));

    // Sort readings by timestamp
    readings.sort((a, b) => a.timestamp - b.timestamp);
    callback(readings);
  };

  onValue(readingsRef, handleDataChange);

  // Return unsubscribe function
  return () => off(readingsRef, 'value', handleDataChange);
};

/**
 * Load all sessions for a user
 * @param callback Function to call when data changes
 * @returns Function to unsubscribe
 */
export const loadAllSessions = (
  callback: (sessions: string[]) => void
): (() => void) => {
  const user = auth.currentUser;
  if (!user) {
    console.error('User not authenticated');
    return () => {};
  }

  const sessionsRef = ref(database, `users/${user.uid}/readings`);

  const handleDataChange = (snapshot: DataSnapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }

    const sessions = Object.keys(data);
    callback(sessions);
  };

  onValue(sessionsRef, handleDataChange);

  // Return unsubscribe function
  return () => off(sessionsRef, 'value', handleDataChange);
};

/**
 * Set the current session ID
 * @param sessionId The session ID to set
 */
export const setCurrentSessionId = (sessionId: string) => {
  currentSessionId = sessionId;
};