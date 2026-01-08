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
      set({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        isWifi: state.type === 'wifi',
        isCellular: state.type === 'cellular',
        isEthernet: state.type === 'ethernet',
        isUnknown: state.type === 'unknown' || state.type === 'none',
      });
    } catch (error) {
      if (__DEV__) {
        console.error('[NetworkStore] Error checking connection:', error);
      }
      // On error, assume offline to be safe
      set({
        isConnected: false,
        isInternetReachable: false,
        isUnknown: true,
      });
    }
  },

  initialize: () => {
    // Initial check
    get().checkConnection();

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      set({
        isConnected: state.isConnected ?? false,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        isWifi: state.type === 'wifi',
        isCellular: state.type === 'cellular',
        isEthernet: state.type === 'ethernet',
        isUnknown: state.type === 'unknown' || state.type === 'none',
      });

      if (__DEV__) {
        console.log('[NetworkStore] Network state changed:', {
          isConnected: state.isConnected,
          isInternetReachable: state.isInternetReachable,
          type: state.type,
        });
      }
    });

    // Return cleanup function (though Zustand doesn't use it directly)
    // The subscription will be active for the app lifetime
    return unsubscribe;
  },
}));

