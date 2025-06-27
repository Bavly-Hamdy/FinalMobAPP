
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initializeAnalytics } from './lib/firebase'

// Initialize Firebase Analytics
initializeAnalytics().then((analytics) => {
  if (analytics) {
    console.log('Firebase Analytics initialized successfully');
  }
}).catch((error) => {
  console.warn('Firebase Analytics initialization failed:', error);
});

// Initialize the app with proper React 18 createRoot API
const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Enhanced Service Worker registration with error handling
if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/service-worker.js");
      console.log("PWA: ServiceWorker registered successfully:", registration.scope);
      
      // Listen for updates
      registration.addEventListener('updatefound', () => {
        console.log('PWA: New service worker version available');
      });
    } catch (error) {
      console.error("PWA: ServiceWorker registration failed:", error);
    }
  });
}

