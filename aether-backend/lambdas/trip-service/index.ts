import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { LocationClient, SearchPlaceIndexForTextCommand } from '@aws-sdk/client-location';
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

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const locationClient = new LocationClient({});

const TRIPS_TABLE = process.env.TRIPS_TABLE!;
const ITINERARY_TABLE = process.env.ITINERARY_TABLE!;
const EXPENSES_TABLE = process.env.EXPENSES_TABLE!;
const MEMORIES_TABLE = process.env.MEMORIES_TABLE!;
const PLACE_INDEX = process.env.PLACE_INDEX_NAME || 'ZeloPlaceIndex';

export const handler = async (event: any) => {
  try {
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};
    const tripId = event.pathParameters?.tripId;
    const authUserId = event.headers?.['x-user-id'] || event.headers?.['X-User-Id'];
    const queryParams = event.queryStringParameters || {};
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

    // Resolve resource path from proxy (consolidated routes)
    const proxy = event.pathParameters?.proxy || '';
    let path = event.resource;
    if (proxy) {
      path = `/trips/{tripId}/${proxy}`;
      path = path.replace(/\/expenses\/([^/]+)/, '/expenses/{expenseId}');
      path = path.replace(/\/memories\/([^/]+)/, '/memories/{memoryId}');
      const proxyParts = proxy.split('/');
      for (let i = 0; i < proxyParts.length; i++) {
        if (proxyParts[i] === 'expenses' && i + 1 < proxyParts.length) {
          event.pathParameters = event.pathParameters || {};
          event.pathParameters.expenseId = proxyParts[i + 1];
        }
        if (proxyParts[i] === 'memories' && i + 1 < proxyParts.length) {
          event.pathParameters = event.pathParameters || {};
          event.pathParameters.memoryId = proxyParts[i + 1];
        }
      }
    }

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

    // GET /trips/{tripId}/restaurants — real Amazon Location Service search
    if (path === '/trips/{tripId}/restaurants' && method === 'GET') {
      const lat = parseFloat(queryParams.lat || '0');
      const lng = parseFloat(queryParams.lng || '0');
      const trip = await ddb.send(new GetCommand({ TableName: TRIPS_TABLE, Key: { tripId } }));
      const destination = trip.Item?.destination || '';
      let results: any[] = [];
      if (lat && lng) {
        try {
          const searchCmd = new SearchPlaceIndexForTextCommand({
            IndexName: PLACE_INDEX,
            Text: `restaurants near ${lat},${lng}`,
            BiasPosition: [lng, lat],
            MaxResults: 10,
            Language: 'en',
          });
          const searchResult = await locationClient.send(searchCmd);
          results = (searchResult.Results || []).map((r: any) => ({
            name: r.Place?.Label?.split(',')[0] || r.Place?.Label || 'Restaurant',
            address: r.Place?.Address?.Label || r.Place?.Label || '',
            coordinates: r.Place?.Geometry?.Point,
            distance: r.Distance ? Math.round(r.Distance) : undefined,
          }));
        } catch (e) {
          console.error('Place search failed, returning empty:', e);
        }
      } else if (destination) {
        try {
          const searchCmd = new SearchPlaceIndexForTextCommand({
            IndexName: PLACE_INDEX,
            Text: `restaurants in ${destination}`,
            MaxResults: 10,
            Language: 'en',
          });
          const searchResult = await locationClient.send(searchCmd);
          results = (searchResult.Results || []).map((r: any) => ({
            name: r.Place?.Label?.split(',')[0] || r.Place?.Label || 'Restaurant',
            address: r.Place?.Address?.Label || r.Place?.Label || '',
            coordinates: r.Place?.Geometry?.Point,
            distance: r.Distance ? Math.round(r.Distance) : undefined,
          }));
        } catch (e) {
          console.error('Place search failed, returning empty:', e);
        }
      }
      return respond(200, results, headers);
    }

    // GET /trips/{tripId}/prep
    if (path === '/trips/{tripId}/prep' && method === 'GET') {
      const trip = await ddb.send(new GetCommand({ TableName: TRIPS_TABLE, Key: { tripId } }));
      const destination = trip.Item?.destination || '';
      const transportMode = trip.Item?.transportMode || 'fly';
      const generalItems = [
        { id: 'visa', title: 'Visa requirements', status: 'pending' },
        { id: 'passport', title: 'Passport validity', status: 'pending' },
        { id: 'insurance', title: 'Travel insurance', status: 'pending' },
        { id: 'vaccinations', title: 'Vaccinations', status: 'pending' },
      ];
      const transportLabels: Record<string, string> = {
        drive: 'Vehicle & road trip prep',
        transit: 'Transit pass & route planning',
        walk: 'Walking route planning',
        bike: 'Bicycle & gear prep',
        fly: 'Flight & airport prep',
      };
      return respond(200, {
        destination,
        checklist: generalItems,
        transportMode,
        transportLabel: transportLabels[transportMode] || 'Flight & airport prep',
        etiquette: [],
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
