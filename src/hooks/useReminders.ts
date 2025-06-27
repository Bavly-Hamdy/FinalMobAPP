
import { useState, useEffect } from 'react';
import { firebaseService, Reminder } from '@/services/firebaseService';
import { useToast } from '@/hooks/use-toast';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

export const useReminders = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    console.log('Setting up optimized reminders hook with real-time listener');
    
    // Faster timeout for better UX
    const loadingTimeout = setTimeout(() => {
      if (isLoading) {
        console.warn("Reminders loading timeout reached");
        setIsLoading(false);
        setHasError(true);
      }
    }, 1500); // Reduced to 1.5 seconds

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        console.log('User authenticated, setting up reminders subscription for:', user.uid);
        
        try {
          // Use real-time subscription for immediate updates
          const unsubscribeReminders = firebaseService.subscribeToReminders((updatedReminders) => {
            console.log('Reminders updated in hook:', updatedReminders.length);
            clearTimeout(loadingTimeout);
            setReminders(updatedReminders);
            setIsLoading(false);
            setHasError(false);
          });

          return () => {
            clearTimeout(loadingTimeout);
            console.log('Cleaning up reminders subscription');
            unsubscribeReminders();
          };
        } catch (error) {
          console.error('Error setting up reminders subscription:', error);
          clearTimeout(loadingTimeout);
          setIsLoading(false);
          setHasError(true);
        }
      } else {
        console.warn("No authenticated user for reminders");
        clearTimeout(loadingTimeout);
        setReminders([]);
        setIsLoading(false);
        setHasError(false); // Not an error if user is not authenticated
      }
    });

    return () => {
      clearTimeout(loadingTimeout);
      unsubscribeAuth();
    };
  }, []);

  const addReminder = async (reminder: Omit<Reminder, 'id' | 'userId' | 'createdAt'>) => {
    try {
      await firebaseService.addReminder(reminder);
      // Reminders will be updated automatically via the real-time listener
      toast({
        title: "Reminder added",
        description: "Your reminder has been created successfully.",
      });
    } catch (error) {
      console.error('Error adding reminder:', error);
      toast({
        title: "Add Failed",
        description: "Failed to add reminder. Please try again.",
        variant: "destructive",
      });
    }
  };

  const updateReminder = async (id: string, updates: Partial<Reminder>) => {
    try {
      await firebaseService.updateReminder(id, updates);
      // Reminders will be updated automatically via the real-time listener
      toast({
        title: "Reminder updated",
        description: "Your reminder has been updated successfully.",
      });
    } catch (error) {
      console.error('Error updating reminder:', error);
      toast({
        title: "Update Failed",
        description: "Failed to update reminder. Please try again.",
        variant: "destructive",
      });
    }
  };

  const deleteReminder = async (id: string) => {
    try {
      await firebaseService.deleteReminder(id);
      // Reminders will be updated automatically via the real-time listener
      toast({
        title: "Reminder deleted",
        description: "Your reminder has been deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting reminder:', error);
      toast({
        title: "Delete Failed",
        description: "Failed to delete reminder. Please try again.",
        variant: "destructive",
      });
    }
  };

  const toggleComplete = (id: string, completed: boolean) => {
    updateReminder(id, { completed });
  };

  return {
    reminders,
    isLoading,
    hasError,
    addReminder,
    updateReminder,
    deleteReminder,
    toggleComplete
  };
};
