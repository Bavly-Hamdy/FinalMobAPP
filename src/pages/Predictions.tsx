import { useEffect, useState } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { firebaseService, UserProfile } from "@/services/firebaseService";
import { auth } from "@/lib/firebase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/layout/MainLayout";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { AlertCircle, Download, RefreshCw } from "lucide-react";
import { useReminders } from "@/hooks/useReminders";
import { useGlucoseReadings } from "@/hooks/useGlucoseReadings";
import { pdfExportService } from "@/services/pdfExportService";
import { useToast } from "@/hooks/use-toast";
import { ProfileSkeleton } from "@/components/ProfileSkeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getDatabase, ref, push, set, onValue } from "firebase/database";

interface PredictionInputs {
  gender: string;
  age: string;
  hypertension: string;
  heart_disease: string;
  smoking_history: string;
  bmi: string;
  blood_glucose_level: string;
}

interface PredictionResult {
  prediction: string;
  confidence: string;
  probabilities: {
    "Non-Diabetic": string;
    Diabetic: string;
  };
  timestamp?: string;
}

const Predictions = () => {
  const { t } = useAppContext();
  const { reminders } = useReminders();
  const { readings } = useGlucoseReadings();
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [bmi, setBmi] = useState<number | null>(null);
  const [bmiCategory, setBmiCategory] = useState<string | null>(null);
  const [loadingUserData, setLoadingUserData] = useState(true);
  const [showFallback, setShowFallback] = useState(false);
  const [height, setHeight] = useState<number | null>(null);
  const [weight, setWeight] = useState<number | null>(null);

  // State for prediction inputs and results
  const [predictionInputs, setPredictionInputs] = useState<PredictionInputs>({
    gender: "",
    age: "",
    hypertension: "0",
    heart_disease: "0",
    smoking_history: "",
    bmi: "",
    blood_glucose_level: ""
  });
  const [predictionResults, setPredictionResults] = useState<PredictionResult[]>([]);
  const [loadingPrediction, setLoadingPrediction] = useState(false);

  // Load user profile and initialize inputs
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      console.error("No authenticated user found");
      toast({
        title: "Authentication Error",
        description: "Please log in to continue.",
        variant: "destructive",
      });
      setLoadingUserData(false);
      return;
    }

    console.log("Subscribing to user profile for UID:", user.uid);
    const unsubscribe = firebaseService.subscribeToUserProfile((data) => {
      if (data) {
        setProfile(data);
        setHeight(data.height ?? null);
        setWeight(data.weight ?? null);
        const calculatedBmi = firebaseService.calculateBMI(data.weight, data.height);
        setBmi(calculatedBmi);
        setBmiCategory(firebaseService.getBMICategory(calculatedBmi));
        setPredictionInputs((prev) => ({
          ...prev,
          gender: data.gender || "",
          bmi: calculatedBmi ? calculatedBmi.toFixed(1) : "",
          age: data.age ? data.age.toString() : ""
        }));
      } else {
        console.warn("No profile data found for user:", user.uid);
      }
      setLoadingUserData(false);
    });

    return () => unsubscribe();
  }, [toast]);

  // Load predictions from Realtime Database
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      console.error("No authenticated user found for predictions subscription");
      setPredictionResults([]);
      return;
    }

    console.log("Subscribing to predictions for UID:", user.uid);
    const db = getDatabase();
    const predictionsRef = ref(db, `predictions/${user.uid}`);
    const unsubscribe = onValue(predictionsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const results = Object.values(data) as PredictionResult[];
        setPredictionResults(results.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || "")));
        console.log("Predictions updated:", results.length);
      } else {
        setPredictionResults([]);
        console.log("No predictions found");
      }
    }, (error) => {
      console.error("Error in predictions subscription:", error);
      if (error.message.includes("permission_denied")) {
        toast({
          title: "Permission Error",
          description: "You don't have permission to access predictions. Please check your account settings.",
          variant: "destructive",
        });
      }
      setPredictionResults([]);
    });

    return () => unsubscribe();
  }, [toast]);

  // Show fallback if no height/weight data
  useEffect(() => {
    if (!loadingUserData && (!height || !weight)) {
      const timer = setTimeout(() => {
        setShowFallback(true);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loadingUserData, height, weight]);

  // Fix links with target="_blank" to include rel="noopener noreferrer"
  useEffect(() => {
    const links = document.querySelectorAll<HTMLAnchorElement>('a[target="_blank"]');
    links.forEach((link) => {
      if (!link.rel.includes("noopener")) {
        console.warn("Link without noopener:", link.href);
        link.rel = "noopener noreferrer";
      }
    });
  }, []);

  // Check service worker status
  useEffect(() => {
    console.log("Navigator service worker:", navigator.serviceWorker);
  }, []);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPredictionInputs((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setPredictionInputs((prev) => ({ ...prev, [name]: value }));
  };

  // Handle prediction submission
  const handlePredict = async () => {
    // Input validation
    const age = parseFloat(predictionInputs.age);
    const bmi = parseFloat(predictionInputs.bmi);
    const glucose = parseFloat(predictionInputs.blood_glucose_level);
    if (age < 1 || age > 120 || isNaN(age)) {
      toast({
        title: "Invalid Input",
        description: "Age must be between 1 and 120.",
        variant: "destructive",
      });
      return;
    }
    if (bmi < 10 || bmi > 50 || isNaN(bmi)) {
      toast({
        title: "Invalid Input",
        description: "BMI must be between 10 and 50.",
        variant: "destructive",
      });
      return;
    }
    if (glucose < 50 || glucose > 300 || isNaN(glucose)) {
      toast({
        title: "Invalid Input",
        description: "Blood glucose level must be between 50 and 300 mg/dL.",
        variant: "destructive",
      });
      return;
    }
    if (!predictionInputs.gender || !predictionInputs.smoking_history) {
      toast({
        title: "Invalid Input",
        description: "Please select gender and smoking history.",
        variant: "destructive",
      });
      return;
    }

    setLoadingPrediction(true);
    try {
      // Prepare data for API
      const data = {
        gender: predictionInputs.gender,
        age: parseFloat(predictionInputs.age),
        hypertension: parseInt(predictionInputs.hypertension),
        heart_disease: parseInt(predictionInputs.heart_disease),
        smoking_history: predictionInputs.smoking_history,
        bmi: parseFloat(predictionInputs.bmi),
        blood_glucose_level: parseFloat(predictionInputs.blood_glucose_level),
      };

      const API_URL = import.meta.env.VITE_API_URL || "https://192.168.65.31:8000/predict";
      console.log("Sending API request to:", API_URL, data);

      // Send request to API
      const response = await axios.post<PredictionResult>(
        API_URL,
        data,
        {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        }
      );
      
      console.log("API response:", response.data);

      // Save to Realtime Database
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }
      const db = getDatabase();
      const predictionsRef = ref(db, `predictions/${user.uid}`);
      const newPredictionRef = push(predictionsRef);
      await set(newPredictionRef, {
        ...data,
        prediction: response.data.prediction,
        confidence: response.data.confidence,
        probabilities: response.data.probabilities,
        timestamp: new Date().toISOString(),
      });

      toast({
        title: "Prediction Successful",
        description: `Result: ${response.data.prediction} (${response.data.confidence})`,
      });
    } catch (error: unknown) {
      console.error("Error making prediction:", error);
      let errorMessage = "Unable to get prediction. Please try again.";
      if (error instanceof Error) {
        if (error.message.includes("permission_denied")) {
          errorMessage = "Permission denied. Please check your account settings or contact support.";
        } else if ("response" in error) {
          const axiosError = error as { response?: { data?: { detail?: string } } };
          if (axiosError.response?.data?.detail) {
            errorMessage = axiosError.response.data.detail;
          }
        } else if ("request" in error) {
          errorMessage = "No response from server. Please check if the API is running.";
        }
      }
      toast({
        title: "Prediction Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoadingPrediction(false);
    }
  };

  // Placeholder data for charts
  const diabetesRisk = predictionResults.length > 0 ? parseFloat(predictionResults[0].probabilities.Diabetic) : 35;
  const heartDiseaseRisk = 25; // Placeholder

  const futurePredictionData = [
    { month: "Jan", diabetesRisk: diabetesRisk, heartDiseaseRisk: 25 },
    { month: "Feb", diabetesRisk: diabetesRisk - 1, heartDiseaseRisk: 24 },
    { month: "Mar", diabetesRisk: diabetesRisk - 2, heartDiseaseRisk: 26 },
    { month: "Apr", diabetesRisk: diabetesRisk - 4, heartDiseaseRisk: 23 },
    { month: "May", diabetesRisk: diabetesRisk - 3, heartDiseaseRisk: 22 },
    { month: "Jun", diabetesRisk: diabetesRisk - 5, heartDiseaseRisk: 23 }
  ];

  const diabetesFactors = [
    { name: "Age", value: 20 },
    { name: "BMI", value: 30 },
    { name: "Blood Sugar", value: 40 },
    { name: "Family History", value: 10 }
  ];

  const heartDiseaseFactors = [
    { name: "Age", value: 15 },
    { name: "Blood Pressure", value: 30 },
    { name: "Cholesterol", value: 25 },
    { name: "Heart Rate", value: 15 },
    { name: "Activity Level", value: 15 }
  ];

  const COLORS = ["#0967d2", "#47a3f3", "#7cc4fa", "#bae3ff", "#e6f7ff"];

  const getBmiColor = (bmi: number) => {
    if (bmi < 18.5) return "text-health-warning-500";
    if (bmi < 25) return "text-health-success-500";
    if (bmi < 30) return "text-health-warning-500";
    return "text-health-danger-500";
  };

  const handleExportPDF = async () => {
    if (!profile) {
      toast({
        title: "Error",
        description: "Profile data not available for export.",
        variant: "destructive"
      });
      return;
    }

    try {
      await pdfExportService.exportToPDF({
        profile,
        reminders,
        glucoseReadings: readings,
        bmi: bmi || undefined,
        bmiCategory: bmiCategory || undefined,
        prediction: predictionResults.length > 0 ? predictionResults[0].prediction : undefined
      });
      toast({
        title: "Export successful",
        description: "Your health report has been downloaded successfully."
      });
    } catch (error) {
      console.error("Error exporting PDF:", error);
      toast({
        title: "Export failed",
        description: "Failed to export PDF. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRefreshProfile = async () => {
    try {
      const updatedProfile = await firebaseService.getUserProfile();
      if (updatedProfile) {
        setProfile(updatedProfile);
        setHeight(updatedProfile.height ?? null);
        setWeight(updatedProfile.weight ?? null);
        const calculatedBmi = firebaseService.calculateBMI(updatedProfile.weight, updatedProfile.height);
        setBmi(calculatedBmi);
        setBmiCategory(firebaseService.getBMICategory(calculatedBmi));
      }
      toast({
        title: "Profile data",
        description: "Using latest profile data from the server."
      });
    } catch (error) {
      console.error("Error refreshing profile:", error);
      toast({
        title: "Refresh failed",
        description: "Failed to refresh profile data. Please try again.",
        variant: "destructive"
      });
    }
  };

  const renderBMISection = () => {
    if (height && weight && height > 0 && weight > 0) {
      const calculatedBMI = bmi?.toFixed(1);
      const category = bmiCategory || "Unknown";

      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                value={height}
                readOnly
                className="mt-1 bg-gray-100"
              />
            </div>
            <div>
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                value={weight}
                readOnly
                className="mt-1 bg-gray-100"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="bmi">BMI</Label>
            <Input
              id="bmi"
              type="text"
              value={calculatedBMI}
              readOnly
              className="mt-1 bg-gray-100"
            />
            <p className={`font-medium ${getBmiColor(bmi || 0)}`}>
              {category}
            </p>
          </div>
        </div>
      );
    }

    if (loadingUserData && !showFallback) {
      return <ProfileSkeleton type="bmi" />;
    }

    return (
      <div className="text-center py-8">
        <AlertCircle className="mx-auto mb-2 text-health-warning-500" size={32} />
        <p className="text-muted-foreground mb-2">No height or weight data found</p>
        <p className="text-sm text-muted-foreground">Please complete your profile</p>
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="container p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{t("predictions")}</h1>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={handleRefreshProfile} className="flex items-center gap-2">
              <RefreshCw size={16} />
              Refresh
            </Button>
            <Button variant="outline" onClick={handleExportPDF} className="flex items-center gap-2">
              <Download size={16} />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Prediction Input Form */}
        <Card className="p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Enter Health Data for Prediction</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select
                onValueChange={(value) => handleSelectChange("gender", value)}
                value={predictionInputs.gender}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="age">Age</Label>
              <Input
                id="age"
                name="age"
                type="number"
                value={predictionInputs.age}
                onChange={handleInputChange}
                placeholder="Enter age"
              />
            </div>
            <div>
              <Label htmlFor="hypertension">Hypertension</Label>
              <Select
                onValueChange={(value) => handleSelectChange("hypertension", value)}
                value={predictionInputs.hypertension}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select hypertension status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No</SelectItem>
                  <SelectItem value="1">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="heart_disease">Heart Disease</Label>
              <Select
                onValueChange={(value) => handleSelectChange("heart_disease", value)}
                value={predictionInputs.heart_disease}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select heart disease status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">No</SelectItem>
                  <SelectItem value="1">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="smoking_history">Smoking History</Label>
              <Select
                onValueChange={(value) => handleSelectChange("smoking_history", value)}
                value={predictionInputs.smoking_history}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select smoking history" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never</SelectItem>
                  <SelectItem value="former">Former</SelectItem>
                  <SelectItem value="current">Current</SelectItem>
                  <SelectItem value="ever">Ever</SelectItem>
                  <SelectItem value="not current">Not Current</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="bmi">BMI</Label>
              <Input
                id="bmi"
                name="bmi"
                type="number"
                step="0.1"
                value={predictionInputs.bmi}
                onChange={handleInputChange}
                placeholder="Enter BMI"
              />
            </div>
            <div>
              <Label htmlFor="blood_glucose_level">Blood Glucose Level (mg/dL)</Label>
              <Input
                id="blood_glucose_level"
                name="blood_glucose_level"
                type="number"
                value={predictionInputs.blood_glucose_level}
                onChange={handleInputChange}
                placeholder="Enter blood glucose level"
              />
            </div>
          </div>
          <Button
            onClick={handlePredict}
            disabled={
              loadingPrediction ||
              !predictionInputs.gender ||
              !predictionInputs.age ||
              !predictionInputs.bmi ||
              !predictionInputs.blood_glucose_level ||
              !predictionInputs.smoking_history
            }
            className="mt-4"
          >
            {loadingPrediction ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Predicting...
              </span>
            ) : (
              "Predict Diabetes Risk"
            )}
          </Button>
        </Card>

        {/* Recent Predictions */}
        <Card className="p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4">Recent Predictions</h2>
          {predictionResults.length > 0 ? (
            <ul className="space-y-4">
              {predictionResults.map((result, index) => (
                <li key={index} className="p-4 border rounded">
                  <p><strong>Prediction:</strong> {result.prediction}</p>
                  <p><strong>Confidence:</strong> {result.confidence}</p>
                  <p><strong>Probabilities:</strong></p>
                  <ul className="list-disc list-inside">
                    <li>Non-Diabetic: {result.probabilities["Non-Diabetic"]}</li>
                    <li>Diabetic: {result.probabilities.Diabetic}</li>
                  </ul>
                  <p><strong>Timestamp:</strong> {new Date(result.timestamp || "").toLocaleString()}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">No predictions yet.</p>
          )}
        </Card>

        <Card className="p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">{t("bmi")}</h2>
          {renderBMISection()}
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">{t("diabetesRisk")}</h2>
            <div className="flex justify-center mb-4">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E4E7EB"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#0967d2"
                    strokeWidth="3"
                    strokeDasharray={`${diabetesRisk}, 100`}
                  />
                  <text x="18" y="21" textAnchor="middle" fontSize="8" fill="currentColor" fontWeight="bold">
                    {diabetesRisk.toFixed(0)}%
                  </text>
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="font-medium text-center">Key Factors</h3>
              <div className="h-64 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={diabetesFactors}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {diabetesFactors.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="text-lg font-semibold mb-4">{t("heartDiseaseRisk")}</h2>
            <div className="flex justify-center mb-4">
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full" viewBox="0 0 36 36">
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#E4E7EB"
                    strokeWidth="3"
                  />
                  <path
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    fill="none"
                    stroke="#e12d39"
                    strokeWidth="3"
                    strokeDasharray={`${heartDiseaseRisk}, 100`}
                  />
                  <text x="18" y="21" textAnchor="middle" fontSize="8" fill="currentColor" fontWeight="bold">
                    {heartDiseaseRisk}%
                  </text>
                </svg>
              </div>
            </div>
            <div className="mt-4">
              <h3 className="font-medium text-center">Key Factors</h3>
              <div className="h-64 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={heartDiseaseFactors}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {heartDiseaseFactors.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        </div>

        <Card className="p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">Future Risk Predictions</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={futurePredictionData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="diabetesRisk"
                  stroke="#0967d2"
                  strokeWidth="2"
                  name="Diabetes Risk"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line
                  type="monotone"
                  dataKey="heartDiseaseRisk"
                  stroke="#e12d39"
                  strokeWidth="2"
                  name="Heart Disease Risk"
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-start space-x-3">
            <AlertCircle className="text-health-warning-500 mt-1" size={24} />
            <div>
              <h3 className="text-lg font-semibold mb-2">Health Recommendations</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>Schedule regular check-ups with your healthcare provider</li>
                <li>Monitor your blood pressure daily</li>
                <li>Maintain a balanced diet low in sodium and sugar</li>
                <li>Aim for 30 minutes of moderate exercise at least 5 days a week</li>
                <li>Ensure proper medication adherence</li>
              </ul>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Predictions;