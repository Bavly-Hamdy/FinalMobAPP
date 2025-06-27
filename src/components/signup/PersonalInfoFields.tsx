
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DatePicker from "@/components/DatePicker";

interface PersonalInfoFieldsProps {
  register: any;
  errors: any;
  setValue: (name: string, value: any) => void;
  getValues: (name?: string) => any;
  t: (key: string) => string;
}

const PersonalInfoFields: React.FC<PersonalInfoFieldsProps> = ({
  register,
  errors,
  setValue,
  getValues,
  t
}) => {
  const handleDateChange = (date: Date) => {
    setValue("dateOfBirth", date);
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">{t("firstName")}</Label>
          <Input
            id="firstName"
            {...register("firstName", { required: "First name is required" })}
            className={errors.firstName ? "border-destructive" : ""}
          />
          {errors.firstName && (
            <p className="text-destructive text-sm">{errors.firstName.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">{t("lastName")}</Label>
          <Input
            id="lastName"
            {...register("lastName", { required: "Last name is required" })}
            className={errors.lastName ? "border-destructive" : ""}
          />
          {errors.lastName && (
            <p className="text-destructive text-sm">{errors.lastName.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="age">{t("age")}</Label>
          <Input
            id="age"
            type="number"
            {...register("age", { 
              required: "Age is required", 
              min: {
                value: 1,
                message: "Age must be at least 1"
              },
              max: {
                value: 120,
                message: "Age must be less than 120"
              } 
            })}
            className={errors.age ? "border-destructive" : ""}
          />
          {errors.age && (
            <p className="text-destructive text-sm">{errors.age.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>{t("gender")}</Label>
          <Select onValueChange={(value) => setValue("gender", value)}>
            <SelectTrigger>
              <SelectValue placeholder={t("gender")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">{t("male")}</SelectItem>
              <SelectItem value="female">{t("female")}</SelectItem>
              <SelectItem value="other">{t("other")}</SelectItem>
            </SelectContent>
          </Select>
          {errors.gender && (
            <p className="text-destructive text-sm">{errors.gender.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>{t("dateOfBirth")}</Label>
        <DatePicker
          value={getValues("dateOfBirth")}
          onChange={handleDateChange}
          placeholder="Select your date of birth"
        />
        {errors.dateOfBirth && (
          <p className="text-destructive text-sm">{errors.dateOfBirth.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="height">{t("height")} (cm)</Label>
          <Input
            id="height"
            type="number"
            {...register("height", { 
              required: "Height is required", 
              min: {
                value: 50,
                message: "Height must be at least 50cm"
              },
              max: {
                value: 250,
                message: "Height must be less than 250cm"
              } 
            })}
            className={errors.height ? "border-destructive" : ""}
          />
          {errors.height && (
            <p className="text-destructive text-sm">{errors.height.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="weight">{t("weight")} (kg)</Label>
          <Input
            id="weight"
            type="number"
            {...register("weight", { 
              required: "Weight is required", 
              min: {
                value: 20,
                message: "Weight must be at least 20kg"
              },
              max: {
                value: 500,
                message: "Weight must be less than 500kg"
              } 
            })}
            className={errors.weight ? "border-destructive" : ""}
          />
          {errors.weight && (
            <p className="text-destructive text-sm">{errors.weight.message}</p>
          )}
        </div>
      </div>
    </>
  );
};

export default PersonalInfoFields;
