const BASE_ARCHETYPES = [
  { id: 'culinary', title: 'The Culinary Journey', subtitle: 'Taste the heart of the destination', emoji: '🍜', color: '#E8A87C', score: 90, highlights: ['Local cuisine tours', 'Street food markets', 'Cooking classes'], priceRange: { min: 1000, max: 3500 } },
  { id: 'zen', title: 'The Zen Retreat', subtitle: 'Find your inner peace', emoji: '🏯', color: '#41B3A3', score: 88, highlights: ['Wellness activities', 'Cultural sites', 'Nature walks'], priceRange: { min: 1200, max: 4000 } },
  { id: 'urban', title: 'The Urban Explorer', subtitle: 'City lights & hidden gems', emoji: '🌃', color: '#1A1A2E', score: 85, highlights: ['City landmarks', 'Local nightlife', 'Shopping districts'], priceRange: { min: 800, max: 3000 } },
  { id: 'nature', title: 'The Nature Wanderer', subtitle: 'Trails, peaks & sunrises', emoji: '🏔️', color: '#10B981', score: 83, highlights: ['Hiking trails', 'Scenic viewpoints', 'Outdoor adventures'], priceRange: { min: 600, max: 2800 } },
];

export function generateCanvas(trip: any) {
  const scored = BASE_ARCHETYPES.map((arch: any) => {
    let adj = 0;
    if (trip.budget) {
      const mid = (arch.priceRange.min + arch.priceRange.max) / 2;
      adj += trip.budget >= mid ? 5 : 2;
    }
    if (trip.vibeTags?.length) {
      adj += trip.vibeTags.filter((v: string) =>
        arch.highlights.some((h: string) => h.toLowerCase().includes(v.toLowerCase()))
      ).length * 3;
    }
    return { ...arch, score: Math.min(99, arch.score + adj) };
  });
  scored.sort((a: any, b: any) => b.score - a.score);

  return {
    destination: trip.destination || null,
    dateStart: trip.dateStart || null,
    dateEnd: trip.dateEnd || null,
    budget: trip.budget || null,
    archetypes: scored,
  };
}

export function generateItinerary(trip: any, userId: string) {
  return [];
}

export function generateRestaurants(lat: number, lng: number, theme: string, budget: number) {
  return [];
}

export const archetypes = BASE_ARCHETYPES;
