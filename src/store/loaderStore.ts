import { create } from 'zustand';

/**
 * Global Loader Store (Zustand)
 * 
 * Manages global loading state efficiently:
 * - Tracks multiple loading operations
 * - Shows loader when APIs fire up
 * - Shows loader on tab/page switches
 * - Uses counter pattern for multiple simultaneous loads
 */

interface LoaderState {
  // Counter for active loading operations
  loadingCount: number;
  // Whether loader is currently visible
  isVisible: boolean;
  // Optional message to display
  message: string | null;
  
  // Actions
  show: (message?: string) => void;
  hide: () => void;
  reset: () => void;
  forceHide: () => void;
}

export const useLoaderStore = create<LoaderState>((set, get) => ({
  loadingCount: 0,
  isVisible: false,
  message: null,
  
  show: (message) => {
    const currentCount = get().loadingCount;
    set({
      loadingCount: currentCount + 1,
      isVisible: true,
      message: message || null,
    });
  },
  
  hide: () => {
    const currentCount = get().loadingCount;
    const newCount = Math.max(0, currentCount - 1);
    set({
      loadingCount: newCount,
      isVisible: newCount > 0,
      message: newCount === 0 ? null : get().message,
    });
  },
  
  // Force hide - immediately hide loader regardless of count
  forceHide: () => {
    set({
      loadingCount: 0,
      isVisible: false,
      message: null,
    });
  },
  
  reset: () => {
    set({
      loadingCount: 0,
      isVisible: false,
      message: null,
    });
  },
}));

