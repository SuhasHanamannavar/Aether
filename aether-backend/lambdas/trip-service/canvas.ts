export function generateCanvas(trip: any) {
  return {
    destination: trip.destination || null,
    dateStart: trip.dateStart || null,
    dateEnd: trip.dateEnd || null,
    budget: trip.budget || null,
    archetypes: [],
  };
}

export function generateItinerary(trip: any, userId: string) {
  return [];
}

export function generateRestaurants(lat: number, lng: number, theme: string, budget: number) {
  return [];
}
