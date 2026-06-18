const basePath = process.env.EXPO_PUBLIC_BASE_PATH || '';

export default {
  expo: {
    name: 'Airport Parking',
    slug: 'airport-parking',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    splash: {
      image: './assets/icon.png',
      resizeMode: 'contain',
      backgroundColor: '#F2F2F7',
    },
    scheme: 'airportparking',
    android: {
      package: 'com.airportparking.app',
      adaptiveIcon: {
        foregroundImage: './assets/icon.png',
        backgroundColor: '#000000',
      },
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './public/favicon.png',
      name: 'Airport Parking',
      shortName: 'Parking',
      description: 'Check vehicles in and out. Manage airport parking operations.',
      themeColor: '#F2F2F7',
      backgroundColor: '#F2F2F7',
      display: 'standalone',
      startUrl: '/',
      scope: '/',
      orientation: 'portrait',
      lang: 'en',
      preferRelatedApplications: false,
    },
    plugins: ['expo-router', 'expo-asset', 'expo-font'],
    experiments: {
      baseUrl: basePath,
    },
    extra: {
      apiUrl: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3001',
    },
  },
};
