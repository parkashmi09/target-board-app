/**
 * Network Status Store (Zustand)
 * 
 * Manages network connectivity state
 */

import { create } from 'zustand';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

interface NetworkState {
  isConnected: boolean;
  isInternetReachable: boolean | null;
  type: string | null;
  isWifi: boolean;
  isCellular: boolean;
  isEthernet: boolean;
  isUnknown: boolean;
  checkConnection: () => Promise<void>;
  initialize: () => void;
}

export const useNetworkStore = create<NetworkState>((set, get) => ({
  isConnected: true, // Optimistic default
  isInternetReachable: true,
  type: null,
  isWifi: false,
  isCellular: false,
  isEthernet: false,
  isUnknown: true,

  checkConnection: async () => {
    try {
      const state = await NetInfo.fetch();
      
      // In dev mode (emulator), be more lenient with network detection
      // Emulators often report isInternetReachable as null even when ADB reverse is set up
      const isDevMode = __DEV__;
      const isConnectedValue = state.isConnected ?? false;
      const isInternetReachableValue = state.isInternetReachable;
      
      // In dev mode, if connected but isInternetReachable is null, assume it's reachable
      // This handles the case where ADB reverse is set up but NetInfo can't detect it
      const finalIsInternetReachable = isDevMode && isConnectedValue && isInternetReachableValue === null
        ? true
        : isInternetReachableValue;
      
      set({
        isConnected: isConnectedValue,
        isInternetReachable: finalIsInternetReachable,
        type: state.type,
        isWifi: state.type === 'wifi',
        isCellular: state.type === 'cellular',
        isEthernet: state.type === 'ethernet',
        isUnknown: state.type === 'unknown' || state.type === 'none',
      });
      
      if (__DEV__) {
        console.log('[NetworkStore] Network state:', {
          isConnected: isConnectedValue,
          isInternetReachable: finalIsInternetReachable,
          originalIsInternetReachable: isInternetReachableValue,
          type: state.type,
          isDevMode,
        });
      }
    } catch (error) {
      if (__DEV__) {
        console.error('[NetworkStore] Error checking connection:', error);
        // In dev mode, don't assume offline on error - might be a NetInfo issue
        set({
          isConnected: true, // Optimistic for dev mode
          isInternetReachable: true,
          isUnknown: true,
        });
      } else {
        // On error in production, assume offline to be safe
        set({
          isConnected: false,
          isInternetReachable: false,
          isUnknown: true,
        });
      }
    }
  },

  initialize: () => {
    // Initial check
    get().checkConnection();

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      // In dev mode (emulator), be more lenient with network detection
      const isDevMode = __DEV__;
      const isConnectedValue = state.isConnected ?? false;
      const isInternetReachableValue = state.isInternetReachable;
      
      // In dev mode, if connected but isInternetReachable is null, assume it's reachable
      const finalIsInternetReachable = isDevMode && isConnectedValue && isInternetReachableValue === null
        ? true
        : isInternetReachableValue;
      
      set({
        isConnected: isConnectedValue,
        isInternetReachable: finalIsInternetReachable,
        type: state.type,
        isWifi: state.type === 'wifi',
        isCellular: state.type === 'cellular',
        isEthernet: state.type === 'ethernet',
        isUnknown: state.type === 'unknown' || state.type === 'none',
      });

      if (__DEV__) {
        console.log('[NetworkStore] Network state changed:', {
          isConnected: isConnectedValue,
          isInternetReachable: finalIsInternetReachable,
          originalIsInternetReachable: isInternetReachableValue,
          type: state.type,
          isDevMode,
        });
      }
    });

    // Return cleanup function (though Zustand doesn't use it directly)
    // The subscription will be active for the app lifetime
    return unsubscribe;
  },
}));

