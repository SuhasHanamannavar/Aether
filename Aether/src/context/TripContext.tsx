import React, { createContext, useContext, useState } from 'react';
import type { TransportMode } from '../components/TransportBar';

interface TripData {
  tripId: string | null;
  destination: string | null;
  vibeTags: string[];
  budget: number | null;
  dateStart: string | null;
  dateEnd: string | null;
  archetype: string | null;
  transportMode: TransportMode;
  diyBooking: boolean;
  status: string;
}

interface TripContextValue {
  trip: TripData;
  setTripId: (id: string | null) => void;
  setDestination: (d: string | null) => void;
  setVibeTags: (tags: string[]) => void;
  setBudget: (b: number | null) => void;
  setDateStart: (d: string | null) => void;
  setDateEnd: (d: string | null) => void;
  setArchetype: (a: string | null) => void;
  setTransportMode: (m: TransportMode) => void;
  setDiyBooking: (v: boolean) => void;
  setStatus: (s: string) => void;
  resetTrip: () => void;
}

const defaultTrip: TripData = {
  tripId: null,
  destination: null,
  vibeTags: [],
  budget: null,
  dateStart: null,
  dateEnd: null,
  archetype: null,
  transportMode: 'fly',
  diyBooking: false,
  status: 'draft',
};

const TripContext = createContext<TripContextValue>({
  trip: defaultTrip,
  setTripId: () => {},
  setDestination: () => {},
  setVibeTags: () => {},
  setBudget: () => {},
  setDateStart: () => {},
  setDateEnd: () => {},
  setArchetype: () => {},
  setTransportMode: () => {},
  setDiyBooking: () => {},
  setStatus: () => {},
  resetTrip: () => {},
});

export function TripProvider({ children }: { children: React.ReactNode }) {
  const [trip, setTrip] = useState<TripData>(defaultTrip);

  const setTripId = (tripId: string | null) => setTrip(prev => ({ ...prev, tripId }));
  const setDestination = (destination: string | null) => setTrip(prev => ({ ...prev, destination }));
  const setVibeTags = (vibeTags: string[]) => setTrip(prev => ({ ...prev, vibeTags }));
  const setBudget = (budget: number | null) => setTrip(prev => ({ ...prev, budget }));
  const setDateStart = (dateStart: string | null) => setTrip(prev => ({ ...prev, dateStart }));
  const setDateEnd = (dateEnd: string | null) => setTrip(prev => ({ ...prev, dateEnd }));
  const setArchetype = (archetype: string | null) => setTrip(prev => ({ ...prev, archetype }));
  const setTransportMode = (transportMode: TransportMode) => setTrip(prev => ({ ...prev, transportMode }));
  const setDiyBooking = (diyBooking: boolean) => setTrip(prev => ({ ...prev, diyBooking }));
  const setStatus = (status: string) => setTrip(prev => ({ ...prev, status }));
  const resetTrip = () => setTrip(defaultTrip);

  return (
    <TripContext.Provider
      value={{
        trip,
        setTripId,
        setDestination,
        setVibeTags,
        setBudget,
        setDateStart,
        setDateEnd,
        setArchetype,
        setTransportMode,
        setDiyBooking,
        setStatus,
        resetTrip,
      }}
    >
      {children}
    </TripContext.Provider>
  );
}

export function useTrip() {
  return useContext(TripContext);
}
