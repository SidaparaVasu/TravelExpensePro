import { create } from 'zustand';
import { travelAPI } from '@/src/api/travel';
import { TravelApplication, TravelStats, Location, TravelMode, GLCode } from '@/src/types/travel.types';

interface TravelState {
  applications: TravelApplication[];
  stats: TravelStats | null;
  locations: Location[];
  travelModes: TravelMode[];
  glCodes: GLCode[];
  isLoading: boolean;
  guestHouses: any[];
  arcHotels: any[];

  loadApplications: (filter: string) => Promise<void>;
  loadStats: () => Promise<void>;
  loadMasterData: () => Promise<void>;
  loadGuestHouses: () => Promise<void>;
  loadARCHotels: () => Promise<void>;
  createApplication: (data: any) => Promise<TravelApplication>;
  submitApplication: (id: number) => Promise<void>;
  deleteApplication: (id: number) => Promise<void>;
}

export const useTravelStore = create<TravelState>((set, get) => ({
  applications: [],
  stats: null,
  locations: [],
  travelModes: [],
  glCodes: [],
  isLoading: false,
  guestHouses: [],
  arcHotels: [],


  loadGuestHouses: async () => {
    const data = await travelAPI.getGuestHouses();
    set({ guestHouses: data });
  },

  loadARCHotels: async () => {
    const data = await travelAPI.getARCHotels();
    set({ arcHotels: data });
  },

  loadApplications: async (filter: string) => {
    set({ isLoading: true });
    try {
      const fetched_applications = await travelAPI.getMyApplications(filter);
      const applications = fetched_applications.recent_applications
      const stats = fetched_applications.statistics;
      set({ applications, isLoading: false });
      set({ stats });
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  loadStats: async () => {
    try {
      const stats = await travelAPI.getStats();
      set({ stats });
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  },

  loadMasterData: async () => {
    try {
      const [locations, travelModes, glCodes] = await Promise.all([
        travelAPI.getLocations(),
        travelAPI.getTravelModes(),
        travelAPI.getGLCodes(),
      ]);
      set({ locations, travelModes, glCodes });
    } catch (error) {
      console.error('Failed to load master data:', error);
    }
  },

  createApplication: async (data) => {
    const application = await travelAPI.createApplication(data);
    set({ applications: [application, ...get().applications] });
    return application;
  },

  submitApplication: async (id) => {
    await travelAPI.submitApplication(id);
    await get().loadApplications();
  },

  deleteApplication: async (id) => {
    await travelAPI.deleteApplication(id);
    set({ applications: get().applications.filter(app => app.id !== id) });
  },
}));