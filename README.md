VitalSync Health Hub
An integrated health monitoring platform combining a portable wearable device, a responsive web dashboard, and a fully featured mobile application.

📝 Project Overview
VitalSync Health Hub is a comprehensive patient-care ecosystem developed to empower users with real-time health monitoring and personalized insights. The project consists of:

Portable Wearable Device: A custom-built wearable that measures:
Blood pressure
Heart rate
Oxygen saturation
Body temperature
Calorie burn


Web Dashboard: A React-based application displaying live device readings and detailed user reports.
Mobile App: A React Native (Expo) application offering:
Introduction & Authentication: Multiple sign-up and login options (email/OTP).
Home Screen: Personalized welcome with patient details.
Chats: Persistent support and guidance interface.
Reports: Daily health summaries, interactive charts, and notifications.
Device Readings: Real-time wearable data visualization.
Reminders: Medication and test schedule alerts.
Settings: Profile management, theme selection, text-to-speech, and voice assistant options.




🚀 Getting Started
Prerequisites
Ensure you have the following installed:

Node.js (>=16.x)
npm (>=8.x)
nvm (optional, for Node version management)

Installation
If you have the project locally:
cd "C:/Users/ENGBa/Downloads/Compressed/MobileApp-main/MobileApp-main"
npm install

To clone a fresh copy:
git clone https://github.com/Bavly-Hamdy/MobileApp.git
cd MobileApp
npm install

Running in Development
Run the web dashboard and mobile app concurrently:
# Web (Vite)
npm run dev:web

# Mobile (Expo)
npm run dev:mobile


📤 Publishing to GitHub
To upload the project to GitHub, run these commands in the project root:
# Initialize git (if not already initialized)
git init

# Add all files and commit
git add .
git commit -m "Initial project upload: web, mobile, device firmware, docs"

# Link to GitHub repository and push
git remote add origin https://github.com/Bavly-Hamdy/MobileApp.git
git branch -M main
git push -u origin main


Note: Replace main with master if your default branch is different.


🔧 Architecture & Tech Stack

Front-end: TypeScript, React, React Native (Expo)
Build Tools: Vite (web)
Styling: Tailwind CSS, shadcn-ui
Backend: Firebase Authentication & Realtime Database
Hardware: MAX30100, MLX90614, AD8232, MPU6050, custom MCU firmware


🌟 Key Features

Real-Time Health Monitoring: Seamless data streaming from the wearable device.
Interactive Web Dashboard: Live data visualization and detailed health reports.
Cross-Platform Mobile App: Comprehensive features with reminders and summaries.
Voice & Accessibility: Text-to-speech and voice assistant for enhanced usability.
Persistent Chats: Continuous support and guidance interface.


👥 Team Members & Roles

Bavly Hamdy (Full Stack Developer)
Front-end development (Web & Mobile)
Device data integration
UI/UX enhancements


Eyad Mahmoud (Backend Engineer)
Firebase Authentication & Database
API integration & CI/CD pipelines


Yehia Mohamed (Data & Analytics Engineer)
Data processing & visualization
Interactive chart development & reports




📂 Folder Structure
vital-sync-health-hub/
├── src/              # Source files for the web app
│   ├── api/          # API-related files (e.g., geminiClient.ts, types.ts)
│   ├── components/   # Reusable UI components (e.g., chatbot, layout, signup)
│   ├── contexts/     # React context for state management (e.g., AppContext.tsx)
│   ├── hooks/        # Custom React hooks (e.g., use-mobile.tsx, useUserProfile.ts)
│   ├── lib/          # Utility functions (e.g., firebase.ts, utils.ts)
│   ├── pages/        # Page components (e.g., Home.tsx, SignIn.tsx)
│   └── services/     # Service files (e.g., firebaseService.ts, pdfExportService.ts)
├── public/           # Static assets (e.g., favicon.ico, manifest.json)
├── dist/             # Build output
└── node_modules/     # Project dependencies


Note: The web/ folder structure above reflects the current project directory. The mobile/, device/, and docs/ folders are part of the full project but may reside in a parent directory or separate repository.


📄 License
This project is licensed under the MIT License. See the LICENSE file for details.

Built with ❤️ by the VitalSync Health Hub Team
