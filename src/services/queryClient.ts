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
      // Cache times
      staleTime: 5 * 60 * 1000, // Default: 5 minutes
      gcTime: 30 * 60 * 1000, // Keep in memory for 30 minutes
      
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
      
      // Network timeout
      networkMode: 'online', // Only run queries when online
    },
    mutations: {
      retry: 1, // Retry mutations once
      retryDelay: 1000,
      networkMode: 'online',
    },
  },
});


