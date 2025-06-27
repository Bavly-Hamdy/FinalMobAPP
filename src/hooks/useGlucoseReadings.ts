
import { useState, useEffect } from 'react';
import { firebaseService, GlucoseReading } from '@/services/firebaseService';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export const useGlucoseReadings = () => {
  const [readings, setReadings] = useState<GlucoseReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log('Setting up optimized glucose readings hook with real-time listener');
    
    // Faster timeout for better UX
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.warn("Glucose readings loading timeout reached");
        setIsLoading(false);
        setHasError(true);
      }
    }, 1500); // Reduced to 1.5 seconds

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('User authenticated, setting up glucose readings subscription for:', user.uid);
        
        try {
          // Use real-time subscription for immediate updates
          const unsubscribeReadings = firebaseService.subscribeToGlucoseReadings((updatedReadings) => {
            console.log('Glucose readings updated:', updatedReadings.length);
            clearTimeout(timeoutId);
            setReadings(updatedReadings);
            setIsLoading(false);
            setHasError(false);
          });

          return () => {
            clearTimeout(timeoutId);
            console.log('Cleaning up glucose readings subscription');
            unsubscribeReadings();
          };
        } catch (error) {
          console.error('Error setting up glucose readings subscription:', error);
          clearTimeout(timeoutId);
          setIsLoading(false);
          setHasError(true);
        }
      } else {
        console.warn("No authenticated user for glucose readings");
        clearTimeout(timeoutId);
        setReadings([]);
        setIsLoading(false);
        setHasError(false); // Not an error if user is not authenticated
      }
    });

    return () => {
      clearTimeout(timeoutId);
      unsubscribeAuth();
    };
  }, []);

  const addReading = async (value: number) => {
    try {
      console.log(`Adding glucose reading: ${value} mg/dL`);
      await firebaseService.addGlucoseReading(value);
      // Readings will be updated automatically via the real-time listener
      toast({
        title: "Reading added",
        description: `Glucose reading of ${value} mg/dL recorded successfully.`,
      });
    } catch (error) {
      console.error('Error adding glucose reading:', error);
      toast({
        title: "Add Failed",
        description: "Failed to add glucose reading. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Convert readings to chart format with proper timestamp handling
  const chartData = readings.map((reading, index) => {
    // Helper function to convert timestamp to Date
    const getDateFromTimestamp = (timestamp: any): Date => {
      if (!timestamp) return new Date();
      
      // If it's already a Date object
      if (timestamp instanceof Date) {
        return timestamp;
      }
      
      // If it's a Firestore Timestamp with seconds property
      if (timestamp && typeof timestamp === 'object' && 'seconds' in timestamp) {
        return new Date(timestamp.seconds * 1000);
      }
      
      // If it's a number (milliseconds)
      if (typeof timestamp === 'number') {
        return new Date(timestamp);
      }
      
      // Fallback
      return new Date();
    };

    const date = getDateFromTimestamp(reading.timestamp);
    
    return {
      time: `Reading ${index + 1}`,
      value: reading.value,
      timestamp: reading.timestamp,
      // Add formatted time for better tooltip display
      formattedTime: date.toLocaleString()
    };
  });

  return {
    readings,
    chartData,
    isLoading,
    hasError,
    addReading
  };
};
