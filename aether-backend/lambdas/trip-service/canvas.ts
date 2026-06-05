import { v4 as uuidv4 } from 'uuid';

const DESTINATIONS: Record<string, { regions: any[], archetypes: any[], places: any[] }> = {
  japan: {
    regions: [
      { name: 'Tokyo', emoji: '🗼', lat: 35.6762, lng: 139.6503 },
      { name: 'Kyoto', emoji: '⛩️', lat: 35.0116, lng: 135.7681 },
      { name: 'Osaka', emoji: '🏯', lat: 34.6937, lng: 135.5023 },
      { name: 'Hokkaido', emoji: '❄️', lat: 43.2203, lng: 142.8636 },
      { name: 'Okinawa', emoji: '🏝️', lat: 26.3344, lng: 127.8056 },
    ],
    archetypes: [
      { id: 'culinary', title: 'The Culinary Journey', subtitle: 'Taste the heart of Japan', emoji: '🍜', color: '#E8A87C', score: 94, highlights: ['Sushi masterclasses', 'Street food tours', 'Sake tasting'], priceRange: { min: 1500, max: 3500 } },
      { id: 'zen', title: 'The Zen Garden Retreat', subtitle: 'Find your inner peace', emoji: '🏯', color: '#41B3A3', score: 91, highlights: ['Temple stays', 'Tea ceremonies', 'Onsen baths'], priceRange: { min: 1800, max: 4000 } },
      { id: 'urban', title: 'The Urban Explorer', subtitle: 'City lights & hidden alleys', emoji: '🌃', color: '#1A1A2E', score: 88, highlights: ['Neon Tokyo nights', 'Akihabara anime', 'Rooftop bars'], priceRange: { min: 1200, max: 3000 } },
      { id: 'nature', title: 'The Mountain Wanderer', subtitle: 'Trails, peaks & sunrise', emoji: '🏔️', color: '#10B981', score: 86, highlights: ['Mt. Fuji trek', 'Bamboo forests', 'Alpine villages'], priceRange: { min: 1000, max: 2800 } },
    ],
    places: [
      { id: 'r1', name: 'Ichiran Ramen', type: 'restaurant', lat: 35.6938, lng: 139.7036, priceLevel: 1, score: 94, cuisine: 'Ramen', emoji: '🍜', isTouristTrap: false },
      { id: 'r2', name: 'Sushi Saito', type: 'restaurant', lat: 35.6605, lng: 139.7292, priceLevel: 3, score: 96, cuisine: 'Sushi', emoji: '🍣', isTouristTrap: false },
      { id: 'r3', name: 'Uobei', type: 'restaurant', lat: 35.6595, lng: 139.7004, priceLevel: 1, score: 91, cuisine: 'Sushi', emoji: '🍣', isTouristTrap: false },
      { id: 'r4', name: 'Gyoza King', type: 'restaurant', lat: 35.6678, lng: 139.7026, priceLevel: 2, score: 88, cuisine: 'Gyoza', emoji: '🥟', isTouristTrap: false },
      { id: 'a1', name: 'Tsukiji Fish Market', type: 'activity', lat: 35.6654, lng: 139.7707, priceLevel: 1, score: 90, emoji: '🐟' },
      { id: 'a2', name: 'Shibuya Crossing', type: 'activity', lat: 35.6595, lng: 139.7004, priceLevel: 0, score: 87, emoji: '🚶' },
      { id: 'a3', name: 'Fushimi Inari Shrine', type: 'activity', lat: 34.9671, lng: 135.7727, priceLevel: 0, score: 93, emoji: '⛩️' },
      { id: 'a4', name: 'Arashiyama Bamboo Grove', type: 'activity', lat: 35.0170, lng: 135.6713, priceLevel: 0, score: 91, emoji: '🎋' },
      { id: 'a5', name: 'Tea Ceremony Experience', type: 'activity', lat: 35.0036, lng: 135.7751, priceLevel: 2, score: 91, emoji: '🍵' },
      { id: 'h1', name: 'Shinjuku Granbell Hotel', type: 'hotel', lat: 35.6938, lng: 139.7036, priceLevel: 2, score: 88, emoji: '🏨' },
      { id: 'h2', name: 'Kyoto Ryokan Zen', type: 'hotel', lat: 35.0116, lng: 135.7681, priceLevel: 3, score: 93, emoji: '🏯' },
    ],
  },
};

function getDestinationData(destination: string) {
  const key = destination?.toLowerCase() || 'japan';
  return DESTINATIONS[key] || DESTINATIONS['japan'];
}

export function generateCanvas(trip: any) {
  const dest = getDestinationData(trip.destination);

  const scoredArchetypes = dest.archetypes.map((arch: any) => {
    let scoreAdjust = 0;
    if (trip.budget) {
      const midPrice = (arch.priceRange.min + arch.priceRange.max) / 2;
      if (trip.budget >= midPrice) scoreAdjust += 5;
      else scoreAdjust += 2;
    }
    if (trip.vibeTags?.length) {
      const matchCount = trip.vibeTags.filter((v: string) =>
        arch.highlights.some((h: string) => h.toLowerCase().includes(v))
      ).length;
      scoreAdjust += matchCount * 3;
    }
    return { ...arch, score: Math.min(99, arch.score + scoreAdjust) };
  });

  scoredArchetypes.sort((a: any, b: any) => b.score - a.score);

  return {
    destination: trip.destination || 'Japan',
    regions: dest.regions,
    archetypes: scoredArchetypes,
    activeFilters: ['value-for-money'],
  };
}

export function generateItinerary(trip: any, userId: string) {
  const dest = getDestinationData(trip.destination);
  const items: any[] = [];
  const tripId = trip.tripId;
  const archetype = trip.archetype || 'culinary';
  const days = 3;

  const places = dest.places;
  const flights = [
    { type: 'flight', title: 'JAL 42 • Narita Airport', time: '10:00 - 14:30', price: 680, score: 92, emoji: '✈️' },
    { type: 'flight', title: 'JAL 41 • Return to Home', time: '16:00 - 08:30', price: 680, score: 90, emoji: '✈️' },
  ];

  const archetypeActivities = places.filter((p: any) =>
    archetype === 'culinary' ? p.type === 'restaurant' || p.name.toLowerCase().includes('market') :
    archetype === 'zen' ? p.name.toLowerCase().includes('shrine') || p.name.toLowerCase().includes('temple') || p.name.toLowerCase().includes('bamboo') || p.name.toLowerCase().includes('tea') :
    archetype === 'urban' ? p.type !== 'hotel' :
    p.type === 'activity'
  );

  const shuffled = [...archetypeActivities].sort(() => Math.random() - 0.5);

  // Day 1: Arrival
  items.push({
    itemId: uuidv4(), tripId, day: 1, order: 0,
    ...flights[0], bookingStatus: 'unbooked', geoLocation: { lat: 35.6762, lng: 139.6503 },
  });
  const hotel1 = places.find((p: any) => p.id === 'h1');
  if (hotel1) {
    items.push({
      itemId: uuidv4(), tripId, day: 1, order: 1,
      type: 'hotel', title: hotel1.name, time: 'Check-in: 15:00',
      price: hotel1.priceLevel * 100 + 50, score: hotel1.score, emoji: hotel1.emoji,
      bookingStatus: 'unbooked', geoLocation: { lat: hotel1.lat, lng: hotel1.lng },
    });
  }
  const evenAct = shuffled.find((p: any) => p.type === 'restaurant' || archetype !== 'culinary');
  if (evenAct) {
    items.push({
      itemId: uuidv4(), tripId, day: 1, order: 2,
      type: evenAct.type === 'restaurant' ? 'dining' : 'activity',
      title: evenAct.name, time: '19:00 - 21:00',
      price: evenAct.priceLevel * 30 + 10, score: evenAct.score, emoji: evenAct.emoji,
      bookingStatus: 'unbooked', geoLocation: { lat: evenAct.lat, lng: evenAct.lng },
    });
  }

  // Day 2: Exploration
  const day2Acts = shuffled.slice(1, 4);
  day2Acts.forEach((act: any, i: number) => {
    items.push({
      itemId: uuidv4(), tripId, day: 2, order: i,
      type: act.type === 'restaurant' ? 'dining' : 'activity',
      title: act.name,
      time: i === 0 ? '06:00 - 09:00' : i === 1 ? '10:00 - 16:00' : '19:00',
      price: act.priceLevel * 30 + 10, score: act.score, emoji: act.emoji,
      bookingStatus: 'unbooked', geoLocation: { lat: act.lat, lng: act.lng },
    });
  });

  // Day 3: Day trip + return
  const day3Act = shuffled.slice(4, 7);
  day3Act.forEach((act: any, i: number) => {
    items.push({
      itemId: uuidv4(), tripId, day: 3, order: i,
      type: act.type === 'restaurant' ? 'dining' : 'activity',
      title: act.name,
      time: i === 0 ? '07:00 - 09:00' : i === 1 ? '09:30 - 12:00' : '13:00 - 16:00',
      price: act.priceLevel * 30 + 10, score: act.score, emoji: act.emoji,
      bookingStatus: 'unbooked', geoLocation: { lat: act.lat, lng: act.lng },
    });
  });

  return items;
}

export function generateRestaurants(lat: number, lng: number, theme: string, budget: number) {
  const dest = DESTINATIONS['japan'];
  const restaurants = dest.places.filter((p: any) => p.type === 'restaurant');
  return restaurants.map((r: any) => ({
    ...r,
    distance: Math.round(Math.sqrt(Math.pow((r.lat - lat) * 111, 2) + Math.pow((r.lng - lng) * 85, 2))),
  })).sort((a: any, b: any) => a.distance - b.distance).slice(0, 5);
}
