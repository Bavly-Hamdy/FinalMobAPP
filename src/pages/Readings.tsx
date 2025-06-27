import React, { useState, useEffect } from "react";
import { useAppContext } from "@/contexts/AppContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import MainLayout from "@/components/layout/MainLayout";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useGlucoseReadings } from "@/hooks/useGlucoseReadings";
import { AlertCircle, Plus } from "lucide-react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useToast } from "@/hooks/use-toast";
import axios from "axios";
import {
  storeHealthReading,
  storeBloodPressureReading,
  subscribeToHealthReadings,
  subscribeToBloodPressure,
  HealthReading,
  BloodPressureReading,
  resetSession
} from "@/services/realtimeDbService";

// Define FastAPI response interface
interface FastAPIResponse {
  prediction: string;
  confidence: string;
  probabilities: {
    "Non-Diabetic": string;
    Diabetic: string;
  };
}

// Define extended UserProfile interface
interface ExtendedUserProfile {
  gender?: string;
  age?: number;
  weight?: number;
  height?: number;
  smoking_history?: string;
}

// Custom type for Tooltip payload
type ChartDataPayload = {
  payload: {
    time: string;
    value: number;
    formattedTime: string;
  };
};

const Readings = () => {
  const { t } = useAppContext();
  const [glucoseValue, setGlucoseValue] = useState<string>("");
  const [inputError, setInputError] = useState<string>("");
  const { chartData, addReading, isLoading, hasError } = useGlucoseReadings();
  const { profile } = useUserProfile();
  const { toast } = useToast();

  // States for BLE data
  const [bloodPressureData, setBloodPressureData] = useState<
    { time: string; systolic: number; diastolic: number }[]
  >([]);
  const [heartRateData, setHeartRateData] = useState<{ time: string; value: number }[]>([]);
  const [temperatureData, setTemperatureData] = useState<{ time: string; value: number }[]>([]);
  const [oxygenSaturationData, setOxygenSaturationData] = useState<
    { time: string; value: number }[]
  >([]);
  const [caloriesData, setCaloriesData] = useState<{ time: string; value: number }[]>([]);
  const [stepsData, setStepsData] = useState<{ time: string; value: number }[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [userWeight, setUserWeight] = useState<number>(70); // Default
  const [userHeight, setUserHeight] = useState<number>(170); // Default
  const [device, setDevice] = useState<BluetoothDevice | null>(null);
  const [gattServer, setGattServer] = useState<BluetoothRemoteGATTServer | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [predictionResult, setPredictionResult] = useState<string | null>(null);

  // BLE UUIDs
  const SERVICE_UUID = "4fafc201-1fb5-459e-8fcc-c5c9c331914b";
  const HEART_RATE_CHAR_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a8";
  const SPO2_CHAR_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26a9";
  const TEMP_CHAR_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26aa";
  const BP_CHAR_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26ab";
  const STEPS_CHAR_UUID = "beb5483e-36e1-4688-b7f5-ea07361b26ac";

  // FastAPI endpoint
  const FASTAPI_URL = "https://localhost:8000/predict"; // Update to HTTPS

  // Check Bluetooth availability
  const isBluetoothAvailable = !!navigator.bluetooth;

  // Load user profile from Firebase
  useEffect(() => {
    if (profile) {
      if (profile.weight && profile.weight >= 30 && profile.weight <= 150) {
        setUserWeight(profile.weight);
      } else {
        console.warn("Invalid or missing weight in profile, using default: 70 kg");
      }
      if (profile.height && profile.height >= 100 && profile.height <= 250) {
        setUserHeight(profile.height);
      } else {
        console.warn("Invalid or missing height in profile, using default: 170 cm");
      }
    }
  }, [profile]);

  // Monitor authentication state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      if (user) {
        // Reset session when user logs in
        resetSession();
      }
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to health readings from Firebase
  useEffect(() => {
    if (!isAuthenticated) return;

    // Subscribe to heart rate readings
    const heartRateUnsubscribe = subscribeToHealthReadings('heartRate', (readings) => {
      const formattedData = readings.map(reading => ({
        time: new Date(reading.timestamp).toLocaleTimeString(),
        value: reading.value
      }));
      setHeartRateData(formattedData);
    });

    // Subscribe to SpO2 readings
    const spo2Unsubscribe = subscribeToHealthReadings('spo2', (readings) => {
      const formattedData = readings.map(reading => ({
        time: new Date(reading.timestamp).toLocaleTimeString(),
        value: reading.value
      }));
      setOxygenSaturationData(formattedData);
    });

    // Subscribe to temperature readings
    const temperatureUnsubscribe = subscribeToHealthReadings('temperature', (readings) => {
      const formattedData = readings.map(reading => ({
        time: new Date(reading.timestamp).toLocaleTimeString(),
        value: reading.value
      }));
      setTemperatureData(formattedData);
    });

    // Subscribe to steps readings
    const stepsUnsubscribe = subscribeToHealthReadings('steps', (readings) => {
      const formattedData = readings.map(reading => ({
        time: new Date(reading.timestamp).toLocaleTimeString(),
        value: reading.value
      }));
      setStepsData(formattedData);
    });

    // Subscribe to calories readings
    const caloriesUnsubscribe = subscribeToHealthReadings('calories', (readings) => {
      const formattedData = readings.map(reading => ({
        time: new Date(reading.timestamp).toLocaleTimeString(),
        value: reading.value
      }));
      setCaloriesData(formattedData);
    });

    // Subscribe to blood pressure readings
    const bloodPressureUnsubscribe = subscribeToBloodPressure((readings) => {
      const formattedData = readings.map(reading => ({
        time: new Date(reading.timestamp).toLocaleTimeString(),
        systolic: reading.systolic,
        diastolic: reading.diastolic
      }));
      setBloodPressureData(formattedData);
    });

    // Cleanup subscriptions
    return () => {
      heartRateUnsubscribe();
      spo2Unsubscribe();
      temperatureUnsubscribe();
      stepsUnsubscribe();
      caloriesUnsubscribe();
      bloodPressureUnsubscribe();
    };
  }, [isAuthenticated]);

  // Clean up BLE connection on unmount
  useEffect(() => {
    return () => {
      if (gattServer) {
        gattServer.disconnect();
        setIsConnected(false);
        setDevice(null);
        setGattServer(null);
        console.log("BLE disconnected on component unmount");
      }
    };
  }, [gattServer]);

  // Validate health readings
  const validateReading = (type: string, value: number): boolean => {
    switch (type) {
      case "heartRate":
        return value >= 50 && value <= 110;
      case "spo2":
        return value >= 85 && value <= 100;
      case "temperature":
        return value >= 25 && value <= 45;
      case "systolic":
        return value >= 80 && value <= 200;
      case "diastolic":
        return value >= 50 && value <= 130;
      case "steps":
        return value >= 0;
      default:
        return true;
    }
  };

  // Store readings in Firebase and predict diabetes
  const storeReadingInFirebase = async (reading: {
    heartRate?: number;
    spo2?: number;
    temperature?: number;
    systolic?: number;
    diastolic?: number;
    steps?: number;
    caloriesBurned?: number;
  }) => {
    if (!auth.currentUser) {
      console.error("Cannot store reading: User not authenticated");
      return;
    }
    
    try {
      // Store heart rate
      if (reading.heartRate !== undefined) {
        await storeHealthReading('heartRate', reading.heartRate);
      }
      
      // Store SpO2
      if (reading.spo2 !== undefined) {
        await storeHealthReading('spo2', reading.spo2);
      }
      
      // Store temperature
      if (reading.temperature !== undefined) {
        await storeHealthReading('temperature', reading.temperature);
      }
      
      // Store blood pressure
      if (reading.systolic !== undefined && reading.diastolic !== undefined) {
        await storeBloodPressureReading(reading.systolic, reading.diastolic);
      }
      
      // Store steps
      if (reading.steps !== undefined) {
        await storeHealthReading('steps', reading.steps);
      }
      
      // Store calories
      if (reading.caloriesBurned !== undefined) {
        await storeHealthReading('calories', reading.caloriesBurned);
      }

      // Predict diabetes using FastAPI
      if (profile && reading.systolic && reading.heartRate && glucoseValue) {
        const bmi = userWeight / ((userHeight / 100) ** 2);
        const patientData = {
          gender: (profile as ExtendedUserProfile).gender || "Other",
          age: (profile as ExtendedUserProfile).age || 30,
          hypertension: reading.systolic && reading.systolic > 140 ? 1 : 0,
          heart_disease: reading.heartRate && reading.heartRate > 100 ? 1 : 0,
          smoking_history: (profile as ExtendedUserProfile).smoking_history || "never",
          bmi: bmi,
          blood_glucose_level: Number(glucoseValue)
        };
        try {
          const response = await axios.post<FastAPIResponse>(FASTAPI_URL, patientData, {
            headers: { "Content-Type": "application/json" },
            withCredentials: true
          });
          setPredictionResult(`Prediction: ${response.data.prediction} (${response.data.confidence})`);
          toast({
            title: "Prediction Successful",
            description: `Diabetes Prediction: ${response.data.prediction} with ${response.data.confidence} confidence`
          });
        } catch (error) {
          console.error("Error calling FastAPI:", error);
          toast({
            title: "Prediction Failed",
            description: "Could not get diabetes prediction. Please try again.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error("Error storing reading in Firebase:", error);
      toast({
        title: "Storage Error",
        description: "Failed to save reading to Firebase. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Calculate calories burned
  const calculateCaloriesBurned = (steps: number): number => {
    const distanceKm = steps * 0.7 / 1000; // STRIDE_LENGTH = 0.7m
    const hours = distanceKm / 4; // WALKING_SPEED = 4 km/h
    const calories = 3.5 * userWeight * hours; // MET_WALKING = 3.5
    return Math.min(calories, 1000); // Cap at 1000 kcal
  };

  // Connect to BLE device with retries
  const connectToDevice = async () => {
    if (!navigator.bluetooth) {
      toast({
        title: "Bluetooth Unavailable",
        description: "Please use a browser with Web Bluetooth support (e.g., Chrome) and ensure the page is served over HTTPS.",
        variant: "destructive",
      });
      return;
    }
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to connect to your device.",
        variant: "destructive",
      });
      return;
    }
    if (isConnected) {
      toast({
        title: "Already Connected",
        description: "Device is already connected.",
      });
      return;
    }

    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        // Use more flexible filters to improve connection success rate
        const device = await navigator.bluetooth.requestDevice({
          filters: [
            { name: "PortableHealthMonitor" },
            { services: [SERVICE_UUID] }
          ],
          optionalServices: [SERVICE_UUID],
        });
        setDevice(device);

        // Add timeout for GATT connection to prevent hanging
        const connectWithTimeout = async (device: BluetoothDevice, timeoutMs = 10000) => {
          return Promise.race([
            device.gatt!.connect(),
            new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error("Connection timeout")), timeoutMs);
            })
          ]);
        };
        
        const server = await connectWithTimeout(device);
        setGattServer(server);
        
        // Verify service exists
        const service = await server.getPrimaryService(SERVICE_UUID).catch((error) => {
          console.error("Service not found:", error);
          throw new Error(`Required service ${SERVICE_UUID} not found on device`);
        });

        // Handle device disconnection
        device.addEventListener("gattserverdisconnected", () => {
          setIsConnected(false);
          setDevice(null);
          setGattServer(null);
          toast({
            title: "Device Disconnected",
            description: "The device has been disconnected.",
            variant: "destructive",
          });
          console.log("BLE device disconnected");
        });

        // Helper function to safely set up characteristic notifications
        const setupCharacteristic = async (uuid: string, type: string, handler: (value: string) => void) => {
          try {
            const characteristic = await service.getCharacteristic(uuid);
            characteristic.addEventListener("characteristicvaluechanged", (event) => {
              try {
                const target = event.target as BluetoothRemoteGATTCharacteristic;
                const value = new TextDecoder().decode(target.value);
                handler(value);
              } catch (error) {
                console.error(`Error processing ${type} data:`, error);
              }
            });
            await characteristic.startNotifications();
            console.log(`${type} characteristic notifications started`);
            return true;
          } catch (error) {
            console.error(`Error setting up ${type} characteristic:`, error);
            return false;
          }
        };
        
        // Track which characteristics were successfully set up
        let successCount = 0;
        const totalCharacteristics = 5; // HR, SpO2, Temp, BP, Steps
        
        // Heart Rate
        const hrSuccess = await setupCharacteristic(HEART_RATE_CHAR_UUID, "Heart Rate", (value) => {
          const heartRate = parseInt(value);
          if (validateReading("heartRate", heartRate)) {
            setHeartRateData((prev) => [
              ...prev.slice(-50), // Limit to last 50 readings
              { time: new Date().toLocaleTimeString(), value: heartRate },
            ]);
            storeReadingInFirebase({ heartRate });
          }
        });
        if (hrSuccess) successCount++;
        
        // SpO2
        const spo2Success = await setupCharacteristic(SPO2_CHAR_UUID, "SpO2", (value) => {
          const spo2 = parseInt(value);
          if (validateReading("spo2", spo2)) {
            setOxygenSaturationData((prev) => [
              ...prev.slice(-50),
              { time: new Date().toLocaleTimeString(), value: spo2 },
            ]);
            storeReadingInFirebase({ spo2 });
          }
        });
        if (spo2Success) successCount++;
        
        // Temperature
        const tempSuccess = await setupCharacteristic(TEMP_CHAR_UUID, "Temperature", (value) => {
          const temperature = parseFloat(value);
          if (validateReading("temperature", temperature)) {
            setTemperatureData((prev) => [
              ...prev.slice(-50),
              { time: new Date().toLocaleTimeString(), value: temperature },
            ]);
            storeReadingInFirebase({ temperature });
          }
        });
        if (tempSuccess) successCount++;
        
        // Blood Pressure
        const bpSuccess = await setupCharacteristic(BP_CHAR_UUID, "Blood Pressure", (value) => {
          const [systolic, diastolic] = value.split("/").map(Number);
          if (validateReading("systolic", systolic) && validateReading("diastolic", diastolic)) {
            setBloodPressureData((prev) => [
              ...prev.slice(-50),
              { time: new Date().toLocaleTimeString(), systolic, diastolic },
            ]);
            storeReadingInFirebase({ systolic, diastolic });
          }
        });
        if (bpSuccess) successCount++;
        
        // Steps
        const stepsSuccess = await setupCharacteristic(STEPS_CHAR_UUID, "Steps", (value) => {
          const steps = parseInt(value);
          if (validateReading("steps", steps)) {
            setStepsData((prev) => [
              ...prev.slice(-50),
              { time: new Date().toLocaleTimeString(), value: steps },
            ]);
            const caloriesBurned = calculateCaloriesBurned(steps);
            setCaloriesData((prev) => [
              ...prev.slice(-50),
              { time: new Date().toLocaleTimeString(), value: caloriesBurned },
            ]);
            storeReadingInFirebase({ steps, caloriesBurned });
          }
        });
        if (stepsSuccess) successCount++;
        
        // Update connection status based on characteristic setup success
        if (successCount > 0) {
          setIsConnected(true);
          toast({
            title: "Device Connected",
            description: `Successfully connected to Portable Health Monitor. ${successCount}/${totalCharacteristics} sensors active.`,
          });
          return; // Success, exit retry loop
        } else {
          // No characteristics were set up successfully
          throw new Error("Failed to set up any device characteristics");
        }
      } catch (error: unknown) {
        retryCount++;
        console.error(`BLE Connection Attempt ${retryCount} Failed:`, error);
        
        // Provide more specific error messages based on the error type
        let errorMessage = "Could not connect to your device. Ensure it is powered on and in range.";
        
        if (error instanceof Error) {
          if (error.name === "NotFoundError") {
            errorMessage = "Device not found. Make sure your Portable Health Monitor is powered on and in range.";
          } else if (error.name === "SecurityError") {
            errorMessage = "Security error. Ensure the page is served over HTTPS.";
          } else if (error.name === "NetworkError" || error.message?.includes("GATT")) {
            errorMessage = "Connection error. Please try again and ensure the device is in range.";
          } else if (error.name === "NotSupportedError") {
            errorMessage = "Bluetooth feature not supported by this device or browser.";
          }
        }
        
        if (retryCount === maxRetries) {
          toast({
            title: "Connection Failed",
            description: errorMessage,
            variant: "destructive",
          });
        } else {
          // Exponential backoff for retries
          const backoffTime = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
          await new Promise((resolve) => setTimeout(resolve, backoffTime));
          
          toast({
            title: "Retrying Connection",
            description: `Attempt ${retryCount + 1} of ${maxRetries}. Please wait...`,
          });
        }
      }
    }
  };

  // Disconnect from BLE device
  const disconnectFromDevice = () => {
    if (gattServer) {
      gattServer.disconnect();
      setIsConnected(false);
      setDevice(null);
      setGattServer(null);
      toast({
        title: "Disconnected",
        description: "Disconnected from Portable Health Monitor.",
      });
    }
  };

  // Validate glucose input
  const validateGlucoseInput = (type: string, value: string): boolean => {
    const numValue = Number(value);
    if (!value.trim()) {
      setInputError(t("glucoseInputEmpty"));
      return false;
    }
    if (isNaN(numValue)) {
      setInputError(t("glucoseInputInvalid"));
      return false;
    }
    if (numValue < 20 || numValue > 600) {
      setInputError(t("glucoseInputRange"));
      return false;
    }
    setInputError("");
    return true;
  };

  // Handle glucose submission
  const handleGlucoseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateGlucoseInput('glucose', glucoseValue)) return;
    
    try {
      // Store glucose reading in Firebase
      await storeHealthReading('glucose', Number(glucoseValue));
      
      // Also add to the glucose readings hook for chart display
      await addReading(Number(glucoseValue));
      
      setGlucoseValue("");
      
      toast({
        title: "Success",
        description: "Glucose reading submitted successfully",
      });
    } catch (error) {
      console.error("Error submitting glucose reading:", error);
      toast({
        title: "Error",
        description: "Failed to submit glucose reading",
        variant: "destructive",
      });
    }
  };

  // Render glucose chart
  const renderGlucoseChart = () => {
    if (hasError) {
      return (
        <div className="text-center py-8">
          <AlertCircle className="mx-auto mb-2 text-red-500" size={32} />
          <p className="text-muted-foreground">{t("glucoseLoadError")}</p>
          <p className="text-sm text-muted-foreground">{t("checkConnection")}</p>
        </div>
      );
    }
    if (isLoading) {
      return <div className="text-center py-8 animate-pulse">{t("loading")}</div>;
    }
    if (chartData.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground mb-2">{t("noGlucoseData")}</p>
          <p className="text-sm text-muted-foreground">{t("addFirstReading")}</p>
        </div>
      );
    }
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="time" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} domain={["dataMin - 20", "dataMax + 20"]} />
          <Tooltip
            formatter={(value: number) => [`${value} mg/dL`, t("glucoseLevel")]}
            labelFormatter={(label: string, payload: ChartDataPayload[]) =>
              payload[0]?.payload.formattedTime || label
            }
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#3f9142"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  // Render blood pressure chart
  const renderBloodPressureChart = () => {
    if (bloodPressureData.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">{t("noBloodPressureData")}</p>
          <p className="text-sm text-muted-foreground">{t("connectDevice")}</p>
        </div>
      );
    }
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={bloodPressureData}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="time" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="systolic"
            stroke="#0967d2"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="diastolic"
            stroke="#7cc4fa"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  // Render heart rate chart
  const renderHeartRateChart = () => {
    if (heartRateData.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">{t("noHeartRateData")}</p>
          <p className="text-sm text-muted-foreground">{t("connectDevice")}</p>
        </div>
      );
    }
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={heartRateData}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="time" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#e12d39"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  // Render temperature chart
  const renderTemperatureChart = () => {
    if (temperatureData.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">{t("noTemperatureData")}</p>
          <p className="text-sm text-muted-foreground">{t("connectDevice")}</p>
        </div>
      );
    }
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={temperatureData}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="time" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} domain={[36, 37.5]} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#f0b429"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  // Render oxygen saturation chart
  const renderOxygenSaturationChart = () => {
    if (oxygenSaturationData.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">{t("noOxygenSaturationData")}</p>
          <p className="text-sm text-muted-foreground">{t("connectDevice")}</p>
        </div>
      );
    }
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={oxygenSaturationData}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="time" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} domain={[95, 100]} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#47a3f3"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  // Render calories burned chart
  const renderCaloriesChart = () => {
    if (caloriesData.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">{t("noCaloriesData")}</p>
          <p className="text-sm text-muted-foreground">{t("connectDevice")}</p>
        </div>
      );
    }
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={caloriesData}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="time" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} domain={[0, "dataMax + 10"]} />
          <Tooltip formatter={(value: number) => [`${value.toFixed(1)} kcal`, t("caloriesBurned")]} />
          <Line
            type="monotone"
            dataKey="value"
            stroke="#ff6f00"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  return (
    <MainLayout>
      <div className="container p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-6">{t("readings")}</h1>

        {/* Glucose input and chart */}
        <Card className="p-4 mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Plus size={20} className="text-green-600" />
            {t("glucoseLevel")} - {t("realTimeTracking")}
          </h2>
          <form onSubmit={handleGlucoseSubmit} className="mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="glucose" className="text-sm font-medium">
                  {t("enterGlucose")} (mg/dL) *
                </Label>
                <Input
                  id="glucose"
                  type="number"
                  placeholder="e.g., 120"
                  value={glucoseValue}
                  onChange={(e) => {
                    setGlucoseValue(e.target.value);
                    if (inputError) setInputError("");
                  }}
                  min="20"
                  max="600"
                  step="1"
                  required
                  className={inputError ? "border-red-500" : ""}
                />
                {inputError && <p className="text-sm text-red-500 mt-1">{inputError}</p>}
              </div>
              <Button
                type="submit"
                disabled={isLoading || !glucoseValue.trim()}
                className="bg-green-600 hover:bg-green-700"
              >
                {isLoading ? t("adding") : t("addReading")}
              </Button>
            </div>
          </form>
          <div className="h-64">{renderGlucoseChart()}</div>
          {chartData.length > 0 && (
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>{t("latestReading")}:</strong> {chartData[chartData.length - 1]?.value} mg/dL
                <span className="ml-2">({chartData[chartData.length - 1]?.formattedTime})</span>
              </p>
              <p className="text-sm text-muted-foreground">
                <strong>{t("totalReadings")}:</strong> {chartData.length}
              </p>
              {predictionResult && (
                <p className="text-sm text-muted-foreground">
                  <strong>{t("diabetesPrediction")}:</strong> {predictionResult}
                </p>
              )}
            </div>
          )}
        </Card>

        {/* BLE connection controls */}
        <div className="mb-6">
          {isBluetoothAvailable ? (
            isAuthenticated ? (
              <div className="flex gap-4">
                <Button onClick={connectToDevice} disabled={isConnected}>
                  {isConnected ? t("connected") : t("connectDevice")}
                </Button>
                {isConnected && (
                  <Button onClick={disconnectFromDevice} variant="outline">
                    {t("disconnectDevice")}
                  </Button>
                )}
              </div>
            ) : (
              <p className="text-amber-500">{t("signInToConnect")}</p>
            )
          ) : (
            <p className="text-red-500">{t("bluetoothNotSupported")}</p>
          )}
        </div>

        {/* Blood pressure chart */}
        <Card className="p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">{t("bloodPressure")}</h2>
          <div className="h-64">{renderBloodPressureChart()}</div>
        </Card>

        {/* Heart rate chart */}
        <Card className="p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">{t("heartRate")}</h2>
          <div className="h-64">{renderHeartRateChart()}</div>
        </Card>

        {/* Temperature chart */}
        <Card className="p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">{t("temperature")}</h2>
          <div className="h-64">{renderTemperatureChart()}</div>
        </Card>

        {/* Oxygen saturation chart */}
        <Card className="p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">{t("oxygenSaturation")}</h2>
          <div className="h-64">{renderOxygenSaturationChart()}</div>
        </Card>

        {/* Calories burned chart */}
        <Card className="p-4 mb-6">
          <h2 className="text-lg font-semibold mb-2">{t("caloriesBurned")}</h2>
          <div className="h-64">{renderCaloriesChart()}</div>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Readings;