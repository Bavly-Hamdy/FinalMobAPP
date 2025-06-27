import React, { useEffect, useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/layout/MainLayout";
import { Activity, ThermometerSun, Heart, Droplet } from "lucide-react";
import { useReminders } from "@/hooks/useReminders";
import { ProfileSkeleton } from "@/components/ProfileSkeleton";
import { auth, database } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { ref, get } from "firebase/database";
import "./Home.css"; // Import the CSS file

const Home = () => {
  const { t } = useAppContext();
  const { profile, isLoading: profileLoading, hasError: profileError } = useUserProfile();
  const { reminders, isLoading: remindersLoading, hasError: remindersError, toggleComplete } = useReminders();
  const { toast } = useToast();
  const [showFallback, setShowFallback] = useState(false);
  const [firebaseFirstName, setFirebaseFirstName] = useState<string | null>(null);

  // Fetch firstName directly from Firebase Realtime Database as a fallback
  useEffect(() => {
    const user = auth.currentUser;
    if (user) {
      const userRef = ref(database, `users/${user.uid}`);
      get(userRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            const data = snapshot.val();
            setFirebaseFirstName(data.firstName || null);
          } else {
            console.warn("No user data found in Firebase");
          }
        })
        .catch((error) => {
          console.error("Error fetching user data:", error);
          toast({
            title: "Error",
            description: "Failed to load user data. Please try again.",
            variant: "destructive",
          });
        });
    }
  }, [toast]);

  // Set a timeout to show fallback UI if profile data doesn't load quickly
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowFallback(true);
    }, 1500); // Show fallback after 1.5 seconds

    return () => clearTimeout(timer);
  }, []);

  // Mock latest readings (you can replace with real data later)
  const latestReadings = {
    bloodPressure: { systolic: 120, diastolic: 80, timestamp: new Date(), status: "normal" },
    heartRate: { value: 72, timestamp: new Date(), status: "normal" },
    temperature: { value: 36.8, timestamp: new Date(), status: "normal" },
    oxygenSaturation: { value: 98, timestamp: new Date(), status: "normal" },
  };

  // Filter for upcoming (incomplete) reminders and limit to 3
  const upcomingReminders = reminders.filter(reminder => !reminder.completed).slice(0, 3);

  // Format timestamp
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('default', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  // Get status class
  const getStatusClass = (status: string) => {
    switch(status) {
      case "normal":
        return "reading-normal";
      case "elevated":
        return "reading-warning";
      case "high":
      case "critical":
        return "reading-critical";
      case "low":
        return "reading-warning";
      default:
        return "";
    }
  };

  // Enhanced greeting rendering with live Firebase data and fallback
  const renderGreeting = () => {
    // Prioritize Firebase-fetched firstName if available
    if (firebaseFirstName && firebaseFirstName.trim()) {
      return <span>Hello, {firebaseFirstName}</span>;
    }

    // Fallback to profile.firstName if available
    if (profile?.firstName && profile.firstName.trim()) {
      return <span>Hello, {profile.firstName}</span>;
    }

    // If still loading and not timed out yet, show skeleton
    if (profileLoading && !showFallback) {
      return <ProfileSkeleton type="greeting" />;
    }

    // If there's an error or we've timed out, show fallback
    if (profileError || showFallback) {
      return <span>Hello, Guest</span>;
    }

    // Default fallback
    return <span>Hello, Guest</span>;
  };

  const handleToggleReminder = async (reminderId: string, completed: boolean) => {
    try {
      await toggleComplete(reminderId, !completed);
    } catch (error: unknown) {
      console.error("Error toggling reminder:", error);
      toast({
        title: "Error",
        description: "Failed to update reminder. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Optimized reminders rendering with immediate fallbacks
  const renderReminders = () => {
    if (remindersLoading) {
      return (
        <div className="text-center py-4">
          <div className="animate-pulse text-muted-foreground">Loading reminders...</div>
        </div>
      );
    }

    if (remindersError) {
      return (
        <div className="text-center py-4">
          <p className="text-muted-foreground">Unable to load reminders</p>
          <p className="text-sm text-muted-foreground">Please check your connection</p>
        </div>
      );
    }

    if (upcomingReminders.length === 0) {
      return (
        <div className="text-center py-4">
          <p className="text-muted-foreground">No upcoming reminders</p>
          <p className="text-sm text-muted-foreground">Tap "Reminders" to add one</p>
        </div>
      );
    }

    return upcomingReminders.map((reminder) => (
      <div key={reminder.id} className="p-3 rounded-lg border bg-background border-border transition-colors">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-medium">{reminder.title}</h3>
            <p className="text-sm text-muted-foreground">{reminder.time}</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="ghost" size="sm">{t("ignore")}</Button>
            <Button
              variant="outline"
              size="sm"
              className="text-health-success-500 border-health-success-500 hover:bg-health-success-50"
              onClick={() => handleToggleReminder(reminder.id, reminder.completed)}
            >
              {t("done")} ✅
            </Button>
          </div>
        </div>
      </div>
    ));
  };

  return (
    <MainLayout>
      <div className="container p-4 md:p-6 max-w-md mx-auto">
        {/* Welcome header with live Firebase greeting */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">
            {renderGreeting()}
          </h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

        {/* Latest readings section */}
        <section className="mb-6">
          <h2 className="text-xl font-semibold mb-3">{t("latestReading")}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="vital-card animate-float">
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="text-health-primary-500" size={20} />
                <span className="font-medium">{t("bloodPressure")}</span>
              </div>
              <div className={`text-xl font-bold ${getStatusClass(latestReadings.bloodPressure.status)}`}>
                {latestReadings.bloodPressure.systolic}/{latestReadings.bloodPressure.diastolic} {t("mmHg")}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatTime(latestReadings.bloodPressure.timestamp)}
              </div>
            </div>

            <div className="vital-card delay-200">
              <div className="flex items-center space-x-2 mb-2">
                <Heart className="text-health-danger-500" size={20} />
                <span className="font-medium">{t("heartRate")}</span>
              </div>
              <div className={`text-xl font-bold ${getStatusClass(latestReadings.heartRate.status)}`}>
                {latestReadings.heartRate.value} {t("bpm")}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatTime(latestReadings.heartRate.timestamp)}
              </div>
            </div>

            <div className="vital-card delay-400">
              <div className="flex items-center space-x-2 mb-2">
                <ThermometerSun className="text-health-warning-500" size={20} />
                <span className="font-medium">{t("temperature")}</span>
              </div>
              <div className={`text-xl font-bold ${getStatusClass(latestReadings.temperature.status)}`}>
                {latestReadings.temperature.value} {t("celsius")}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatTime(latestReadings.temperature.timestamp)}
              </div>
            </div>

            <div className="vital-card delay-600">
              <div className="flex items-center space-x-2 mb-2">
                <Droplet className="text-health-primary-300" size={20} />
                <span className="font-medium">{t("oxygenSaturation")}</span>
              </div>
              <div className={`text-xl font-bold ${getStatusClass(latestReadings.oxygenSaturation.status)}`}>
                {latestReadings.oxygenSaturation.value} {t("percent")}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {formatTime(latestReadings.oxygenSaturation.timestamp)}
              </div>
            </div>
          </div>
        </section>

        {/* Optimized reminders section */}
        <section>
          <h2 className="text-xl font-semibold mb-3">{t("upcomingReminders")}</h2>
          <Card className="p-4">
            <div className="space-y-3">
              {renderReminders()}
            </div>
          </Card>
        </section>
      </div>
    </MainLayout>
  );
};

export default Home;
