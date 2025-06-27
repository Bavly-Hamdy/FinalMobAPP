import { ref, push, set, update, remove, onValue, DataSnapshot } from 'firebase/database';
import { auth, database, withRetry } from '@/lib/firebase';
import { cacheManager } from './cacheManager';

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  weight: number;
  height: number;
  dateOfBirth: string;
  gender?: string;
  age?: number;
}

export interface Reminder {
  id: string;
  title: string;
  time: string;
  days: string[];
  type: 'medication' | 'checkup';
  completed: boolean;
  userId: string;
  createdAt: Date;
}

export interface GlucoseReading {
  id: string;
  value: number;
  timestamp: Date;
  userId: string;
}

export interface SavedMessage {
  id: string;
  messageId: string;
  chatId: string;
  content: string;
  timestamp: Date;
  userId: string;
  type: 'saved' | 'favorite';
  createdAt: Date;
}

class FirebaseService {
  private unsubscribers = new Map<string, () => void>();

  // Helper method to ensure user is authenticated
  private ensureAuthenticated() {
    if (!auth.currentUser) {
      console.error('Authentication error: No user is currently authenticated.');
      throw new Error('User not authenticated');
    }
    return auth.currentUser.uid;
  }

  // Saved and Favorite Messages Management
  async saveMessage(messageId: string, chatId: string, content: string, timestamp: Date, type: 'saved' | 'favorite') {
    try {
      const userId = this.ensureAuthenticated();
      console.log(`Saving ${type} message for user: ${userId}`);

      const savedMessageData: SavedMessage = {
        id: '',
        messageId,
        chatId,
        content,
        timestamp,
        userId,
        type,
        createdAt: new Date(),
      };

      return await withRetry(async () => {
        const messagesRef = ref(database, `savedMessages/${userId}`);
        const newMessageRef = push(messagesRef);
        savedMessageData.id = newMessageRef.key!;
        await set(newMessageRef, savedMessageData);
        console.log(`${type} message saved successfully with ID: ${newMessageRef.key}`);

        // Invalidate cache
        cacheManager.invalidate(cacheManager.getUserCacheKey(userId, `${type}Messages`));

        return newMessageRef.key!;
      });
    } catch (error) {
      console.error(`Error saving ${type} message:`, error);
      throw error;
    }
  }

  async removeSavedMessage(savedMessageId: string) {
    try {
      const userId = this.ensureAuthenticated();
      return await withRetry(async () => {
        const messageRef = ref(database, `savedMessages/${userId}/${savedMessageId}`);
        await remove(messageRef);
        console.log(`Saved message removed successfully: ${savedMessageId}`);

        // Invalidate cache
        cacheManager.invalidate(cacheManager.getUserCacheKey(userId, 'savedMessages'));
        cacheManager.invalidate(cacheManager.getUserCacheKey(userId, 'favoriteMessages'));
      });
    } catch (error) {
      console.error(`Error removing saved message ${savedMessageId}:`, error);
      throw error;
    }
  }

  subscribeToSavedMessages(type: 'saved' | 'favorite', callback: (messages: SavedMessage[]) => void): () => void {
    try {
      const userId = this.ensureAuthenticated();
      const cacheKey = cacheManager.getUserCacheKey(userId, `${type}Messages`);
      console.log(`Setting up real-time ${type} messages subscription for user: ${userId}`);

      // Check cache first
      const cachedMessages = cacheManager.get<SavedMessage[]>(cacheKey);
      if (cachedMessages) {
        console.log(`Serving ${type} messages from cache`);
        callback(cachedMessages);
      }

      const messagesRef = ref(database, `savedMessages/${userId}`);
      const unsubscribe = onValue(
        messagesRef,
        (snapshot: DataSnapshot) => {
          const messages: SavedMessage[] = [];
          snapshot.forEach((childSnapshot) => {
            const data = childSnapshot.val();
            if (data.type === type) {
              messages.push({
                id: childSnapshot.key!,
                ...data,
                timestamp: new Date(data.timestamp),
                createdAt: new Date(data.createdAt),
              });
            }
          });

          // Update cache
          cacheManager.set(cacheKey, messages);
          console.log(`Processed ${type} messages: ${messages.length}`);
          callback(messages);
        },
        (error) => {
          console.error(`Error in ${type} messages subscription:`, error);
          if (error instanceof Error && error.message.includes('permission_denied')) {
            console.warn(`Permission denied for ${type} messages. Check Firebase Database Rules.`);
          }
          const cachedMessages = cacheManager.get<SavedMessage[]>(cacheKey);
          callback(cachedMessages || []);
        },
      );

      this.unsubscribers.set(`${type}Messages:${userId}`, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error(`Error setting up ${type} messages subscription:`, error);
      callback([]);
      return () => {};
    }
  }

  // Enhanced reminders with real-time listeners
  async addReminder(reminder: Omit<Reminder, 'id' | 'userId' | 'createdAt'>) {
    try {
      const userId = this.ensureAuthenticated();
      console.log(`Adding reminder for user: ${userId}`);

      const reminderData: Reminder = {
        id: '',
        ...reminder,
        userId,
        createdAt: new Date(),
      };

      return await withRetry(async () => {
        const remindersRef = ref(database, `reminders/${userId}`);
        const newReminderRef = push(remindersRef);
        reminderData.id = newReminderRef.key!;
        await set(newReminderRef, reminderData);
        console.log(`Reminder added successfully with ID: ${newReminderRef.key}`);

        // Invalidate cache
        cacheManager.invalidate(cacheManager.getUserCacheKey(userId, 'reminders'));

        return newReminderRef.key!;
      });
    } catch (error) {
      console.error(`Error adding reminder:`, error);
      throw error;
    }
  }

  async updateReminder(id: string, updates: Partial<Reminder>) {
    try {
      const userId = this.ensureAuthenticated();
      return await withRetry(async () => {
        const reminderRef = ref(database, `reminders/${userId}/${id}`);
        await update(reminderRef, updates);
        console.log(`Reminder updated successfully: ${id}`);

        // Invalidate cache
        cacheManager.invalidate(cacheManager.getUserCacheKey(userId, 'reminders'));
      });
    } catch (error) {
      console.error(`Error updating reminder ${id}:`, error);
      throw error;
    }
  }

  async deleteReminder(id: string) {
    try {
      const userId = this.ensureAuthenticated();
      return await withRetry(async () => {
        const reminderRef = ref(database, `reminders/${userId}/${id}`);
        await remove(reminderRef);
        console.log(`Reminder deleted successfully: ${id}`);

        // Invalidate cache
        cacheManager.invalidate(cacheManager.getUserCacheKey(userId, 'reminders'));
      });
    } catch (error) {
      console.error(`Error deleting reminder ${id}:`, error);
      throw error;
    }
  }

  subscribeToReminders(callback: (reminders: Reminder[]) => void): () => void {
    try {
      const userId = this.ensureAuthenticated();
      const cacheKey = cacheManager.getUserCacheKey(userId, 'reminders');
      console.log(`Setting up real-time reminders subscription for user: ${userId}`);

      // Check cache first
      const cachedReminders = cacheManager.get<Reminder[]>(cacheKey);
      if (cachedReminders) {
        console.log(`Serving reminders from cache`);
        callback(cachedReminders);
      }

      const remindersRef = ref(database, `reminders/${userId}`);
      const unsubscribe = onValue(
        remindersRef,
        (snapshot: DataSnapshot) => {
          const reminders: Reminder[] = [];
          snapshot.forEach((childSnapshot) => {
            const data = childSnapshot.val();
            reminders.push({
              id: childSnapshot.key!,
              ...data,
              createdAt: new Date(data.createdAt),
            });
          });

          // Update cache
          cacheManager.set(cacheKey, reminders);
          console.log(`Processed reminders: ${reminders.length}`);
          callback(reminders);
        },
        (error) => {
          console.error(`Error in reminders subscription:`, error);
          if (error instanceof Error && error.message.includes('permission_denied')) {
            console.warn(`Permission denied for reminders. Check Firebase Database Rules.`);
          }
          const cachedReminders = cacheManager.get<Reminder[]>(cacheKey);
          callback(cachedReminders || []);
        },
      );

      this.unsubscribers.set(`reminders:${userId}`, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error(`Error setting up reminders subscription:`, error);
      callback([]);
      return () => {};
    }
  }

  // Enhanced glucose readings with real-time listeners
  async addGlucoseReading(value: number) {
    try {
      const userId = this.ensureAuthenticated();
      console.log(`Adding glucose reading for user: ${userId}, value: ${value}`);

      const readingData: GlucoseReading = {
        id: '',
        value,
        timestamp: new Date(),
        userId,
      };

      return await withRetry(async () => {
        const readingsRef = ref(database, `glucoseReadings/${userId}`);
        const newReadingRef = push(readingsRef);
        readingData.id = newReadingRef.key!;
        await set(newReadingRef, readingData);
        console.log(`Glucose reading added successfully with ID: ${newReadingRef.key}`);

        // Invalidate cache
        cacheManager.invalidate(cacheManager.getUserCacheKey(userId, 'glucoseReadings'));

        return newReadingRef.key!;
      });
    } catch (error) {
      console.error(`Error adding glucose reading:`, error);
      throw error;
    }
  }

  subscribeToGlucoseReadings(callback: (readings: GlucoseReading[]) => void): () => void {
    try {
      const userId = this.ensureAuthenticated();
      const cacheKey = cacheManager.getUserCacheKey(userId, 'glucoseReadings');
      console.log(`Setting up real-time glucose readings subscription for user: ${userId}`);

      // Check cache first
      const cachedReadings = cacheManager.get<GlucoseReading[]>(cacheKey);
      if (cachedReadings) {
        console.log(`Serving glucose readings from cache`);
        callback(cachedReadings);
      }

      const readingsRef = ref(database, `glucoseReadings/${userId}`);
      const unsubscribe = onValue(
        readingsRef,
        (snapshot: DataSnapshot) => {
          const readings: GlucoseReading[] = [];
          snapshot.forEach((childSnapshot) => {
            const data = childSnapshot.val();
            readings.push({
              id: childSnapshot.key!,
              ...data,
              timestamp: new Date(data.timestamp),
            });
          });

          // Update cache
          cacheManager.set(cacheKey, readings);
          console.log(`Processed glucose readings: ${readings.length}`);
          callback(readings);
        },
        (error) => {
          console.error(`Error in glucose readings subscription:`, error);
          if (error instanceof Error && error.message.includes('permission_denied')) {
            console.warn(`Permission denied for glucose readings. Check Firebase Database Rules.`);
          }
          const cachedReadings = cacheManager.get<GlucoseReading[]>(cacheKey);
          callback(cachedReadings || []);
        },
      );

      this.unsubscribers.set(`glucoseReadings:${userId}`, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error(`Error setting up glucose readings subscription:`, error);
      callback([]);
      return () => {};
    }
  }

  // Enhanced user profile with real-time updates and caching
  async getUserProfile(): Promise<UserProfile | null> {
    try {
      const userId = this.ensureAuthenticated();
      const cacheKey = cacheManager.getUserCacheKey(userId, 'profile');
      console.log(`Fetching user profile for user: ${userId}`);

      // Check cache first
      const cachedProfile = cacheManager.get<UserProfile>(cacheKey);
      if (cachedProfile) {
        console.log(`Serving profile from cache`);
        return cachedProfile;
      }

      return await withRetry(async () => {
        const userRef = ref(database, `users/${userId}`);
        const snapshot = await new Promise<DataSnapshot>((resolve, reject) => {
          onValue(userRef, resolve, { onlyOnce: true });
        });

        if (snapshot.exists()) {
          const profileData = snapshot.val() as UserProfile;
          console.log(`User profile loaded successfully:`, profileData);

          // Cache the profile
          cacheManager.set(cacheKey, profileData);

          return profileData;
        } else {
          console.warn(`User profile does not exist for user: ${userId}`);
          return null;
        }
      });
    } catch (error) {
      console.error(`Error fetching user profile:`, error);
      throw error;
    }
  }

  subscribeToUserProfile(callback: (profile: UserProfile | null) => void): () => void {
    try {
      const userId = this.ensureAuthenticated();
      const cacheKey = cacheManager.getUserCacheKey(userId, 'profile');
      console.log(`Setting up real-time profile subscription for user: ${userId}`);

      // Check cache first
      const cachedProfile = cacheManager.get<UserProfile>(cacheKey);
      if (cachedProfile) {
        console.log(`Serving profile from cache`);
        callback(cachedProfile);
      }

      const userRef = ref(database, `users/${userId}`);
      const unsubscribe = onValue(
        userRef,
        (snapshot: DataSnapshot) => {
          if (snapshot.exists()) {
            const profileData = snapshot.val() as UserProfile;
            console.log(`Profile snapshot received:`, profileData);

            // Update cache
            cacheManager.set(cacheKey, profileData);
            callback(profileData);
          } else {
            console.warn(`Profile does not exist for user: ${userId}`);
            callback(null);
          }
        },
        (error) => {
          console.error(`Error in profile subscription:`, error);
          if (error instanceof Error && error.message.includes('permission_denied')) {
            console.warn(`Permission denied for user profile. Check Firebase Database Rules.`);
          }
          const cachedProfile = cacheManager.get<UserProfile>(cacheKey);
          callback(cachedProfile || null);
        },
      );

      this.unsubscribers.set(`profile:${userId}`, unsubscribe);
      return unsubscribe;
    } catch (error) {
      console.error(`Error setting up profile subscription:`, error);
      callback(null);
      return () => {};
    }
  }

  async updateUserProfile(updates: Partial<UserProfile>) {
    try {
      const userId = this.ensureAuthenticated();
      console.log(`Updating user profile for user: ${userId}, updates:`, updates);

      return await withRetry(async () => {
        const userRef = ref(database, `users/${userId}`);
        await update(userRef, updates);

        // Update cache
        const cacheKey = cacheManager.getUserCacheKey(userId, 'profile');
        const cachedProfile = cacheManager.get<UserProfile>(cacheKey);
        if (cachedProfile) {
          cacheManager.set(cacheKey, { ...cachedProfile, ...updates });
        }
      });
    } catch (error) {
      console.error(`Error updating user profile:`, error);
      throw error;
    }
  }

  // Cleanup method to unsubscribe from all listeners
  cleanup(userId?: string) {
    console.log(`Cleaning up subscriptions for user: ${userId || 'all'}`);
    if (userId) {
      const keysToRemove = Array.from(this.unsubscribers.keys()).filter((key) => key.includes(userId));
      keysToRemove.forEach((key) => {
        const unsubscribe = this.unsubscribers.get(key);
        if (unsubscribe) {
          unsubscribe();
          this.unsubscribers.delete(key);
          console.log(`Unsubscribed from: ${key}`);
        }
      });
    } else {
      this.unsubscribers.forEach((unsubscribe, key) => {
        unsubscribe();
        console.log(`Unsubscribed from: ${key}`);
      });
      this.unsubscribers.clear();
    }
  }

  // BMI Calculation
  calculateBMI(weight: number, height: number): number {
    if (height <= 0 || weight <= 0) {
      console.warn(`Invalid BMI inputs: weight=${weight}, height=${height}`);
      return 0;
    }
    const heightInMeters = height / 100; // Convert cm to meters
    return Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
  }

  getBMICategory(bmi: number): string {
    if (bmi <= 0) return 'Invalid';
    if (bmi < 18.5) return 'Underweight';
    if (bmi < 25) return 'Normal';
    if (bmi < 30) return 'Overweight';
    return 'Obese';
  }
}

export const firebaseService = new FirebaseService();