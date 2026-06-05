import {
  LocationClient,
  SearchPlaceIndexForTextCommand,
  SearchPlaceIndexForPositionCommand,
  CalculateRouteCommand,
  BatchEvaluateGeofencesCommand,
  BatchUpdateDevicePositionCommand,
  GetDevicePositionCommand,
  PutGeofenceCommand,
  DeleteGeofenceCommand,
  ListGeofencesCommand,
} from '@aws-sdk/client-location';

const client = new LocationClient({});
const PLACE_INDEX = process.env.PLACE_INDEX_NAME || 'ZeloPlaceIndex';
const ROUTE_CALCULATOR = process.env.ROUTE_CALCULATOR_NAME || 'ZeloRouteCalculator';
const GEOFENCE_COLLECTION = process.env.GEOFENCE_COLLECTION_NAME || 'ZeloGeofenceCollection';
const TRACKER_NAME = process.env.TRACKER_NAME || 'ZeloTracker';

export const handler = async (event: any) => {
  try {
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};
    const queryParams = event.queryStringParameters || {};
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
    const proxy = event.pathParameters?.proxy || '';
    const path = `/location/${proxy}`;

    // POST /location/search — SearchPlaceIndexForText
    if (path === '/location/search' && method === 'POST') {
      const { text, biasPosition, maxResults = 10 } = body;
      if (!text) return respond(400, { message: 'text required' }, headers);
      const cmd = new SearchPlaceIndexForTextCommand({
        IndexName: PLACE_INDEX,
        Text: text,
        BiasPosition: biasPosition,
        MaxResults: maxResults,
        Language: 'en',
      });
      const result = await client.send(cmd);
      return respond(200, {
        results: (result.Results || []).map((r: any) => ({
          label: r.Place?.Label,
          coordinates: r.Place?.Geometry?.Point,
          address: r.Place?.Address?.Label,
          municipality: r.Place?.Municipality,
          region: r.Place?.Region,
          country: r.Place?.Country,
          postalCode: r.Place?.PostalCode,
          categories: r.Place?.Categories || [],
        })),
      }, headers);
    }

    // POST /location/search/nearby — SearchPlaceIndexForPosition (reverse geocode)
    if (path === '/location/search/nearby' && method === 'POST') {
      const { position, maxResults = 10 } = body;
      if (!position) return respond(400, { message: 'position required' }, headers);
      const cmd = new SearchPlaceIndexForPositionCommand({
        IndexName: PLACE_INDEX,
        Position: position,
        MaxResults: maxResults,
        Language: 'en',
      });
      const result = await client.send(cmd);
      return respond(200, {
        results: (result.Results || []).map((r: any) => ({
          label: r.Place?.Label,
          coordinates: r.Place?.Geometry?.Point,
          address: r.Place?.Address?.Label,
          distance: r.Distance,
        })),
      }, headers);
    }

    // POST /location/route — CalculateRoute
    if (path === '/location/route' && method === 'POST') {
      const { departurePosition, destinationPosition, travelMode = 'Car', departureTime } = body;
      if (!departurePosition || !destinationPosition) {
        return respond(400, { message: 'departurePosition and destinationPosition required' }, headers);
      }
      const cmd = new CalculateRouteCommand({
        CalculatorName: ROUTE_CALCULATOR,
        DeparturePosition: departurePosition,
        DestinationPosition: destinationPosition,
        TravelMode: travelMode,
        DepartNow: !departureTime,
        DepartureTime: departureTime,
        IncludeLegGeometry: true,
      });
      const result = await client.send(cmd);
      const legs = (result.Legs || []).map((leg: any) => ({
        distance: leg.Distance,
        durationSeconds: leg.DurationSeconds,
        startPosition: leg.StartPosition,
        endPosition: leg.EndPosition,
        geometry: leg.Geometry?.LineString,
        steps: (leg.Steps || []).map((s: any) => ({
          distance: s.Distance,
          durationSeconds: s.DurationSeconds,
          startPosition: s.StartPosition,
          endPosition: s.EndPosition,
          geometry: s.Geometry?.LineString,
          travelMode: s.TravelMode,
          instruction: s.Guidance?.Instruction?.Text,
        })),
      }));
      const fullGeometry = result.Legs?.flatMap((l: any) => l.Geometry?.LineString || []) || [];
      return respond(200, {
        distance: result.Summary?.Distance,
        durationSeconds: result.Summary?.DurationSeconds,
        legs,
        geometry: fullGeometry,
      }, headers);
    }

    // POST /location/geofence/evaluate — BatchEvaluateGeofences
    if (path === '/location/geofence/evaluate' && method === 'POST') {
      const { deviceId, position, sampleTime } = body;
      if (!position) return respond(400, { message: 'position required' }, headers);
      const cmd = new BatchEvaluateGeofencesCommand({
        CollectionName: GEOFENCE_COLLECTION,
        DevicePositionUpdates: [{
          DeviceId: deviceId || 'default-device',
          Position: position,
          SampleTime: sampleTime || new Date().toISOString(),
        }],
      });
      const result = await client.send(cmd);
      return respond(200, {
        results: result.Errors || [],
      }, headers);
    }

    // POST /location/geofence — PutGeofence
    if (path === '/location/geofence' && method === 'POST') {
      const { geofenceId, geometry } = body;
      if (!geofenceId || !geometry) {
        return respond(400, { message: 'geofenceId and geometry required' }, headers);
      }
      const cmd = new PutGeofenceCommand({
        CollectionName: GEOFENCE_COLLECTION,
        GeofenceId: geofenceId,
        Geometry: geometry,
      });
      const result = await client.send(cmd);
      return respond(200, { geofenceId: result.GeofenceId, status: 'created' }, headers);
    }

    // DELETE /location/geofence/{geofenceId}
    if (path.startsWith('/location/geofence/') && method === 'DELETE') {
      const geofenceId = event.pathParameters?.geofenceId || proxy.split('/').pop();
      if (!geofenceId) return respond(400, { message: 'geofenceId required' }, headers);
      const cmd = new DeleteGeofenceCommand({
        CollectionName: GEOFENCE_COLLECTION,
        GeofenceId: geofenceId,
      });
      await client.send(cmd);
      return respond(200, { message: 'Geofence deleted' }, headers);
    }

    // GET /location/geofences
    if (path === '/location/geofences' && method === 'GET') {
      const cmd = new ListGeofencesCommand({
        CollectionName: GEOFENCE_COLLECTION,
        MaxResults: parseInt(queryParams.maxResults || '100'),
      });
      const result = await client.send(cmd);
      return respond(200, { entries: result.Entries || [] }, headers);
    }

    // POST /location/tracker/position — BatchUpdateDevicePosition
    if (path === '/location/tracker/position' && method === 'POST') {
      const { deviceId, position, sampleTime, accuracy } = body;
      if (!deviceId || !position) {
        return respond(400, { message: 'deviceId and position required' }, headers);
      }
      const cmd = new BatchUpdateDevicePositionCommand({
        TrackerName: TRACKER_NAME,
        Updates: [{
          DeviceId: deviceId,
          Position: position,
          SampleTime: sampleTime || new Date().toISOString(),
          Accuracy: accuracy,
        }],
      });
      const result = await client.send(cmd);
      return respond(200, { errors: result.Errors || [] }, headers);
    }

    // GET /location/tracker/position/{deviceId}
    if (path.startsWith('/location/tracker/position/') && method === 'GET') {
      const deviceId = event.pathParameters?.deviceId || proxy.split('/').pop();
      if (!deviceId) return respond(400, { message: 'deviceId required' }, headers);
      const cmd = new GetDevicePositionCommand({
        TrackerName: TRACKER_NAME,
        DeviceId: deviceId,
      });
      const result = await client.send(cmd);
      return respond(200, {
        deviceId: result.DeviceId,
        position: result.Position,
        sampleTime: result.SampleTime,
        accuracy: result.Accuracy,
        receivedTime: result.ReceivedTime,
      }, headers);
    }

    return respond(404, { message: 'Route not found' }, headers);
  } catch (err: any) {
    console.error('LocationService error:', err);
    return respond(500, { message: err.message || 'Internal error' }, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
  }
};

const respond = (statusCode: number, body: any, headers: any) => ({
  statusCode,
  headers,
  body: JSON.stringify(body),
});
