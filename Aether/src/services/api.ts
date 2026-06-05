import { config } from '../constants/config';

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  auth?: boolean;
}

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

async function request(endpoint: string, options: RequestOptions = {}) {
  const { method = 'GET', body, headers = {}, auth = true } = options;

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (auth && accessToken) {
    reqHeaders['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${config.apiBaseUrl}${endpoint}`, {
    method,
    headers: reqHeaders,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || `API error: ${response.status}`);
  }

  return data;
}

// --- Auth API ---
export const authApi = {
  signUp: (email: string, password: string, givenName?: string, familyName?: string) =>
    request('/auth/signup', {
      method: 'POST',
      auth: false,
      body: { email, password, givenName, familyName },
    }),

  confirmSignUp: (email: string, code: string) =>
    request('/auth/confirm', {
      method: 'POST',
      auth: false,
      body: { email, code },
    }),

  login: (email: string, password: string) =>
    request('/auth/login', {
      method: 'POST',
      auth: false,
      body: { email, password },
    }),
};

// --- Users API ---
export const usersApi = {
  create: (data: { email: string; travelerType?: string; preferences?: any }) =>
    request('/users', { method: 'POST', body: data }),

  get: (userId: string) => request(`/users/${userId}`),

  update: (userId: string, data: any) =>
    request(`/users/${userId}`, { method: 'PUT', body: data }),

  updateIntegrations: (userId: string, integrations: any) =>
    request(`/users/${userId}/integrations`, { method: 'PUT', body: { integrations } }),
};

// --- Trips API ---
export const tripsApi = {
  create: (data: {
    destination?: string;
    vibeTags?: string[];
    budget?: number;
    dateStart?: string;
    dateEnd?: string;
  }) => request('/trips', { method: 'POST', body: data }),

  list: (status?: string) =>
    request(`/trips?status=${status || 'active'}`),

  get: (tripId: string) => request(`/trips/${tripId}`),

  update: (tripId: string, data: any) =>
    request(`/trips/${tripId}`, { method: 'PUT', body: data }),

  generateCanvas: (tripId: string) =>
    request(`/trips/${tripId}/generate-canvas`, { method: 'POST' }),

  getCanvas: (tripId: string) => request(`/trips/${tripId}/canvas`),

  getItinerary: (tripId: string) => request(`/trips/${tripId}/itinerary`),

  reorderItinerary: (tripId: string, items: { itemId: string; day: number; order: number }[]) =>
    request(`/trips/${tripId}/itinerary/reorder`, { method: 'PUT', body: { items } }),

  getRestaurants: (tripId: string, lat: number, lng: number) =>
    request(`/trips/${tripId}/restaurants?lat=${lat}&lng=${lng}`),

  getPrep: (tripId: string) => request(`/trips/${tripId}/prep`),

  getPacking: (tripId: string) => request(`/trips/${tripId}/packing`),
};

// --- Bookings API ---
export const bookingsApi = {
  create: (data: {
    tripId: string;
    items: any[];
    subtotal: number;
    taxes: number;
    total: number;
    paymentMethod?: string;
  }) => request('/bookings', { method: 'POST', body: data }),

  confirm: (bookingId: string) =>
    request(`/bookings/${bookingId}`, { method: 'POST' }),

  get: (bookingId: string) => request(`/bookings/${bookingId}`),

  list: () => request('/bookings'),
};

// --- Feedback API ---
export const feedbackApi = {
  submit: (data: { tripId: string; ratings: any[]; review?: string }) =>
    request('/feedback', { method: 'POST', body: data }),
};
