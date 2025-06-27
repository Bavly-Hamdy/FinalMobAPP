
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useForm, SubmitHandler } from "react-hook-form";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useToast } from "@/components/ui/use-toast";
import { Eye, EyeOff, Fingerprint, Loader } from "lucide-react";

interface SignInFormInputs {
  email: string;
  password: string;
}

const SignIn = () => {
  const { t } = useAppContext();
  const { register, handleSubmit, formState: { errors } } = useForm<SignInFormInputs>();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const onSubmit: SubmitHandler<SignInFormInputs> = async (data) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      
      toast({
        title: "Success",
        description: "You have successfully signed in!",
      });
      
      // Reset navigation stack and navigate to home page
      navigate("/", { replace: true });
      
    } catch (error: any) {
      console.error("Error signing in:", error);
      
      // Map Firebase error codes to user-friendly messages
      let errorMessage = "Failed to sign in. Please check your email and password.";
      
      if (error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid email or password. Please try again.";
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = "No account found with this email. Please sign up first.";
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = "Incorrect password. Please try again.";
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = "Too many failed attempts. Please try again later or reset your password.";
      }
      
      toast({
        title: "Sign In Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    toast({
      title: "Biometric Authentication",
      description: "Biometric authentication would be triggered here in the mobile app.",
    });
    // In a real mobile app, we'd implement biometric auth using Expo SecureStore and LocalAuthentication
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">{t("signIn")}</h1>
          <p className="text-muted-foreground mt-2">{t("welcomeBack")}</p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{t("email")}</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                {...register("email", { 
                  required: "Email is required", 
                  pattern: {
                    value: /^\S+@\S+$/i,
                    message: "Invalid email format"
                  }
                })}
                className={errors.email ? "border-destructive" : ""}
                disabled={isLoading}
              />
              {errors.email && (
                <p className="text-destructive text-sm">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t("password")}</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  {...register("password", { 
                    required: "Password is required", 
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters"
                    }
                  })}
                  className={errors.password ? "border-destructive" : ""}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-destructive text-sm">{errors.password.message}</p>
              )}
            </div>

            <div className="flex justify-between items-center">
              <Link to="/forgot-password" className="text-sm text-primary hover:underline">
                {t("forgotPassword")}
              </Link>
            </div>

            <Button 
              type="submit" 
              className="w-full health-gradient hover:opacity-90 transition-opacity" 
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  <span>{t("signingIn")}</span>
                </div>
              ) : (
                <span>{t("signIn")}</span>
              )}
            </Button>
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-muted"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                {t("or")}
              </span>
            </div>
          </div>

          <Button 
            type="button"
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={handleBiometricAuth}
            disabled={isLoading}
          >
            <Fingerprint size={18} />
            {t("biometricAuth")}
          </Button>
        </Card>

        <div className="text-center">
          <p>
            {t("dontHaveAccount")}{" "}
            <Link to="/signup" className="text-primary hover:underline">
              {t("signUp")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
