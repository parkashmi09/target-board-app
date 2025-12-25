import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * UI State Store (Zustand)
 * 
 * Manages client-side UI state that doesn't need server synchronization:
 * - Tab selections
 * - Modal visibility
 * - Filters
 * - UI preferences
 * - Theme preferences (if not in theme context)
 */

interface UIState {
  // Tab states
  activeHomeTab: 'all' | 'live' | 'notes';
  activeCourseTab: string | null;
  
  // Modal states
  isVideoPlayerOpen: boolean;
  isLiveStreamModalOpen: boolean;
  isDrawerOpen: boolean;
  
  // Filters
  courseFilters: {
    categoryId?: number;
    searchQuery?: string;
    sortBy?: 'latest' | 'popular' | 'rating';
  };
  notesFilters: {
    subjectId?: number;
    searchQuery?: string;
  };
  
  // UI preferences
  showOfflineBanner: boolean;
  lastSyncTime: number | null;
  
  // Actions
  setActiveHomeTab: (tab: 'all' | 'live' | 'notes') => void;
  setActiveCourseTab: (tab: string | null) => void;
  setVideoPlayerOpen: (open: boolean) => void;
  setLiveStreamModalOpen: (open: boolean) => void;
  setDrawerOpen: (open: boolean) => void;
  setCourseFilters: (filters: Partial<UIState['courseFilters']>) => void;
  setNotesFilters: (filters: Partial<UIState['notesFilters']>) => void;
  setShowOfflineBanner: (show: boolean) => void;
  setLastSyncTime: (time: number) => void;
  resetFilters: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Initial state
      activeHomeTab: 'all',
      activeCourseTab: null,
      isVideoPlayerOpen: false,
      isLiveStreamModalOpen: false,
      isDrawerOpen: false,
      courseFilters: {},
      notesFilters: {},
      showOfflineBanner: false,
      lastSyncTime: null,
      
      // Actions
      setActiveHomeTab: (tab) => set({ activeHomeTab: tab }),
      setActiveCourseTab: (tab) => set({ activeCourseTab: tab }),
      setVideoPlayerOpen: (open) => set({ isVideoPlayerOpen: open }),
      setLiveStreamModalOpen: (open) => set({ isLiveStreamModalOpen: open }),
      setDrawerOpen: (open) => set({ isDrawerOpen: open }),
      setCourseFilters: (filters) =>
        set((state) => ({
          courseFilters: { ...state.courseFilters, ...filters },
        })),
      setNotesFilters: (filters) =>
        set((state) => ({
          notesFilters: { ...state.notesFilters, ...filters },
        })),
      setShowOfflineBanner: (show) => set({ showOfflineBanner: show }),
      setLastSyncTime: (time) => set({ lastSyncTime: time }),
      resetFilters: () =>
        set({
          courseFilters: {},
          notesFilters: {},
        }),
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist certain fields
      partialize: (state) => ({
        activeHomeTab: state.activeHomeTab,
        activeCourseTab: state.activeCourseTab,
        courseFilters: state.courseFilters,
        notesFilters: state.notesFilters,
        lastSyncTime: state.lastSyncTime,
      }),
    }
  )
);

