import { request } from './api';

export interface PlaceResult {
  label: string;
  coordinates: [number, number];
  address?: string;
  municipality?: string;
  region?: string;
  country?: string;
  distance?: number;
}

export interface RouteLeg {
  distance: number;
  durationSeconds: number;
  startPosition: [number, number];
  endPosition: [number, number];
  geometry?: [number, number][];
  steps?: RouteStep[];
}

export interface RouteStep {
  distance: number;
  durationSeconds: number;
  startPosition: [number, number];
  endPosition: [number, number];
  geometry?: [number, number][];
  travelMode?: string;
  instruction?: string;
}

export interface RouteResult {
  distance: number;
  durationSeconds: number;
  legs: RouteLeg[];
  geometry: [number, number][];
}

export interface GeofenceEntry {
  geofenceId: string;
  geometry: { polygon: [[number, number][]] };
  status?: string;
}

export const locationApi = {
  searchPlaces: (text: string, biasPosition?: [number, number], maxResults = 10) =>
    request('/location/search', {
      method: 'POST',
      body: { text, biasPosition, maxResults },
    }),

  searchNearby: (position: [number, number], maxResults = 10) =>
    request('/location/search/nearby', {
      method: 'POST',
      body: { position, maxResults },
    }),

  calculateRoute: (
    departurePosition: [number, number],
    destinationPosition: [number, number],
    travelMode: 'Car' | 'Truck' | 'Walking' | 'Bicycle' | 'Motorcycle' = 'Car'
  ) =>
    request('/location/route', {
      method: 'POST',
      body: { departurePosition, destinationPosition, travelMode },
    }),

  evaluateGeofence: (position: [number, number], deviceId?: string) =>
    request('/location/geofence/evaluate', {
      method: 'POST',
      body: { position, deviceId },
    }),

  createGeofence: (geofenceId: string, geometry: { polygon: [[number, number][]] }) =>
    request('/location/geofence', {
      method: 'POST',
      body: { geofenceId, geometry },
    }),

  deleteGeofence: (geofenceId: string) =>
    request(`/location/geofence/${geofenceId}`, { method: 'DELETE' }),

  listGeofences: () => request('/location/geofences'),

  updateDevicePosition: (deviceId: string, position: [number, number]) =>
    request('/location/tracker/position', {
      method: 'POST',
      body: { deviceId, position },
    }),

  getDevicePosition: (deviceId: string) =>
    request(`/location/tracker/position/${deviceId}`),
};
