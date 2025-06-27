
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar, ChevronLeft } from "lucide-react";

interface DatePickerProps {
  value: Date | undefined;
  onChange: (date: Date) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label = "Date",
  placeholder = "Select a date",
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"year" | "month" | "day">("year");
  const [selectedYear, setSelectedYear] = useState<number>(
    value ? value.getFullYear() : new Date().getFullYear()
  );
  const [selectedMonth, setSelectedMonth] = useState<number>(
    value ? value.getMonth() : new Date().getMonth()
  );

  // Generate years list (100 years back from current year)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);
  
  // Month names
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  // Get number of days in the selected month
  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Generate array of days for the selected month
  const days = selectedYear && selectedMonth !== undefined
    ? Array.from({ length: getDaysInMonth(selectedYear, selectedMonth) }, (_, i) => i + 1)
    : [];

  const handleYearSelect = (year: number) => {
    setSelectedYear(year);
    setStep("month");
  };

  const handleMonthSelect = (monthIndex: number) => {
    setSelectedMonth(monthIndex);
    setStep("day");
  };

  const handleDaySelect = (day: number) => {
    const newDate = new Date(selectedYear, selectedMonth, day);
    onChange(newDate);
    setOpen(false);
    // Reset to year selection for next time
    setStep("year");
  };

  const handleBack = () => {
    if (step === "day") {
      setStep("month");
    } else if (step === "month") {
      setStep("year");
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium mb-1">{label}</label>}
      <Button
        variant="outline"
        className="w-full justify-start text-left font-normal h-auto py-2 px-3"
        onClick={() => !disabled && setOpen(true)}
        disabled={disabled}
      >
        <Calendar className="mr-2 h-4 w-4 opacity-70" />
        {value ? formatDate(value) : placeholder}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              {step !== "year" && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={handleBack} 
                  className="mr-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              )}
              {step === "year" 
                ? "Select Year" 
                : step === "month" 
                  ? `Select Month (${selectedYear})` 
                  : `Select Day (${months[selectedMonth]} ${selectedYear})`}
            </DialogTitle>
          </DialogHeader>

          {/* Year Selector */}
          {step === "year" && (
            <ScrollArea className="h-[300px]">
              <div className="grid grid-cols-3 gap-2 p-2">
                {years.map((year) => (
                  <Button
                    key={year}
                    variant={year === selectedYear ? "default" : "outline"}
                    onClick={() => handleYearSelect(year)}
                    className="h-10"
                  >
                    {year}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          )}

          {/* Month Selector */}
          {step === "month" && (
            <div className="grid grid-cols-2 gap-2 p-2">
              {months.map((month, index) => (
                <Button
                  key={month}
                  variant={index === selectedMonth ? "default" : "outline"}
                  onClick={() => handleMonthSelect(index)}
                  className="h-10"
                >
                  {month}
                </Button>
              ))}
            </div>
          )}

          {/* Day Selector */}
          {step === "day" && (
            <div className="grid grid-cols-7 gap-2 p-2">
              {days.map((day) => (
                <Button
                  key={day}
                  variant="outline"
                  onClick={() => handleDaySelect(day)}
                  className="h-10 w-10 p-0"
                >
                  {day}
                </Button>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DatePicker;
