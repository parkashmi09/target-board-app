import Config from 'react-native-config';

// API Configuration
export const BASE_URL = Config.BASE_URL || '';
export const UPLOAD_URL = Config.UPLOAD_URL || '';
export const SOCKET_URL = Config.SOCKET_URL || '';

// Razorpay Configuration
// ⚠️ IMPORTANT: These values come from .env file
// Make sure to rotate keys if they were previously exposed
export const RAZORPAY_KEY_ID = Config.RAZORPAY_KEY_ID || '';
export const RAZORPAY_KEY_SECRET = Config.RAZORPAY_KEY_SECRET || '';

// Validate that required keys are present
if (__DEV__ && (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET)) {
  console.warn('[Config] Warning: Razorpay keys are missing from environment variables');
}

