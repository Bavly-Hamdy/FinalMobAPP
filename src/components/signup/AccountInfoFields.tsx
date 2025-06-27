
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { UseFormRegister, FieldErrors, UseFormWatch } from "react-hook-form";

interface AccountInfoFieldsProps {
  register: UseFormRegister<any>;
  errors: FieldErrors;
  watch: UseFormWatch<any>;
  t: (key: string) => string;
}

const AccountInfoFields: React.FC<AccountInfoFieldsProps> = ({
  register,
  errors,
  watch,
  t
}) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          type="email"
          {...register("email", { 
            required: "Email is required", 
            pattern: {
              value: /^\S+@\S+$/i,
              message: "Invalid email format"
            } 
          })}
          className={errors.email ? "border-destructive" : ""}
        />
        {errors.email && typeof errors.email.message === "string" && (
          <p className="text-destructive text-sm">{errors.email.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          type="password"
          {...register("password", { 
            required: "Password is required", 
            minLength: {
              value: 8,
              message: "Password must be at least 8 characters"
            } 
          })}
          className={errors.password ? "border-destructive" : ""}
        />
        {errors.password && typeof errors.password.message === "string" && (
          <p className="text-destructive text-sm">{errors.password.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t("confirmPassword")}</Label>
        <Input
          id="confirmPassword"
          type="password"
          {...register("confirmPassword", {
            required: "Please confirm your password",
            validate: value => value === watch("password") || "Passwords do not match"
          })}
          className={errors.confirmPassword ? "border-destructive" : ""}
        />
        {errors.confirmPassword && typeof errors.confirmPassword.message === "string" && (
          <p className="text-destructive text-sm">{errors.confirmPassword.message}</p>
        )}
      </div>
    </>
  );
};

export default AccountInfoFields;
