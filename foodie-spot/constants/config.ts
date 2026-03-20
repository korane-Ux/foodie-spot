import Constants from 'expo-constants';

// ============================================================
// Configuration de l'URL de l'API
// ------------------------------------------------------------
// IMPORTANT : si tu testes sur un appareil physique ou simulateur,
// remplace l'IP ci-dessous par l'IP de ta machine sur le réseau local.
//
// Pour trouver ton IP :
//   - Mac/Linux : ifconfig | grep "inet " (dans Terminal)
//   - Windows   : ipconfig (cherche "Adresse IPv4")
//
// Exemple : 'http://192.168.1.42:4000/'
// ============================================================

// Change juste cette ligne avec ton IP locale !
const LOCAL_IP = '192.168.1.165'; // <-- MODIFIER ICI avec votre IP

const ENV = {
  development: {
    API_URL: `http://${LOCAL_IP}:4000/`,
  },
  staging: {
    API_URL: 'https://staging-api.foodie-spot.com/api',
  },
  production: {
    API_URL: 'https://api.foodie-spot.com/api',
  },
};

const getEnvVars = () => {
  const releaseChannel = Constants.expoConfig?.extra?.releaseChannel || 'development';
  if (releaseChannel === 'production') return ENV.production;
  if (releaseChannel === 'staging') return ENV.staging;
  return ENV.development;
};

export default getEnvVars();
