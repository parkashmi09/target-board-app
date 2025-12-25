/**
 * Registration Data Store
 * Stores all registration-related data (states, cities, classes, state boards)
 * to avoid repeated API calls across registration steps
 */

import { create } from 'zustand';
import { fetchStates, fetchCities, fetchClasses, fetchStateBoards } from '../services/api';

interface State {
  id: number;
  state_name: string;
}

interface City {
  id: number;
  city_name: string;
}

interface Class {
  _id: string;
  name: string;
  __v?: number;
}

interface StateBoard {
  _id: string;
  name: string;
  logo?: string;
  description?: string;
}

interface RegistrationDataState {
  states: State[];
  cities: { [stateId: string]: City[] };
  classes: Class[];
  stateBoards: StateBoard[];
  isLoading: boolean;
  isLoaded: boolean;
  error: string | null;
  
  // Actions
  loadAllData: () => Promise<void>;
  loadCitiesForState: (stateId: string | number) => Promise<void>;
  clearData: () => void;
}

export const useRegistrationDataStore = create<RegistrationDataState>((set, get) => ({
  states: [],
  cities: {},
  classes: [],
  stateBoards: [],
  isLoading: false,
  isLoaded: false,
  error: null,

  loadAllData: async () => {
    // If already loaded, don't reload
    if (get().isLoaded && !get().error) {
      return;
    }

    set({ isLoading: true, error: null });
    
    try {
      // Only fetch classes and stateBoards - states endpoint may not exist
      const [classesData, stateBoardsData] = await Promise.all([
        fetchClasses(),
        fetchStateBoards(),
      ]);

      set({
        classes: classesData || [],
        stateBoards: stateBoardsData || [],
        isLoading: false,
        isLoaded: true,
        error: null,
      });
    } catch (error: any) {
      console.error('Error loading registration data:', error);
      set({
        isLoading: false,
        isLoaded: false,
        error: error?.message || 'Failed to load registration data',
      });
    }
  },

  loadCitiesForState: async (stateId: string | number) => {
    const stateIdStr = String(stateId);
    
    // If cities for this state are already loaded, don't reload
    if (get().cities[stateIdStr]) {
      return;
    }

    try {
      const citiesData = await fetchCities(stateId);
      set((state) => ({
        cities: {
          ...state.cities,
          [stateIdStr]: citiesData || [],
        },
      }));
    } catch (error: any) {
      console.error(`Error loading cities for state ${stateId}:`, error);
      // Don't set error state, just log it
    }
  },

  clearData: () => {
    set({
      states: [],
      cities: {},
      classes: [],
      stateBoards: [],
      isLoading: false,
      isLoaded: false,
      error: null,
    });
  },
}));

