import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAppContext } from "@/contexts/AppContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useForm, SubmitHandler } from "react-hook-form";
import { useToast } from "@/components/ui/use-toast";
import { auth, database } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import { Loader } from "lucide-react";
import PersonalInfoFields from "@/components/signup/PersonalInfoFields";
import AccountInfoFields from "@/components/signup/AccountInfoFields";
import MedicalHistoryFields from "@/components/signup/MedicalHistoryFields";

interface SignUpFormInputs {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  age: number;
  gender: string;
  dateOfBirth: Date;
  height: number;
  weight: number;
  diabetesStatus: string;
  hypertensionStatus: string;
  strokeHistory: string;
  smokingStatus: string;
  bpMedicine: string;
  chronicConditions: string;
}

const SignUp = () => {
  const { t } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    setValue,
    getValues,
    control,
  } = useForm<SignUpFormInputs>({
    defaultValues: {
      gender: "",
      diabetesStatus: "no",
      hypertensionStatus: "no",
      strokeHistory: "no",
      smokingStatus: "never",
      bpMedicine:"no",
    },
  });

  const validateDateOfBirth = (date: Date) => {
    if (!date) return "Date of birth is required";
    const today = new Date();
    if (date > today) return "Date of birth cannot be in the future";
    return true;
  };

  const onSubmit: SubmitHandler<SignUpFormInputs> = async (data) => {
    setIsLoading(true);

    try {
      const dobValidation = validateDateOfBirth(data.dateOfBirth);
      if (dobValidation !== true) {
        toast({
          title: "Validation Error",
          description: dobValidation,
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      const user = userCredential.user;

      // Calculate BMI
      const bmi = data.weight / ((data.height / 100) ** 2);

      // Save user info in Realtime Database
      await set(ref(database, `users/${user.uid}`), {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        age: data.age,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth.toISOString(),
        height: data.height,
        weight: data.weight,
        bmi: bmi,
        diabetesStatus: data.diabetesStatus,
        hypertensionStatus: data.hypertensionStatus,
        strokeHistory: data.strokeHistory,
        smokingStatus: data.smokingStatus,
        bpMedicine: data.bpMedicine,
        chronicConditions: data.chronicConditions,
        createdAt: new Date().toISOString(),
      });

      toast({
        title: "Account created!",
        description: "Your account has been created successfully. Please sign in.",
      });

      navigate("/signin");
    } catch (error: unknown) {
      console.error("Error signing up:", error);
      toast({
        title: "Error creating account",
        description:
          error instanceof Error
            ? error.message
            : "An error occurred during sign up.",
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
          <h1 className="text-3xl font-bold text-primary">{t("signUp")}</h1>
          <p className="text-muted-foreground mt-2">
            Create your healthcare account
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <AccountInfoFields
              register={register}
              errors={errors}
              watch={watch}
              t={t}
            />

            <PersonalInfoFields
              register={register}
              errors={errors}
              setValue={setValue}
              getValues={getValues}
              t={t}
            />

            <MedicalHistoryFields
              setValue={setValue}
              register={register}
              t={t}
            />

            <Button
              type="submit"
              className="w-full health-gradient hover:opacity-90 transition-opacity"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <Loader className="mr-2 h-4 w-4 animate-spin" />
                  <span>Creating Account...</span>
                </div>
              ) : (
                <span>{t("signUp")}</span>
              )}
            </Button>
          </form>
        </Card>

        <div className="text-center">
          <p>
            Already have an account?{" "}
            <Link to="/signin" className="text-primary hover:underline">
              {t("signIn")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
