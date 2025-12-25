/**
 * Authentication Store (Zustand)
 * 
 * Manages user authentication state
 */

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthState {
  isLoggedIn: boolean;
  login: () => void;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  setFirstTimeVisited: () => Promise<void>;
  getFirstTimeVisited: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set) => ({
  isLoggedIn: false,

  checkAuthStatus: async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userDataStr = await AsyncStorage.getItem('userData');
      
      if (__DEV__) {
        if (token) {
          console.log('🔑 Token found');
        }
        if (userDataStr) {
          try {
            const userData = JSON.parse(userDataStr);
            console.log('👤 User data:', userData);
          } catch (e) {
            // Invalid JSON, skip logging
          }
        }
      }
      
      set({ isLoggedIn: !!token });
    } catch (error) {
      set({ isLoggedIn: false });
    }
  },

  login: () => {
    set({ isLoggedIn: true });
  },

  logout: async () => {
    try {
      // Clear AsyncStorage but keep firstTimeVisited
      await AsyncStorage.multiRemove(['token', 'userData', 'userId', 'fcmToken']);
      
      // Small delay to ensure state is properly reset
      await new Promise(resolve => setTimeout(resolve, 100));
      
      set({ isLoggedIn: false });
    } catch (error) {
      // Silent error handling
      set({ isLoggedIn: false });
    }
  },

  setFirstTimeVisited: async () => {
    try {
      await AsyncStorage.setItem('firstTimeVisited', 'true');
    } catch (error) {
      // Silent error handling
    }
  },

  getFirstTimeVisited: async () => {
    try {
      const visited = await AsyncStorage.getItem('firstTimeVisited');
      return visited === 'true';
    } catch (error) {
      return false;
    }
  },
}));

