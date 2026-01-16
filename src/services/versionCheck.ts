import DeviceInfo from 'react-native-device-info';
import { Linking, Platform } from 'react-native';
import { api } from './api';

const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=co.targetboardboardprep&hl=en_IN&pli=1';

// TODO: Set to true when API endpoint is ready
// When enabled, the app will check for updates from the backend API
const ENABLE_VERSION_CHECK_API = false;

export interface VersionInfo {
  currentVersion: string;
  latestVersion: string;
  needsUpdate: boolean;
  isForceUpdate?: boolean;
  updateMessage?: string;
}

/**
 * Get current app version
 */
export const getCurrentVersion = async (): Promise<string> => {
  try {
    const version = await DeviceInfo.getVersion();
    return version;
  } catch (error) {
    if (__DEV__) {
      console.error('[VersionCheck] Error getting current version:', error);
    }
    // Fallback to package.json version
    return '0.0.1';
  }
};

/**
 * Get current app build number
 */
export const getCurrentBuildNumber = async (): Promise<string> => {
  try {
    const buildNumber = await DeviceInfo.getBuildNumber();
    return buildNumber;
  } catch (error) {
    if (__DEV__) {
      console.error('[VersionCheck] Error getting build number:', error);
    }
    return '1';
  }
};

/**
 * Fetch latest version from API
 * Uses the /app/version endpoint
 * Expected response: { version: string, isForceUpdate?: boolean, updateMessage?: string, minVersion?: string }
 * 
 * TODO: When API is ready, set ENABLE_VERSION_CHECK_API to true above
 */
export const fetchLatestVersion = async (): Promise<{ version: string; isForceUpdate?: boolean; updateMessage?: string } | null> => {
  // API is disabled for now - return null (no update needed)
  if (!ENABLE_VERSION_CHECK_API) {
    if (__DEV__) {
      console.log('[VersionCheck] API check is disabled. Set ENABLE_VERSION_CHECK_API to true when API is ready.');
    }
    return null;
  }

  try {
    // Fetch from API endpoint: GET /app/version
    // Expected response: { version: string, isForceUpdate?: boolean, updateMessage?: string, minVersion?: string }
    const response = await api.get<{ 
      version: string; 
      isForceUpdate?: boolean; 
      updateMessage?: string;
      minVersion?: string;
    }>('/app/version');
    
    if (response && response.version) {
      return {
        version: response.version,
        isForceUpdate: response.isForceUpdate || false,
        updateMessage: response.updateMessage,
      };
    }
    
    return null;
  } catch (error: any) {
    if (__DEV__) {
      console.warn('[VersionCheck] Could not fetch version from API:', error?.message);
      console.log('[VersionCheck] This is normal if the endpoint does not exist yet');
    }
    // Return null if API endpoint doesn't exist - version check will be skipped
    return null;
  }
};

/**
 * Compare two version strings
 * Returns: 1 if version1 > version2, -1 if version1 < version2, 0 if equal
 */
export const compareVersions = (version1: string, version2: string): number => {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);
  
  const maxLength = Math.max(v1Parts.length, v2Parts.length);
  
  for (let i = 0; i < maxLength; i++) {
    const v1Part = v1Parts[i] || 0;
    const v2Part = v2Parts[i] || 0;
    
    if (v1Part > v2Part) return 1;
    if (v1Part < v2Part) return -1;
  }
  
  return 0;
};

/**
 * Check if app needs update
 * 
 * NOTE: Currently API is disabled (ENABLE_VERSION_CHECK_API = false)
 * When API is disabled, this function returns null (no update alert shown)
 * 
 * To enable version checking:
 * 1. Set ENABLE_VERSION_CHECK_API to true at the top of this file
 * 2. Ensure your backend has the /app/version endpoint implemented
 * 3. The endpoint should return: { version: string, isForceUpdate?: boolean, updateMessage?: string }
 */
export const checkAppVersion = async (): Promise<VersionInfo | null> => {
  try {
    const currentVersion = await getCurrentVersion();
    
    if (__DEV__) {
      console.log('[VersionCheck] Current app version:', currentVersion);
    }
    
    // Try to fetch latest version from API (will return null if API is disabled)
    const latestVersionInfo = await fetchLatestVersion();
    
    if (!latestVersionInfo) {
      if (__DEV__) {
        console.log('[VersionCheck] No version info from API, skipping version check');
      }
      return null;
    }
    
    const latestVersion = latestVersionInfo.version;
    
    if (__DEV__) {
      console.log('[VersionCheck] Latest version from API:', latestVersion);
    }
    
    const comparison = compareVersions(currentVersion, latestVersion);
    const needsUpdate = comparison < 0;
    
    return {
      currentVersion,
      latestVersion,
      needsUpdate,
      isForceUpdate: latestVersionInfo.isForceUpdate || false,
      updateMessage: latestVersionInfo.updateMessage,
    };
  } catch (error: any) {
    if (__DEV__) {
      console.error('[VersionCheck] Error checking app version:', error);
    }
    return null;
  }
};

/**
 * Open Play Store for app update
 */
export const openPlayStore = async (): Promise<void> => {
  try {
    const url = Platform.OS === 'android' 
      ? `market://details?id=co.targetboardboardprep`
      : PLAY_STORE_URL;
    
    const canOpen = await Linking.canOpenURL(url);
    
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      // Fallback to web URL
      await Linking.openURL(PLAY_STORE_URL);
    }
  } catch (error) {
    if (__DEV__) {
      console.error('[VersionCheck] Error opening Play Store:', error);
    }
    // Try fallback URL
    try {
      await Linking.openURL(PLAY_STORE_URL);
    } catch (fallbackError) {
      if (__DEV__) {
        console.error('[VersionCheck] Error opening fallback URL:', fallbackError);
      }
    }
  }
};
