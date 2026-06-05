import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
  ScanCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { archetypes, generateItinerary, generateRestaurants, generateCanvas } from './canvas';
import { mockTrips, mockPlaces } from './data/mock-data';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const TRIPS_TABLE = process.env.TRIPS_TABLE!;
const ITINERARY_TABLE = process.env.ITINERARY_TABLE!;
const EXPENSES_TABLE = process.env.EXPENSES_TABLE!;
const MEMORIES_TABLE = process.env.MEMORIES_TABLE!;

export const handler = async (event: any) => {
  try {
    const path = event.resource;
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};
    const tripId = event.pathParameters?.tripId;
    const authUserId = event.headers?.['x-user-id'] || event.headers?.['X-User-Id'];
    const queryParams = event.queryStringParameters || {};
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

    if (!authUserId) return respond(401, { message: 'Unauthorized' }, headers);

    // POST /trips — Create new trip
    if (path === '/trips' && method === 'POST') {
      const id = uuidv4();
      const now = new Date().toISOString();
      const trip = {
        tripId: id,
        userId: authUserId,
        destination: body.destination || null,
        vibeTags: body.vibeTags || [],
        budget: body.budget || null,
        dateStart: body.dateStart || null,
        dateEnd: body.dateEnd || null,
        archetype: null,
        transportMode: body.transportMode || 'fly',
        diyBooking: body.diyBooking || false,
        status: 'draft',
        totalEstimatedCost: 0,
        createdAt: now,
        updatedAt: now,
      };
      await ddb.send(new PutCommand({
        TableName: TRIPS_TABLE,
        Item: trip,
      }));
      return respond(200, trip, headers);
    }

    // GET /trips — List user's trips
    if (path === '/trips' && method === 'GET') {
      const status = queryParams.status || 'active';
      const result = await ddb.send(new QueryCommand({
        TableName: TRIPS_TABLE,
        IndexName: 'ByUser',
        KeyConditionExpression: 'userId = :uid AND #status = :s',
        ExpressionAttributeNames: { '#status': 'status' },
        ExpressionAttributeValues: { ':uid': authUserId, ':s': status },
        ScanIndexForward: false,
      }));
      return respond(200, result.Items || [], headers);
    }

    // GET /trips/{tripId}
    if (path === '/trips/{tripId}' && method === 'GET') {
      const result = await ddb.send(new GetCommand({
        TableName: TRIPS_TABLE,
        Key: { tripId },
      }));
      if (!result.Item) return respond(404, { message: 'Trip not found' }, headers);
      return respond(200, result.Item, headers);
    }

    // PUT /trips/{tripId}
    if (path === '/trips/{tripId}' && method === 'PUT') {
      const updates: string[] = [];
      const exprValues: any = { ':updatedAt': new Date().toISOString() };
      const exprNames: any = { '#updatedAt': 'updatedAt' };
      updates.push('#updatedAt = :updatedAt');

      for (const [key, value] of Object.entries(body)) {
        if (['destination', 'vibeTags', 'budget', 'dateStart', 'dateEnd', 'archetype', 'status', 'totalEstimatedCost', 'transportMode', 'diyBooking'].includes(key)) {
          updates.push(`#${key} = :${key}`);
          exprNames[`#${key}`] = key;
          exprValues[`:${key}`] = value;
        }
      }

      if (updates.length === 1) return respond(400, { message: 'No valid fields' }, headers);

      await ddb.send(new UpdateCommand({
        TableName: TRIPS_TABLE,
        Key: { tripId },
        UpdateExpression: `SET ${updates.join(', ')}`,
        ExpressionAttributeNames: exprNames,
        ExpressionAttributeValues: exprValues,
      }));

      const result = await ddb.send(new GetCommand({ TableName: TRIPS_TABLE, Key: { tripId } }));
      return respond(200, result.Item, headers);
    }

    // POST /trips/{tripId}/generate-canvas
    if (path === '/trips/{tripId}/generate-canvas' && method === 'POST') {
      const trip = await ddb.send(new GetCommand({ TableName: TRIPS_TABLE, Key: { tripId } }));
      if (!trip.Item) return respond(404, { message: 'Trip not found' }, headers);
      const canvas = generateCanvas(trip.Item);
      await ddb.send(new UpdateCommand({
        TableName: TRIPS_TABLE,
        Key: { tripId },
        UpdateExpression: 'SET #status = :s, #updatedAt = :u',
        ExpressionAttributeNames: { '#status': 'status', '#updatedAt': 'updatedAt' },
        ExpressionAttributeValues: { ':s': 'canvas', ':u': new Date().toISOString() },
      }));
      return respond(200, canvas, headers);
    }

    // GET /trips/{tripId}/canvas
    if (path === '/trips/{tripId}/canvas' && method === 'GET') {
      const trip = await ddb.send(new GetCommand({ TableName: TRIPS_TABLE, Key: { tripId } }));
      if (!trip.Item) return respond(404, { message: 'Trip not found' }, headers);
      const canvas = generateCanvas(trip.Item);
      return respond(200, canvas, headers);
    }

    // GET /trips/{tripId}/itinerary
    if (path === '/trips/{tripId}/itinerary' && method === 'GET') {
      const result = await ddb.send(new QueryCommand({
        TableName: ITINERARY_TABLE,
        IndexName: 'ByTrip',
        KeyConditionExpression: 'tripId = :tid',
        ExpressionAttributeValues: { ':tid': tripId },
      }));
      if (result.Items && result.Items.length > 0) {
        return respond(200, result.Items, headers);
      }
      // Generate itinerary if none exists
      const trip = await ddb.send(new GetCommand({ TableName: TRIPS_TABLE, Key: { tripId } }));
      if (!trip.Item) return respond(404, { message: 'Trip not found' }, headers);
      const items = generateItinerary(trip.Item, authUserId);
      for (const item of items) {
        await ddb.send(new PutCommand({ TableName: ITINERARY_TABLE, Item: item }));
      }
      return respond(200, items, headers);
    }

    // PUT /trips/{tripId}/itinerary/reorder
    if (path === '/trips/{tripId}/itinerary/reorder' && method === 'PUT') {
      const { items } = body;
      if (!Array.isArray(items)) return respond(400, { message: 'items array required' }, headers);
      for (const item of items) {
        await ddb.send(new UpdateCommand({
          TableName: ITINERARY_TABLE,
          Key: { itemId: item.itemId },
          UpdateExpression: 'SET #day = :d, #ord = :o',
          ExpressionAttributeNames: { '#day': 'day', '#ord': 'order' },
          ExpressionAttributeValues: { ':d': item.day, ':o': item.order },
        }));
      }
      return respond(200, { message: 'Reordered' }, headers);
    }

    // GET /trips/{tripId}/restaurants
    if (path === '/trips/{tripId}/restaurants' && method === 'GET') {
      const lat = parseFloat(queryParams.lat || '35.6762');
      const lng = parseFloat(queryParams.lng || '139.6503');
      const trip = await ddb.send(new GetCommand({ TableName: TRIPS_TABLE, Key: { tripId } }));
      const theme = trip.Item?.archetype || 'culinary';
      const budget = trip.Item?.budget || 100;
      const suggestions = generateRestaurants(lat, lng, theme, budget);
      return respond(200, suggestions, headers);
    }

    // GET /trips/{tripId}/bookings
    if (path === '/trips/{tripId}/bookings' && method === 'GET') {
      return respond(200, mockTrips.filter((t: any) => t.tripId === tripId), headers);
    }

    // GET /trips/{tripId}/prep
    if (path === '/trips/{tripId}/prep' && method === 'GET') {
      const trip = await ddb.send(new GetCommand({ TableName: TRIPS_TABLE, Key: { tripId } }));
      const destination = trip.Item?.destination || 'Japan';
      const transportMode = trip.Item?.transportMode || 'fly';
      const transportItems: any[] = [];
      if (transportMode === 'drive') {
        transportItems.push(
          { id: 'vehicle-check', title: 'Vehicle maintenance check', status: 'pending', notes: 'Oil, tires, brakes, fluids' },
          { id: 'fuel-stops', title: 'Plan fuel stops', status: 'pending', notes: 'Mark gas stations along route' },
          { id: 'offline-maps', title: 'Download offline maps', status: 'pending', notes: 'Navigation without data' },
          { id: 'road-kit', title: 'Emergency road kit', status: 'pending', notes: 'Spare tire, jumper cables, first aid' },
        );
      } else if (transportMode === 'transit') {
        transportItems.push(
          { id: 'transit-pass', title: 'Get transit pass / IC card', status: 'pending', notes: 'Pre-load with sufficient balance' },
          { id: 'route-maps', title: 'Download route maps', status: 'pending', notes: 'Station diagrams & line maps' },
          { id: 'station-connections', title: 'Research station connections', status: 'pending', notes: 'Transfer points & walking times' },
          { id: 'schedule-app', title: 'Install transit schedule app', status: 'pending', notes: 'Real-time departures & alerts' },
        );
      } else if (transportMode === 'walk') {
        transportItems.push(
          { id: 'walking-routes', title: 'Plan walking routes', status: 'pending', notes: 'Scenic paths & shortcuts' },
          { id: 'footwear', title: 'Pack comfortable footwear', status: 'pending', notes: 'Walking shoes, insoles, blister care' },
          { id: 'weather-check', title: 'Check weather conditions', status: 'pending', notes: 'Rain gear or sun protection' },
        );
      } else if (transportMode === 'bike') {
        transportItems.push(
          { id: 'bike-check', title: 'Bike maintenance check', status: 'pending', notes: 'Tires, brakes, chain, lights' },
          { id: 'bike-routes', title: 'Plot bike-friendly routes', status: 'pending', notes: 'Cycle paths & bike lanes' },
          { id: 'bike-lock', title: 'Pack bike lock', status: 'pending', notes: 'Secure parking at stops' },
          { id: 'helmet', title: 'Pack helmet & safety gear', status: 'pending', notes: 'Reflective vest, lights' },
        );
      } else {
        transportItems.push(
          { id: 'flight-checkin', title: 'Check in for flights', status: 'pending', notes: 'Online check-in 24h before' },
          { id: 'baggage', title: 'Pack baggage within limits', status: 'pending', notes: 'Check airline weight & size rules' },
          { id: 'airport-transfer', title: 'Arrange airport transfer', status: 'pending', notes: 'Book shuttle or taxi in advance' },
          { id: 'airport-arrival', title: 'Plan airport arrival time', status: 'pending', notes: 'Arrive 2-3h before departure' },
        );
      }
      return respond(200, {
        destination,
        checklist: [
          { id: 'visa', title: 'Visa requirements', status: 'pending', notes: `Check visa requirements for ${destination}` },
          { id: 'passport', title: 'Passport validity', status: 'pending', notes: 'Must be valid 6 months beyond travel' },
          { id: 'insurance', title: 'Travel insurance', status: 'pending', notes: 'Recommended for medical & cancellation' },
          { id: 'vaccinations', title: 'Vaccinations', status: 'pending', notes: 'Check CDC/WHO recommendations' },
          ...transportItems,
        ],
        etiquette: [
          'Learn basic greetings in the local language',
          'Research tipping customs',
          'Know dress codes for religious sites',
          'Understand local dining etiquette',
        ],
      }, headers);
    }

    // GET /trips/{tripId}/packing
    if (path === '/trips/{tripId}/packing' && method === 'GET') {
      return respond(200, {
        essentials: ['Passport', 'Phone charger', 'Power bank', 'Travel adapter'],
        clothing: ['Comfortable walking shoes', 'Light jacket', 'Weather-appropriate outfits'],
        toiletries: ['Sunscreen', 'Hand sanitizer', 'Basic first-aid kit'],
        documents: ['Print hotel confirmations', 'Download offline maps', 'Emergency contacts'],
      }, headers);
    }

    // POST /trips/{tripId}/feedback
    if (path.includes('/feedback') && method === 'POST') {
      return respond(200, { message: 'Feedback recorded', feedbackId: uuidv4() }, headers);
    }

    // --- Expense CRUD ---

    // POST /trips/{tripId}/expenses
    if (path === '/trips/{tripId}/expenses' && method === 'POST') {
      const expenseId = uuidv4();
      const now = new Date().toISOString();
      const expense = {
        expenseId,
        tripId,
        userId: authUserId,
        category: body.category || 'other',
        amount: body.amount || 0,
        currency: body.currency || 'USD',
        description: body.description || '',
        date: body.date || now.split('T')[0],
        createdAt: now,
      };
      await ddb.send(new PutCommand({ TableName: EXPENSES_TABLE, Item: expense }));
      return respond(200, expense, headers);
    }

    // GET /trips/{tripId}/expenses
    if (path === '/trips/{tripId}/expenses' && method === 'GET') {
      const result = await ddb.send(new QueryCommand({
        TableName: EXPENSES_TABLE,
        IndexName: 'ByTrip',
        KeyConditionExpression: 'tripId = :tid',
        ExpressionAttributeValues: { ':tid': tripId },
        ScanIndexForward: false,
      }));
      return respond(200, result.Items || [], headers);
    }

    // DELETE /trips/{tripId}/expenses/{expenseId}
    if (path === '/trips/{tripId}/expenses/{expenseId}' && method === 'DELETE') {
      const expenseId = event.pathParameters?.expenseId;
      await ddb.send(new DeleteCommand({
        TableName: EXPENSES_TABLE,
        Key: { expenseId },
      }));
      return respond(200, { message: 'Expense deleted' }, headers);
    }

    // --- Memory CRUD ---

    // POST /trips/{tripId}/memories
    if (path === '/trips/{tripId}/memories' && method === 'POST') {
      const memoryId = uuidv4();
      const now = new Date().toISOString();
      const memory = {
        memoryId,
        tripId,
        userId: authUserId,
        imageUrl: body.imageUrl || '',
        caption: body.caption || '',
        day: body.day || 1,
        lat: body.lat || null,
        lng: body.lng || null,
        createdAt: now,
      };
      await ddb.send(new PutCommand({ TableName: MEMORIES_TABLE, Item: memory }));
      return respond(200, memory, headers);
    }

    // GET /trips/{tripId}/memories
    if (path === '/trips/{tripId}/memories' && method === 'GET') {
      const result = await ddb.send(new QueryCommand({
        TableName: MEMORIES_TABLE,
        IndexName: 'ByTrip',
        KeyConditionExpression: 'tripId = :tid',
        ExpressionAttributeValues: { ':tid': tripId },
        ScanIndexForward: false,
      }));
      return respond(200, result.Items || [], headers);
    }

    // DELETE /trips/{tripId}/memories/{memoryId}
    if (path === '/trips/{tripId}/memories/{memoryId}' && method === 'DELETE') {
      const memoryId = event.pathParameters?.memoryId;
      await ddb.send(new DeleteCommand({
        TableName: MEMORIES_TABLE,
        Key: { memoryId },
      }));
      return respond(200, { message: 'Memory deleted' }, headers);
    }

    return respond(404, { message: 'Route not found' }, headers);
  } catch (err: any) {
    console.error('TripService error:', err);
    return respond(500, { message: err.message || 'Internal error' }, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  }
};

const respond = (statusCode: number, body: any, headers: any) => ({
  statusCode,
  headers,
  body: JSON.stringify(body),
});
