
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { firebaseService, UserProfile } from '@/services/firebaseService';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { cacheManager } from '@/services/cacheManager';

interface UserProfileContextType {
  profile: UserProfile | null;
  isLoading: boolean;
  hasError: boolean;
  bmi: number | null;
  bmiCategory: string | null;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const UserProfileContext = createContext<UserProfileContextType | undefined>(undefined);

export const useUserProfile = () => {
  const context = useContext(UserProfileContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProfileProvider');
  }
  return context;
};

interface UserProfileProviderProps {
  children: ReactNode;
}

export const UserProfileProvider: React.FC<UserProfileProviderProps> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Force refresh profile data from Firestore
  const refreshProfile = async () => {
    if (!auth.currentUser) return;
    
    console.log('UserProfileProvider: Force refreshing profile for user:', auth.currentUser.uid);
    setIsLoading(true);
    setHasError(false);
    
    try {
      // Clear cache to force fresh fetch
      const cacheKey = cacheManager.getUserCacheKey(auth.currentUser.uid, 'profile');
      cacheManager.invalidate(cacheKey);
      
      // Fetch fresh data
      const freshProfile = await firebaseService.getUserProfile();
      console.log('UserProfileProvider: Fresh profile fetched:', freshProfile);
      
      setProfile(freshProfile);
      setHasError(false);
    } catch (error) {
      console.error('UserProfileProvider: Error refreshing profile:', error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log('UserProfileProvider: Setting up authentication listener');
    
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      console.log('UserProfileProvider: Auth state changed:', user ? `User ${user.uid}` : 'No user');
      
      if (user) {
        setIsLoading(true);
        setHasError(false);
        
        try {
          console.log('UserProfileProvider: User authenticated, fetching profile immediately');
          
          // Force a fresh fetch on auth change (new login/device)
          const cacheKey = cacheManager.getUserCacheKey(user.uid, 'profile');
          cacheManager.invalidate(cacheKey);
          
          // Get fresh profile data immediately
          const freshProfile = await firebaseService.getUserProfile();
          if (freshProfile) {
            console.log('UserProfileProvider: Profile loaded successfully:', freshProfile);
            setProfile(freshProfile);
            setHasError(false);
          } else {
            console.log('UserProfileProvider: No profile data found');
            setProfile(null);
          }
          
          // Set up real-time subscription for ongoing updates
          const unsubscribeProfile = firebaseService.subscribeToUserProfile((userProfile) => {
            console.log('UserProfileProvider: Real-time profile update:', userProfile);
            setProfile(userProfile);
            setHasError(false);
          });

          // Cleanup function for profile subscription
          return () => {
            console.log('UserProfileProvider: Cleaning up profile subscription');
            unsubscribeProfile();
          };
        } catch (error) {
          console.error('UserProfileProvider: Error setting up profile:', error);
          setHasError(true);
          setProfile(null);
        } finally {
          setIsLoading(false);
        }
      } else {
        console.log('UserProfileProvider: No authenticated user, clearing profile');
        setProfile(null);
        setHasError(false);
        setIsLoading(false);
      }
    });

    return () => {
      console.log('UserProfileProvider: Cleaning up auth listener');
      unsubscribeAuth();
    };
  }, []); // Empty dependency array - only run once

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      console.log('UserProfileProvider: Updating profile with:', updates);
      await firebaseService.updateUserProfile(updates);
      // Profile will be updated automatically via the real-time listener
    } catch (error) {
      console.error('UserProfileProvider: Error updating profile:', error);
      setHasError(true);
    }
  };

  // Calculate BMI and category with better validation
  const bmi = profile?.weight && profile?.height && profile.weight > 0 && profile.height > 0
    ? firebaseService.calculateBMI(profile.weight, profile.height)
    : null;
  
  const bmiCategory = bmi 
    ? firebaseService.getBMICategory(bmi)
    : null;

  const value: UserProfileContextType = {
    profile,
    isLoading,
    hasError,
    bmi,
    bmiCategory,
    updateProfile,
    refreshProfile
  };

  return (
    <UserProfileContext.Provider value={value}>
      {children}
    </UserProfileContext.Provider>
  );
};
