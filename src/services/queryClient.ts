import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * QueryClient configuration for React Query
 * 
 * Features:
 * - Smart caching with different stale times
 * - Network-aware refetching
 * - Optimized retry strategies
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Cache times - Optimized for offline support
      staleTime: 10 * 60 * 1000, // Default: 10 minutes (increased for better offline support)
      gcTime: 60 * 60 * 1000, // Keep in memory for 1 hour (increased for offline access)
      
      // Retry strategy
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // Retry up to 2 times for server errors
        return failureCount < 2;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
      
      // Network-aware refetching
      refetchOnWindowFocus: false, // Disable for mobile
      refetchOnReconnect: true, // Refetch when connection restored
      refetchOnMount: true, // Refetch on mount (can be overridden per query)
      
      // Network-aware: Allow queries even when offline (will use cache)
      networkMode: 'offlineFirst', // Try cache first, then network when available
    },
    mutations: {
      retry: 1, // Retry mutations once
      retryDelay: 1000,
      networkMode: 'online',
    },
  },
});


