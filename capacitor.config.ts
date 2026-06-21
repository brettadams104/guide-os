import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.ethicaledge.guidestride',
  appName: 'GuideStride',
  webDir: 'public',
  server: {
    url: 'https://app.guidestride.com',
    cleartext: false,
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0f1f35',
  },
  plugins: {
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0f1f35',
    },
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#0f1f35',
      showSpinner: false,
    },
  },
}

export default config
