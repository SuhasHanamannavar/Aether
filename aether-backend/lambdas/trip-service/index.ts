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

export const handler = async (event: any) => {
  try {
    const path = event.resource;
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};
    const tripId = event.pathParameters?.tripId;
    const authUserId = event.requestContext?.authorizer?.claims?.sub;
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
        if (['destination', 'vibeTags', 'budget', 'dateStart', 'dateEnd', 'archetype', 'status', 'totalEstimatedCost'].includes(key)) {
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
      return respond(200, {
        destination,
        checklist: [
          { id: 'visa', title: 'Visa requirements', status: 'pending', notes: `Check visa requirements for ${destination}` },
          { id: 'passport', title: 'Passport validity', status: 'pending', notes: 'Must be valid 6 months beyond travel' },
          { id: 'insurance', title: 'Travel insurance', status: 'pending', notes: 'Recommended for medical & cancellation' },
          { id: 'vaccinations', title: 'Vaccinations', status: 'pending', notes: 'Check CDC/WHO recommendations' },
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
