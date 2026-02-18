// import Constants from 'expo-constants';

// const ENV = {
//     development: {
//         API_URL: 'http://localhost:4000/api',
//     },
//     staging: {
//         API_URL: 'https://staging-api.foodie-spot.com/api',
//     },
//     production: {
//         API_URL: 'https://api.foodie-spot.com/api',
//     },
// };

// const getEnvVars = () => {
//     const releaseChannel = Constants.expoConfig?.extra?.releaseChannel || 'development';
//     if (releaseChannel === 'production') {
//         return ENV.production;
//     } else if (releaseChannel === 'staging') {
//         return ENV.staging;
//     } else {
//         return ENV.development; 
//     }
// };

// export default getEnvVars();

// constants/config.ts

const config = {
  // Pour iOS Simulator
  apiUrl: 'http://localhost:4000',
  
  // Pour Android Emulator - DÉCOMMENTE CETTE LIGNE
  // apiUrl: 'http://10.0.2.2:4000',
  
  // Pour device physique - utilise ton IP locale
  // apiUrl: 'http://192.168.1.XX:4000',
};

export default config;