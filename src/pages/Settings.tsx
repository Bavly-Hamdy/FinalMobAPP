
import React from "react";
import { useAppContext } from "@/contexts/AppContext";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Sun, Moon, VolumeX, Volume2, Accessibility, Eye, Zap, LogOut } from "lucide-react";
import MainLayout from "@/components/layout/MainLayout";
import { auth } from "@/lib/firebase";
import { signOut } from "firebase/auth";
import { useToast } from "@/components/ui/use-toast";

const Settings = () => {
  const { 
    theme, 
    setTheme, 
    language, 
    setLanguage, 
    fontSize, 
    setFontSize, 
    colorTheme, 
    setColorTheme, 
    textToSpeech,
    setTextToSpeech,
    voiceAssistant,
    setVoiceAssistant,
    screenReader,
    setScreenReader,
    highContrast,
    setHighContrast,
    hapticFeedback,
    setHapticFeedback,
    t,
    speak
  } = useAppContext();

  const navigate = useNavigate();
  const { toast } = useToast();

  const handleFontSizeChange = (value: number[]) => {
    setFontSize(value[0]);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      toast({
        title: "Success",
        description: "You have been logged out",
      });
      navigate("/signin");
    } catch (error) {
      console.error("Error logging out:", error);
      toast({
        title: "Error",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <MainLayout>
      <div className="container max-w-md py-8 space-y-6">
        <h1 className="text-3xl font-bold text-center mb-8">{t("settings")}</h1>

        {/* Theme Toggle */}
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {theme === "dark" ? <Moon /> : <Sun />}
              <span>{t("darkMode")}</span>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => {
                setTheme(checked ? "dark" : "light");
                if (hapticFeedback) {
                  // In a real mobile app, we'd use Expo Haptics here
                  console.log("Haptic feedback: Theme changed");
                }
              }}
            />
          </div>
        </Card>

        {/* Language Selection */}
        <Card className="p-4">
          <h3 className="font-medium mb-4">{t("language")}</h3>
          <RadioGroup
            value={language}
            onValueChange={(value) => {
              setLanguage(value as "en" | "ar");
              if (hapticFeedback) {
                // In a real mobile app, we'd use Expo Haptics here
                console.log("Haptic feedback: Language changed");
              }
            }}
            className="flex space-x-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="en" id="en" />
              <Label htmlFor="en">{t("english")}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ar" id="ar" />
              <Label htmlFor="ar">{t("arabic")}</Label>
            </div>
          </RadioGroup>
        </Card>

        {/* Font Size Slider */}
        <Card className="p-4">
          <div className="space-y-4">
            <h3 className="font-medium">{t("fontSize")}</h3>
            <div className="flex items-center space-x-4">
              <span className="text-sm">A</span>
              <Slider
                value={[fontSize]}
                min={12}
                max={24}
                step={1}
                onValueChange={handleFontSizeChange}
                className="flex-1"
              />
              <span className="text-lg font-bold">A</span>
            </div>
          </div>
        </Card>

        {/* Color Theme Selection */}
        <Card className="p-4">
          <h3 className="font-medium mb-4">{t("colorTheme")}</h3>
          <RadioGroup
            value={colorTheme}
            onValueChange={(value) => {
              setColorTheme(value as "blue" | "green" | "purple" | "teal");
              if (hapticFeedback) {
                // In a real mobile app, we'd use Expo Haptics here
                console.log("Haptic feedback: Theme color changed");
              }
            }}
            className="grid grid-cols-2 gap-4"
          >
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-health-primary-500 mr-2"></div>
              <RadioGroupItem value="blue" id="blue" />
              <Label htmlFor="blue">{t("blue")}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-green-500 mr-2"></div>
              <RadioGroupItem value="green" id="green" />
              <Label htmlFor="green">{t("green")}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-purple-500 mr-2"></div>
              <RadioGroupItem value="purple" id="purple" />
              <Label htmlFor="purple">{t("purple")}</Label>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-teal-500 mr-2"></div>
              <RadioGroupItem value="teal" id="teal" />
              <Label htmlFor="teal">{t("teal")}</Label>
            </div>
          </RadioGroup>
        </Card>

        {/* Accessibility Settings */}
        <Card className="p-4">
          <h3 className="font-medium mb-4">{t("accessibilitySettings")}</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Volume2 className={textToSpeech ? "text-primary" : "text-muted-foreground"} size={20} />
                <span>{t("textToSpeech")}</span>
              </div>
              <Switch
                checked={textToSpeech}
                onCheckedChange={(checked) => {
                  setTextToSpeech(checked);
                  if (checked) {
                    speak(t("textToSpeech") + " " + t("enabled"));
                  }
                }}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <VolumeX className={voiceAssistant ? "text-primary" : "text-muted-foreground"} size={20} />
                <span>{t("voiceAssistant")}</span>
              </div>
              <Switch
                checked={voiceAssistant}
                onCheckedChange={(checked) => setVoiceAssistant(checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Accessibility className={screenReader ? "text-primary" : "text-muted-foreground"} size={20} />
                <span>{t("screenReader")}</span>
              </div>
              <Switch
                checked={screenReader}
                onCheckedChange={(checked) => setScreenReader(checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Eye className={highContrast ? "text-primary" : "text-muted-foreground"} size={20} />
                <span>{t("highContrast")}</span>
              </div>
              <Switch
                checked={highContrast}
                onCheckedChange={(checked) => setHighContrast(checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Zap className={hapticFeedback ? "text-primary" : "text-muted-foreground"} size={20} />
                <span>{t("hapticFeedback")}</span>
              </div>
              <Switch
                checked={hapticFeedback}
                onCheckedChange={(checked) => setHapticFeedback(checked)}
              />
            </div>
          </div>
        </Card>

        {/* Logout Button */}
        <Separator className="my-6" />
        <Button 
          onClick={handleLogout} 
          variant="destructive" 
          className="w-full flex items-center gap-2 justify-center"
        >
          <LogOut size={18} />
          {t("logout")}
        </Button>
      </div>
    </MainLayout>
  );
};

export default Settings;
