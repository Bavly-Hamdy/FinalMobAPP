
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.802b575e0bbe49d2876481a489dfac96',
  appName: 'vital-sync-health-hub',
  webDir: 'dist',
  server: {
    url: 'https://802b575e-0bbe-49d2-8764-81a489dfac96.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#ffffff',
      showSpinner: false
    }
  }
};

export default config;
