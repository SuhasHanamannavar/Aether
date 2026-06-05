import { v4 as uuidv4 } from 'uuid';

const BASE_ARCHETYPES = [
  { id: 'culinary', title: 'The Culinary Journey', subtitle: 'Taste the heart of the destination', emoji: '🍜', color: '#E8A87C', score: 90, highlights: ['Local cuisine tours', 'Street food markets', 'Cooking classes'], priceRange: { min: 1000, max: 3500 } },
  { id: 'zen', title: 'The Zen Retreat', subtitle: 'Find your inner peace', emoji: '🏯', color: '#41B3A3', score: 88, highlights: ['Wellness activities', 'Cultural sites', 'Nature walks'], priceRange: { min: 1200, max: 4000 } },
  { id: 'urban', title: 'The Urban Explorer', subtitle: 'City lights & hidden gems', emoji: '🌃', color: '#1A1A2E', score: 85, highlights: ['City landmarks', 'Local nightlife', 'Shopping districts'], priceRange: { min: 800, max: 3000 } },
  { id: 'nature', title: 'The Nature Wanderer', subtitle: 'Trails, peaks & sunrises', emoji: '🏔️', color: '#10B981', score: 83, highlights: ['Hiking trails', 'Scenic viewpoints', 'Outdoor adventures'], priceRange: { min: 600, max: 2800 } },
];

export function generateCanvas(trip: any) {
  const scoredArchetypes = BASE_ARCHETYPES.map((arch: any) => {
    let scoreAdjust = 0;
    if (trip.budget) {
      const midPrice = (arch.priceRange.min + arch.priceRange.max) / 2;
      scoreAdjust += trip.budget >= midPrice ? 5 : 2;
    }
    if (trip.vibeTags?.length) {
      const matchCount = trip.vibeTags.filter((v: string) =>
        arch.highlights.some((h: string) => h.toLowerCase().includes(v.toLowerCase()))
      ).length;
      scoreAdjust += matchCount * 3;
    }
    return { ...arch, score: Math.min(99, arch.score + scoreAdjust) };
  });

  scoredArchetypes.sort((a: any, b: any) => b.score - a.score);

  return {
    destination: trip.destination || 'Your Destination',
    dateStart: trip.dateStart || null,
    dateEnd: trip.dateEnd || null,
    budget: trip.budget || null,
    archetypes: scoredArchetypes,
  };
}

export function generateItinerary(trip: any, userId: string) {
  const items: any[] = [];
  const tripId = trip.tripId;
  const transportMode = trip.transportMode || 'fly';
  const days = 3;

  const transportLabel = (mode: string): string => {
    const labels: Record<string, string> = {
      drive: '🚗 Drive',
      transit: '🚄 Transit',
      walk: '🚶 Walk',
      bike: '🚲 Bike',
      fly: '✈️ Flight',
    };
    return labels[mode] || '✈️ Flight';
  };

  for (let d = 1; d <= days; d++) {
    items.push({
      itemId: uuidv4(), tripId, day: d, order: 0,
      type: 'transport',
      title: d === 1 ? `${transportLabel(transportMode)} • Departure` : d === days ? `${transportLabel(transportMode)} • Return` : `${transportLabel(transportMode)} • Transfer`,
      time: d === 1 ? '10:00' : d === days ? '16:00' : '09:00',
      price: transportMode === 'fly' ? 680 : transportMode === 'drive' ? 45 : transportMode === 'transit' ? 25 : 0,
      score: 85,
      emoji: transportMode === 'drive' ? '🚗' : transportMode === 'transit' ? '🚄' : transportMode === 'walk' ? '🚶' : transportMode === 'bike' ? '🚲' : '✈️',
      bookingStatus: 'unbooked',
      geoLocation: null,
    });

    items.push({
      itemId: uuidv4(), tripId, day: d, order: 1,
      type: 'accommodation',
      title: 'Accommodation • Night',
      time: '15:00',
      price: 120,
      score: 85,
      emoji: '🏨',
      bookingStatus: 'unbooked',
      geoLocation: null,
    });

    items.push({
      itemId: uuidv4(), tripId, day: d, order: 2,
      type: 'activity',
      title: 'Explore the destination',
      time: '10:00 - 18:00',
      price: 0,
      score: 85,
      emoji: '📍',
      bookingStatus: 'unbooked',
      geoLocation: null,
    });

    items.push({
      itemId: uuidv4(), tripId, day: d, order: 3,
      type: 'dining',
      title: 'Local dining experience',
      time: '19:00',
      price: 40,
      score: 85,
      emoji: '🍽️',
      bookingStatus: 'unbooked',
      geoLocation: null,
    });
  }

  return items;
}

export function generateRestaurants(lat: number, lng: number, theme: string, budget: number) {
  return [];
}

export const archetypes = BASE_ARCHETYPES;
