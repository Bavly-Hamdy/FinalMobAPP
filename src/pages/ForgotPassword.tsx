
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '@/contexts/AppContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useForm, SubmitHandler } from 'react-hook-form';
import { auth } from '@/lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft } from 'lucide-react';

interface ForgotPasswordFormInputs {
  email: string;
}

const ForgotPassword = () => {
  const { t } = useAppContext();
  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormInputs>();
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const onSubmit: SubmitHandler<ForgotPasswordFormInputs> = async (data) => {
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, data.email);
      setEmailSent(true);
      toast({
        title: "Email Sent",
        description: "Check your inbox for password reset instructions.",
      });
    } catch (error) {
      console.error("Error sending reset email:", error);
      toast({
        title: "Error",
        description: "Failed to send reset email. Please check if the email address is correct.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-primary">{t("resetPassword")}</h1>
          <p className="text-muted-foreground mt-2">
            {emailSent 
              ? "Check your email for reset instructions" 
              : "Enter your email to receive password reset instructions"}
          </p>
        </div>

        <Card className="p-6">
          {!emailSent ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register("email", { 
                    required: true, 
                    pattern: /^\S+@\S+$/i 
                  })}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email?.type === "required" && (
                  <p className="text-destructive text-sm">{t("emailRequired")}</p>
                )}
                {errors.email?.type === "pattern" && (
                  <p className="text-destructive text-sm">{t("invalidEmail")}</p>
                )}
              </div>

              <Button 
                type="submit" 
                className="w-full health-gradient hover:opacity-90 transition-opacity" 
                disabled={isLoading}
              >
                {isLoading ? t("sending") : t("sendResetLink")}
              </Button>
            </form>
          ) : (
            <div className="text-center space-y-4">
              <div className="text-health-success-500 font-medium">
                {t("resetEmailSent")}
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate("/signin")}
              >
                {t("backToSignIn")}
              </Button>
            </div>
          )}
        </Card>

        <div className="text-center">
          <Link to="/signin" className="flex items-center justify-center gap-2 text-primary hover:underline">
            <ArrowLeft size={16} />
            {t("backToSignIn")}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
