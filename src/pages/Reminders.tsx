
import React, { useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Clock, Plus, X, Bell, Calendar, CheckCircle, AlertCircle } from "lucide-react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import MainLayout from "@/components/layout/MainLayout";
import { useReminders } from "@/hooks/useReminders";
import { Reminder } from "@/services/firebaseService";

const Reminders = () => {
  const { t } = useAppContext();
  const { reminders, isLoading, hasError, addReminder, updateReminder, deleteReminder, toggleComplete } = useReminders();
  
  const [newReminder, setNewReminder] = useState<Partial<Reminder>>({
    title: "",
    time: "",
    days: [],
    type: "medication",
    completed: false,
  });

  const [selectedTab, setSelectedTab] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!newReminder.title?.trim()) {
      errors.title = "Title is required";
    }
    
    if (!newReminder.time) {
      errors.time = "Time is required";
    }
    
    if (!newReminder.days?.length) {
      errors.days = "Please select at least one day";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddReminder = async () => {
    if (validateForm() && newReminder.title && newReminder.time && newReminder.days?.length) {
      await addReminder({
        title: newReminder.title,
        time: newReminder.time,
        days: newReminder.days,
        type: newReminder.type as "medication" | "checkup",
        completed: false,
      });
      
      setNewReminder({
        title: "",
        time: "",
        days: [],
        type: "medication",
        completed: false,
      });
      setFormErrors({});
      setIsDialogOpen(false);
    }
  };

  const toggleDay = (day: string) => {
    if (newReminder.days?.includes(day)) {
      setNewReminder({
        ...newReminder,
        days: newReminder.days.filter((d) => d !== day),
      });
    } else {
      setNewReminder({
        ...newReminder,
        days: [...(newReminder.days || []), day],
      });
    }
    
    // Clear days error when user makes a selection
    if (formErrors.days) {
      setFormErrors({ ...formErrors, days: "" });
    }
  };

  const handleComplete = async (id: string, completed: boolean) => {
    await toggleComplete(id, completed);
  };

  const handleDelete = async (id: string) => {
    await deleteReminder(id);
  };

  const filteredReminders = reminders.filter((reminder) => {
    if (selectedTab === "all") return true;
    if (selectedTab === "medication") return reminder.type === "medication";
    if (selectedTab === "checkup") return reminder.type === "checkup";
    if (selectedTab === "completed") return reminder.completed;
    if (selectedTab === "pending") return !reminder.completed;
    return true;
  });

  // Get today's reminders for the schedule
  const today = new Date().toLocaleDateString('en-US', { weekday: 'short' });
  const todayReminders = reminders.filter(reminder => 
    reminder.days.includes(today) && !reminder.completed
  ).sort((a, b) => {
    const timeA = new Date(`1970-01-01T${a.time}`);
    const timeB = new Date(`1970-01-01T${b.time}`);
    return timeA.getTime() - timeB.getTime();
  });

  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Optimized loading and error handling
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-pulse text-muted-foreground mb-2">Loading reminders...</div>
            <div className="text-sm text-muted-foreground">This should only take a moment</div>
          </div>
        </div>
      );
    }

    if (hasError) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="mx-auto mb-2 text-health-warning-500" size={32} />
            <div className="text-muted-foreground mb-2">Unable to load reminders</div>
            <div className="text-sm text-muted-foreground">Please check your connection and try again</div>
          </div>
        </div>
      );
    }

    return (
      <>
        <Tabs
          defaultValue="all"
          value={selectedTab}
          onValueChange={setSelectedTab}
          className="mb-6"
        >
          <TabsList className="grid grid-cols-5 mb-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="medication">Meds</TabsTrigger>
            <TabsTrigger value="checkup">Checkups</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Done</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedTab} className="space-y-4">
            {filteredReminders.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-muted-foreground">
                  {reminders.length === 0 ? "No reminders yet. Add your first reminder!" : "No reminders found for this filter"}
                </p>
              </Card>
            ) : (
              filteredReminders.map((reminder) => (
                <Card
                  key={reminder.id}
                  className={`p-4 border-l-4 ${
                    reminder.completed
                      ? "border-l-health-success-500 bg-health-success-50 dark:bg-transparent"
                      : reminder.type === "medication"
                      ? "border-l-health-primary-500"
                      : "border-l-health-warning-500"
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className={`font-medium ${reminder.completed ? "line-through text-muted-foreground" : ""}`}>
                        {reminder.title}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock size={14} />
                          <span>{reminder.time}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar size={14} />
                          <span>{reminder.days.join(", ")}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={reminder.completed}
                        onCheckedChange={() => handleComplete(reminder.id, !reminder.completed)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(reminder.id)}
                      >
                        <X size={18} />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Today's Schedule */}
        <div className="border rounded-lg">
          <div className="p-3 border-b bg-muted/40">
            <h2 className="font-medium">Today's Schedule</h2>
          </div>
          <div className="divide-y">
            {todayReminders.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No reminders scheduled for today
              </div>
            ) : (
              todayReminders.map((reminder) => (
                <div key={reminder.id} className="p-3 flex items-center gap-3">
                  <div className="w-16 text-muted-foreground text-sm">
                    {reminder.time}
                  </div>
                  <div className="flex-1">
                    <div className={`text-sm p-2 rounded flex items-center gap-2 ${
                      reminder.type === "medication"
                        ? "bg-health-primary-50 text-health-primary-800 dark:bg-health-primary-900/30 dark:text-health-primary-300"
                        : "bg-health-warning-50 text-health-warning-800 dark:bg-health-warning-900/30 dark:text-health-warning-300"
                    }`}>
                      {reminder.type === "medication" ? (
                        <Bell size={14} />
                      ) : (
                        <CheckCircle size={14} />
                      )}
                      {reminder.title}
                    </div>
                  </div>
                  <Switch
                    checked={reminder.completed}
                    onCheckedChange={() => handleComplete(reminder.id, !reminder.completed)}
                  />
                </div>
              ))
            )}
          </div>
        </div>
      </>
    );
  };

  return (
    <MainLayout>
      <div className="container p-4 md:p-6 max-w-md mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">{t("reminders")}</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <Plus size={16} />
                Add New
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Reminder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={newReminder.title || ""}
                    onChange={(e) => {
                      setNewReminder({ ...newReminder, title: e.target.value });
                      if (formErrors.title) {
                        setFormErrors({ ...formErrors, title: "" });
                      }
                    }}
                    className={formErrors.title ? "border-red-500" : ""}
                  />
                  {formErrors.title && (
                    <p className="text-sm text-red-500">{formErrors.title}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={newReminder.type}
                    onValueChange={(value: "medication" | "checkup") =>
                      setNewReminder({ ...newReminder, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="medication">Medication</SelectItem>
                      <SelectItem value="checkup">Checkup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Time *</Label>
                  <Input
                    id="time"
                    type="time"
                    value={newReminder.time || ""}
                    onChange={(e) => {
                      setNewReminder({ ...newReminder, time: e.target.value });
                      if (formErrors.time) {
                        setFormErrors({ ...formErrors, time: "" });
                      }
                    }}
                    className={formErrors.time ? "border-red-500" : ""}
                  />
                  {formErrors.time && (
                    <p className="text-sm text-red-500">{formErrors.time}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Days *</Label>
                  <div className="flex justify-between mt-2">
                    {weekdays.map((day) => (
                      <Button
                        key={day}
                        type="button"
                        variant={
                          newReminder.days?.includes(day) ? "default" : "outline"
                        }
                        className="w-9 h-9 p-0 rounded-full"
                        onClick={() => toggleDay(day)}
                      >
                        {day.charAt(0)}
                      </Button>
                    ))}
                  </div>
                  {formErrors.days && (
                    <p className="text-sm text-red-500">{formErrors.days}</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddReminder} className="w-full">
                  Add Reminder
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {renderContent()}
      </div>
    </MainLayout>
  );
};

export default Reminders;
