import { config } from '../constants/config';

interface RequestOptions {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
}

let currentUserId: string | null = null;

export function setUserId(id: string | null) {
  currentUserId = id;
}

export function getCurrentUserId(): string | null {
  return currentUserId;
}

async function request(endpoint: string, options: RequestOptions = {}) {
  const { method = 'GET', body, headers = {} } = options;

  const reqHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  if (currentUserId) {
    reqHeaders['x-user-id'] = currentUserId;
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

// --- Prep API ---
export const prepApi = {
  getState: (tripId: string) => request(`/prep/${tripId}`),
  updateItem: (tripId: string, itemId: string, completed: boolean) =>
    request(`/prep/${tripId}/${itemId}`, { method: 'PUT', body: { completed } }),
};

// --- Expenses API ---
export const expensesApi = {
  list: (tripId: string) => request(`/trips/${tripId}/expenses`),
  create: (tripId: string, data: { category: string; amount: number; description?: string; date?: string }) =>
    request(`/trips/${tripId}/expenses`, { method: 'POST', body: data }),
  remove: (tripId: string, expenseId: string) =>
    request(`/trips/${tripId}/expenses/${expenseId}`, { method: 'DELETE' }),
};

// --- Memories API ---
export const memoriesApi = {
  list: (tripId: string) => request(`/trips/${tripId}/memories`),
  create: (tripId: string, data: { imageUrl: string; caption: string; day: number; lat?: number; lng?: number }) =>
    request(`/trips/${tripId}/memories`, { method: 'POST', body: data }),
  remove: (tripId: string, memoryId: string) =>
    request(`/trips/${tripId}/memories/${memoryId}`, { method: 'DELETE' }),
};

// --- Feedback API ---
export const feedbackApi = {
  submit: (data: { tripId: string; ratings: any[]; review?: string }) =>
    request('/feedback', { method: 'POST', body: data }),
};
