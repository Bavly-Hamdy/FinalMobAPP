
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./contexts/AppContext";
import { UserProfileProvider } from "./contexts/UserProfileContext";
import { useEffect, useState } from "react";
import { onAuthStateChanged, auth } from "./lib/firebase";
import { firebaseService } from "./services/firebaseService";
import { useToast } from "./hooks/use-toast";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Home from "./pages/Home";
import Settings from "./pages/Settings";
import SignUp from "./pages/SignUp";
import SignIn from "./pages/SignIn";
import Readings from "./pages/Readings";
import Predictions from "./pages/Predictions";
import Chatbot from "./pages/Chatbot";
import Reminders from "./pages/Reminders";
import IntroSlider from "./pages/IntroSlider";
import ForgotPassword from "./pages/ForgotPassword";

const queryClient = new QueryClient();

const App = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    console.log('App: Setting up authentication listener');
    
    const unsubscribe = onAuthStateChanged((user) => {
      console.log('App: Auth state changed:', user ? `User ${user.uid}` : 'No user');
      setUser(user);
      setLoading(false);
      
      // No need to manually subscribe to user profile here
      // The UserProfileProvider already handles this when auth state changes
      // This ensures profile data is synchronized across all devices
    });

    return () => {
      console.log('App: Cleaning up auth listener');
      unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-center">
          <h1 className="text-2xl font-bold">VitalSync Health Hub</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        <UserProfileProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={user ? <Home /> : <Navigate to="/intro" />} />
                <Route path="/intro" element={<IntroSlider />} />
                <Route path="/signin" element={!user ? <SignIn /> : <Navigate to="/" />} />
                <Route path="/signup" element={!user ? <SignUp /> : <Navigate to="/" />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/settings" element={user ? <Settings /> : <Navigate to="/signin" />} />
                <Route path="/readings" element={user ? <Readings /> : <Navigate to="/signin" />} />
                <Route path="/predictions" element={user ? <Predictions /> : <Navigate to="/signin" />} />
                <Route path="/chatbot" element={user ? <Chatbot /> : <Navigate to="/signin" />} />
                <Route path="/reminders" element={user ? <Reminders /> : <Navigate to="/signin" />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </UserProfileProvider>
      </AppProvider>
    </QueryClientProvider>
  );
};

export default App;
