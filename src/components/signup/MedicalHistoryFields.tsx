
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface MedicalHistoryFieldsProps {
  setValue: (name: string, value: any) => void;
  register: any;
  t: (key: string) => string;
}

const MedicalHistoryFields: React.FC<MedicalHistoryFieldsProps> = ({
  setValue,
  register,
  t
}) => {
  return (
    <div className="space-y-4">
      <div>
        <Label>{t("diabetesStatus")}</Label>
        <RadioGroup
          onValueChange={(value) => setValue("diabetesStatus", value)}
          defaultValue="no"
          className="flex mt-2 space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="diabetes-yes" />
            <Label htmlFor="diabetes-yes">{t("yes")}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="diabetes-no" />
            <Label htmlFor="diabetes-no">{t("no")}</Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label>{t("hypertensionStatus")}</Label>
        <RadioGroup
          onValueChange={(value) => setValue("hypertensionStatus", value)}
          defaultValue="no"
          className="flex mt-2 space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="hypertension-yes" />
            <Label htmlFor="hypertension-yes">{t("yes")}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="hypertension-no" />
            <Label htmlFor="hypertension-no">{t("no")}</Label>
          </div>
        </RadioGroup>
      </div>

      <div>
        <Label>{t("strokeHistory")}</Label>
        <RadioGroup
          onValueChange={(value) => setValue("strokeHistory", value)}
          defaultValue="no"
          className="flex mt-2 space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="stroke-yes" />
            <Label htmlFor="stroke-yes">{t("yes")}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="stroke-no" />
            <Label htmlFor="stroke-no">{t("no")}</Label>
          </div>
        </RadioGroup>
      </div>
      <div>
        <Label>{t("bpMedicine")}</Label>
        <RadioGroup
          onValueChange={(value) => setValue("bpMedicine", value)}
          defaultValue="no"
          className="flex mt-2 space-x-4"
          {...register("bpMedicine")}
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="yes" id="bp-yes" />
            <Label htmlFor="bp-yes">{t("yes")}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="no" id="bp-no" />
            <Label htmlFor="bp-no">{t("no")}</Label>
          </div>
        </RadioGroup>
      </div>

      

      <div>
        <Label>{t("smokingStatus")}</Label>
        <RadioGroup
          onValueChange={(value) => setValue("smokingStatus", value)}
          defaultValue="never"
          className="flex mt-2 space-x-4"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="current" id="smoking-current" />
            <Label htmlFor="smoking-current">{t("current")}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="former" id="smoking-former" />
            <Label htmlFor="smoking-former">{t("former")}</Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="never" id="smoking-never" />
            <Label htmlFor="smoking-never">{t("never")}</Label>
          </div>
        </RadioGroup>
      </div>

      <div className="space-y-2">
        <Label htmlFor="chronicConditions">{t("chronicConditions")}</Label>
        <Input
          id="chronicConditions"
          {...register("chronicConditions")}
        />
      </div>
    </div>
  );
};

export default MedicalHistoryFields;
