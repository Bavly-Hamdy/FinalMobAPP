import React, { createContext, useContext, useState, useEffect } from "react";

type Theme = "light" | "dark";
type Language = "en" | "ar";
type ColorTheme = "blue" | "green" | "purple" | "teal";

interface AppContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  language: Language;
  setLanguage: (language: Language) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  colorTheme: ColorTheme;
  setColorTheme: (theme: ColorTheme) => void;
  textToSpeech: boolean;
  setTextToSpeech: (enabled: boolean) => void;
  voiceAssistant: boolean;
  setVoiceAssistant: (enabled: boolean) => void;
  screenReader: boolean;
  setScreenReader: (enabled: boolean) => void;
  highContrast: boolean;
  setHighContrast: (enabled: boolean) => void;
  hapticFeedback: boolean;
  setHapticFeedback: (enabled: boolean) => void;
  translations: Record<string, Record<string, string>>;
  t: (key: string) => string;
  speak: (text: string) => void;
}

const defaultContext: AppContextType = {
  theme: "light",
  setTheme: () => {},
  language: "en",
  setLanguage: () => {},
  fontSize: 16,
  setFontSize: () => {},
  colorTheme: "blue",
  setColorTheme: () => {},
  textToSpeech: false,
  setTextToSpeech: () => {},
  voiceAssistant: false,
  setVoiceAssistant: () => {},
  screenReader: false,
  setScreenReader: () => {},
  highContrast: false,
  setHighContrast: () => {},
  hapticFeedback: true,
  setHapticFeedback: () => {},
  translations: {},
  t: (key) => key,
  speak: () => {},
};

const AppContext = createContext<AppContextType>(defaultContext);

export const useAppContext = () => useContext(AppContext);

interface AppProviderProps {
  children: React.ReactNode;
}

export const AppProvider = ({ children }: AppProviderProps) => {
  // Core settings
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("theme");
    return (savedTheme as Theme) || "light";
  });
  
  const [language, setLanguage] = useState<Language>(() => {
    const savedLanguage = localStorage.getItem("language");
    return (savedLanguage as Language) || "en";
  });
  
  const [fontSize, setFontSize] = useState<number>(() => {
    const savedFontSize = localStorage.getItem("fontSize");
    return savedFontSize ? parseInt(savedFontSize) : 16;
  });
  
  const [colorTheme, setColorTheme] = useState<ColorTheme>(() => {
    const savedColorTheme = localStorage.getItem("colorTheme");
    return (savedColorTheme as ColorTheme) || "blue";
  });

  // Accessibility settings
  const [textToSpeech, setTextToSpeech] = useState<boolean>(() => {
    const savedTTS = localStorage.getItem("textToSpeech");
    return savedTTS ? savedTTS === "true" : false;
  });

  const [voiceAssistant, setVoiceAssistant] = useState<boolean>(() => {
    const savedVA = localStorage.getItem("voiceAssistant");
    return savedVA ? savedVA === "true" : false;
  });

  const [screenReader, setScreenReader] = useState<boolean>(() => {
    const savedSR = localStorage.getItem("screenReader");
    return savedSR ? savedSR === "true" : false;
  });

  const [highContrast, setHighContrast] = useState<boolean>(() => {
    const savedHC = localStorage.getItem("highContrast");
    return savedHC ? savedHC === "true" : false;
  });

  const [hapticFeedback, setHapticFeedback] = useState<boolean>(() => {
    const savedHF = localStorage.getItem("hapticFeedback");
    return savedHF ? savedHF === "true" : true;
  });

  // Extended translations
  const translations = {
    en: {
      // Core translations
      settings: "Settings",
      darkMode: "Dark Mode",
      language: "Language",
      fontSize: "Font Size",
      colorTheme: "Color Theme",
      signUp: "Sign Up",
      signIn: "Sign In",
      home: "Home",
      readings: "Readings",
      predictions: "Predictions",
      chatbot: "Chatbot",
      reminders: "Reminders",
      english: "English",
      arabic: "Arabic",
      blue: "Blue",
      green: "Green",
      purple: "Purple",
      teal: "Teal",
      
      // Form fields
      firstName: "First Name",
      lastName: "Last Name",
      email: "Email",
      password: "Password",
      confirmPassword: "Confirm Password",
      age: "Age",
      gender: "Gender",
      dateOfBirth: "Date of Birth",
      height: "Height",
      weight: "Weight",
      diabetesStatus: "Diabetes Status",
      hypertensionStatus: "Hypertension Status",
      strokeHistory: "Stroke/Clot History",
      smokingStatus: "Smoking Status",
      chronicConditions: "Other Chronic Conditions",
      male: "Male",
      female: "Female",
      other: "Other",
      yes: "Yes",
      no: "No",
      current: "Current",
      former: "Former",
      never: "Never",
      
      // Home page
      hello: "Hello",
      latestReading: "Latest Reading",
      upcomingReminders: "Upcoming Reminders",
      bloodPressure: "Blood Pressure",
      heartRate: "Heart Rate",
      temperature: "Temperature",
      oxygenSaturation: "Oxygen Saturation",
      glucoseLevel: "Glucose Level",
      bmi: "BMI",
      mmHg: "mmHg",
      bpm: "bpm",
      celsius: "°C",
      percent: "%",
      mgdL: "mg/dL",
      normal: "Normal",
      elevated: "Elevated",
      high: "High",
      critical: "Critical",
      low: "Low",
      ignore: "Ignore",
      done: "Done",
      
      // Auth related
      emailRequired: "Email is required",
      invalidEmail: "Please enter a valid email",
      passwordRequired: "Password is required",
      passwordTooShort: "Password must be at least 8 characters",
      passwordMismatch: "Passwords do not match",
      signingIn: "Signing In...",
      signingUp: "Signing Up...",
      forgotPassword: "Forgot Password?",
      resetPassword: "Reset Password",
      sendResetLink: "Send Reset Link",
      sending: "Sending...",
      resetEmailSent: "Reset email sent!",
      backToSignIn: "Back to Sign In",
      biometricAuth: "Login with Biometrics",
      dontHaveAccount: "Don't have an account?",
      alreadyHaveAccount: "Already have an account?",
      welcomeBack: "Welcome back",
      or: "Or",
      
      // Accessibility
      accessibilitySettings: "Accessibility Settings",
      textToSpeech: "Text to Speech",
      voiceAssistant: "Voice Assistant",
      screenReader: "Screen Reader",
      highContrast: "High Contrast",
      hapticFeedback: "Haptic Feedback",
      
      // Predictions
      diabetesRisk: "Diabetes Risk",
      heartDiseaseRisk: "Heart Disease Risk",
      exportPDF: "Export PDF Report",
      predictNow: "Predict Now",
      
      // Other
      logout: "Logout",
      enterGlucose: "Enter Glucose",
      add: "Add",
      save: "Save",
      cancel: "Cancel",
      edit: "Edit",
      delete: "Delete",
      today: "Today",
      now: "Now",
      
      // New translations for the app
      offlineMode: "Offline Mode",
      syncingData: "Syncing data...",
      syncComplete: "Sync complete",
      syncFailed: "Sync failed",
      retry: "Retry",
      nextCheck: "Next Check",
      completedTasks: "Completed",
      pendingTasks: "Pending",
      dailyReport: "Daily Report",
      weeklyReport: "Weekly Report",
      monthlyReport: "Monthly Report",
      exportSuccess: "Report exported successfully",
      exportFailed: "Failed to export report",
      healthTracker: "Health Tracker",
    },
    ar: {
      // Core translations
      settings: "الإعدادات",
      darkMode: "الوضع الداكن",
      language: "اللغة",
      fontSize: "حجم الخط",
      colorTheme: "نمط الألوان",
      signUp: "إنشاء حساب",
      signIn: "تسجيل الدخول",
      home: "الرئيسية",
      readings: "القراءات",
      predictions: "التوقعات",
      chatbot: "المحادثة الآلية",
      reminders: "التذكيرات",
      english: "الإنجليزية",
      arabic: "العربية",
      blue: "أزرق",
      green: "أخضر",
      purple: "أرجواني",
      teal: "أزرق مخضر",
      
      // Form fields
      firstName: "الاسم الأول",
      lastName: "اسم العائلة",
      email: "البريد الإلكتروني",
      password: "كلمة المرور",
      confirmPassword: "تأكيد كلمة المرور",
      age: "العمر",
      gender: "الجنس",
      dateOfBirth: "تاريخ الميلاد",
      height: "الطول",
      weight: "الوزن",
      diabetesStatus: "حالة السكري",
      hypertensionStatus: "حالة ضغط الدم",
      strokeHistory: "تاريخ السكتة الدماغية/الجلطات",
      smokingStatus: "حالة التدخين",
      chronicConditions: "حالات مزمنة أخرى",
      male: "ذكر",
      female: "أنثى",
      other: "آخر",
      yes: "نعم",
      no: "لا",
      current: "حالي",
      former: "سابق",
      never: "أبداً",
      
      // Home page
      hello: "مرحبا",
      latestReading: "أحدث قراءة",
      upcomingReminders: "التذكيرات القادمة",
      bloodPressure: "ضغط الدم",
      heartRate: "معدل ضربات القلب",
      temperature: "درجة الحرارة",
      oxygenSaturation: "تشبع الأكسجين",
      glucoseLevel: "مستوى السكر",
      bmi: "مؤشر كتلة الجسم",
      mmHg: "مم زئبق",
      bpm: "نبضة/دقيقة",
      celsius: "°مئوية",
      percent: "%",
      mgdL: "مجم/ديسيلتر",
      normal: "طبيعي",
      elevated: "مرتفع قليلاً",
      high: "مرتفع",
      critical: "حرج",
      low: "منخفض",
      ignore: "تجاهل",
      done: "تم",
      
      // Auth related
      emailRequired: "البريد الإلكتروني مطلوب",
      invalidEmail: "الرجاء إدخال بريد إلكتروني صالح",
      passwordRequired: "كلمة المرور مطلوبة",
      passwordTooShort: "يجب أن تكون كلمة المرور 8 أحرف على الأقل",
      passwordMismatch: "كلمات المرور غير متطابقة",
      signingIn: "جاري تسجيل الدخول...",
      signingUp: "جاري إنشاء الحساب...",
      forgotPassword: "نسيت كلمة المرور؟",
      resetPassword: "إعادة تعيين كلمة المرور",
      sendResetLink: "إرسال رابط إعادة التعيين",
      sending: "جاري الإرسال...",
      resetEmailSent: "تم إرسال بريد إعادة التعيين!",
      backToSignIn: "العودة إلى تسجيل الدخول",
      biometricAuth: "تسجيل الدخول بالقياسات الحيوية",
      dontHaveAccount: "ليس لديك حساب؟",
      alreadyHaveAccount: "لديك حساب بالفعل؟",
      welcomeBack: "مرحبا بعودتك",
      or: "أو",
      
      // Accessibility
      accessibilitySettings: "إعدادات إمكانية الوصول",
      textToSpeech: "تحويل النص إلى كلام",
      voiceAssistant: "المساعد الصوتي",
      screenReader: "قارئ الشاشة",
      highContrast: "تباين عالي",
      hapticFeedback: "ردود الفعل اللمسية",
      
      // Predictions
      diabetesRisk: "خطر الإصابة بالسكري",
      heartDiseaseRisk: "خطر أمراض القلب",
      exportPDF: "تصدير تقرير PDF",
      predictNow: "التنبؤ الآن",
      
      // Other
      logout: "تسجيل الخروج",
      enterGlucose: "أدخل مستوى الجلوكوز",
      add: "إضافة",
      save: "حفظ",
      cancel: "إلغاء",
      edit: "تعديل",
      delete: "حذف",
      today: "اليوم",
      now: "الآن",
      
      // New translations for the app
      offlineMode: "وضع عدم الاتصال",
      syncingData: "مزامنة البيانات...",
      syncComplete: "اكتملت المزامنة",
      syncFailed: "فشلت المزامنة",
      retry: "إعادة المحاولة",
      nextCheck: "الفحص القادم",
      completedTasks: "مكتملة",
      pendingTasks: "قيد الانتظار",
      dailyReport: "التقرير اليومي",
      weeklyReport: "التقرير الأسبوعي",
      monthlyReport: "التقرير الشهري",
      exportSuccess: "تم تصدير التقرير بنجاح",
      exportFailed: "فشل تصدير التقرير",
      healthTracker: "تتبع الصحة",
    }
  };

  // Translation function
  const t = (key: string): string => {
    return translations[language]?.[key] || key;
  };

  // Text-to-speech function
  const speak = (text: string) => {
    if (textToSpeech && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language === 'ar' ? 'ar-SA' : 'en-US';
      window.speechSynthesis.speak(utterance);
    }
  };

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
  }, [language]);

  useEffect(() => {
    localStorage.setItem("fontSize", fontSize.toString());
    document.documentElement.style.fontSize = `${fontSize}px`;
  }, [fontSize]);

  useEffect(() => {
    localStorage.setItem("colorTheme", colorTheme);
    // Apply color theme CSS variables
    switch(colorTheme) {
      case "blue":
        document.documentElement.style.setProperty('--primary', '201 100% 40%');
        document.documentElement.style.setProperty('--accent', '201 94% 86%');
        break;
      case "green":
        document.documentElement.style.setProperty('--primary', '142 76% 36%');
        document.documentElement.style.setProperty('--accent', '142 71% 82%');
        break;
      case "purple":
        document.documentElement.style.setProperty('--primary', '270 76% 40%');
        document.documentElement.style.setProperty('--accent', '270 76% 86%');
        break;
      case "teal":
        document.documentElement.style.setProperty('--primary', '180 100% 30%');
        document.documentElement.style.setProperty('--accent', '180 100% 76%');
        break;
      default:
        break;
    }
  }, [colorTheme]);

  // Save accessibility preferences
  useEffect(() => {
    localStorage.setItem("textToSpeech", textToSpeech.toString());
  }, [textToSpeech]);

  useEffect(() => {
    localStorage.setItem("voiceAssistant", voiceAssistant.toString());
  }, [voiceAssistant]);

  useEffect(() => {
    localStorage.setItem("screenReader", screenReader.toString());
    // Add ARIA attributes for screen readers if enabled
    if (screenReader) {
      document.documentElement.setAttribute('role', 'application');
    } else {
      document.documentElement.removeAttribute('role');
    }
  }, [screenReader]);

  useEffect(() => {
    localStorage.setItem("highContrast", highContrast.toString());
    // Apply high contrast mode
    document.documentElement.classList.toggle("high-contrast", highContrast);
  }, [highContrast]);

  useEffect(() => {
    localStorage.setItem("hapticFeedback", hapticFeedback.toString());
  }, [hapticFeedback]);

  return (
    <AppContext.Provider
      value={{
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
        translations,
        t,
        speak,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
