import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * App-wide State Store (Zustand)
 * 
 * Manages application-level state:
 * - App settings
 * - User preferences
 * - Notification settings
 * - Download preferences
 * - App version info
 */

interface AppState {
  // App settings
  isFirstLaunch: boolean;
  appVersion: string;
  lastUpdateCheck: number | null;
  
  // User preferences
  autoPlayVideos: boolean;
  downloadQuality: 'low' | 'medium' | 'high';
  notificationsEnabled: boolean;
  darkModeEnabled: boolean | null; // null = system default
  
  // Download settings
  downloadOverWifiOnly: boolean;
  autoDownloadUpdates: boolean;
  
  // Performance settings
  imageQuality: 'low' | 'medium' | 'high';
  videoQuality: 'low' | 'medium' | 'high';
  
  // Actions
  setFirstLaunch: (value: boolean) => void;
  setAppVersion: (version: string) => void;
  setLastUpdateCheck: (timestamp: number) => void;
  setAutoPlayVideos: (enabled: boolean) => void;
  setDownloadQuality: (quality: 'low' | 'medium' | 'high') => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  setDarkModeEnabled: (enabled: boolean | null) => void;
  setDownloadOverWifiOnly: (enabled: boolean) => void;
  setAutoDownloadUpdates: (enabled: boolean) => void;
  setImageQuality: (quality: 'low' | 'medium' | 'high') => void;
  setVideoQuality: (quality: 'low' | 'medium' | 'high') => void;
  resetSettings: () => void;
}

const initialState = {
  isFirstLaunch: true,
  appVersion: '0.0.1',
  lastUpdateCheck: null,
  autoPlayVideos: true,
  downloadQuality: 'medium' as const,
  notificationsEnabled: true,
  darkModeEnabled: null,
  downloadOverWifiOnly: true,
  autoDownloadUpdates: false,
  imageQuality: 'medium' as const,
  videoQuality: 'medium' as const,
};

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      ...initialState,
      
      // Actions
      setFirstLaunch: (value) => set({ isFirstLaunch: value }),
      setAppVersion: (version) => set({ appVersion: version }),
      setLastUpdateCheck: (timestamp) => set({ lastUpdateCheck: timestamp }),
      setAutoPlayVideos: (enabled) => set({ autoPlayVideos: enabled }),
      setDownloadQuality: (quality) => set({ downloadQuality: quality }),
      setNotificationsEnabled: (enabled) => set({ notificationsEnabled: enabled }),
      setDarkModeEnabled: (enabled) => set({ darkModeEnabled: enabled }),
      setDownloadOverWifiOnly: (enabled) => set({ downloadOverWifiOnly: enabled }),
      setAutoDownloadUpdates: (enabled) => set({ autoDownloadUpdates: enabled }),
      setImageQuality: (quality) => set({ imageQuality: quality }),
      setVideoQuality: (quality) => set({ videoQuality: quality }),
      resetSettings: () => set(initialState),
    }),
    {
      name: 'app-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Persist all settings
    }
  )
);

