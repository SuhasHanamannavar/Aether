import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

const USERS_TABLE = process.env.USERS_TABLE!;

export const handler = async (event: any) => {
  try {
    const path = event.resource;
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};
    const userId = event.pathParameters?.userId;
    const authUserId = event.headers?.['x-user-id'] || event.headers?.['X-User-Id'];
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

    // --- All routes use x-user-id header auth ---
    if (!authUserId) {
      return respond(401, { message: 'Unauthorized' }, headers);
    }

    // POST /users — Create user profile
    if (path === '/users' && method === 'POST') {
      const { email, travelerType, preferences } = body;
      const now = new Date().toISOString();
      await ddb.send(new PutCommand({
        TableName: USERS_TABLE,
        Item: {
          userId: authUserId,
          email: email || '',
          travelerType: travelerType || null,
          preferences: preferences || {},
          integrations: {},
          onboardingComplete: false,
          createdAt: now,
          updatedAt: now,
        },
        ConditionExpression: 'attribute_not_exists(userId)',
      }));
      return respond(200, { userId: authUserId, message: 'User created' }, headers);
    }

    // GET /users/{userId}
    if (path === '/users/{userId}' && method === 'GET') {
      if (userId !== authUserId) {
        return respond(403, { message: 'Forbidden' }, headers);
      }
      const result = await ddb.send(new GetCommand({
        TableName: USERS_TABLE,
        Key: { userId },
      }));
      if (!result.Item) {
        return respond(404, { message: 'User not found' }, headers);
      }
      return respond(200, result.Item, headers);
    }

    // PUT /users/{userId}
    if (path === '/users/{userId}' && method === 'PUT') {
      if (userId !== authUserId) {
        return respond(403, { message: 'Forbidden' }, headers);
      }
      const updates: string[] = [];
      const exprValues: any = {};
      const exprNames: any = {};

      for (const [key, value] of Object.entries(body)) {
        if (['travelerType', 'preferences', 'onboardingComplete'].includes(key)) {
          updates.push(`#${key} = :${key}`);
          exprNames[`#${key}`] = key;
          exprValues[`:${key}`] = value;
        }
      }

      if (updates.length === 0) {
        return respond(400, { message: 'No valid fields to update' }, headers);
      }

      exprValues[':updatedAt'] = new Date().toISOString();
      updates.push('#updatedAt = :updatedAt');
      exprNames['#updatedAt'] = 'updatedAt';

      await ddb.send(new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { userId },
        UpdateExpression: `SET ${updates.join(', ')}`,
        ExpressionAttributeNames: exprNames,
        ExpressionAttributeValues: exprValues,
        ReturnValues: 'ALL_NEW',
      }));

      const result = await ddb.send(new GetCommand({
        TableName: USERS_TABLE,
        Key: { userId },
      }));
      return respond(200, result.Item, headers);
    }

    // PUT /users/{userId}/integrations
    if (path === '/users/{userId}/integrations' && method === 'PUT') {
      if (userId !== authUserId) {
        return respond(403, { message: 'Forbidden' }, headers);
      }
      await ddb.send(new UpdateCommand({
        TableName: USERS_TABLE,
        Key: { userId },
        UpdateExpression: 'SET integrations = :integrations, #updatedAt = :updatedAt',
        ExpressionAttributeNames: { '#updatedAt': 'updatedAt' },
        ExpressionAttributeValues: {
          ':integrations': body.integrations || {},
          ':updatedAt': new Date().toISOString(),
        },
      }));
      return respond(200, { message: 'Integrations updated' }, headers);
    }

    return respond(404, { message: 'Route not found' }, headers);
  } catch (err: any) {
    console.error('UserService error:', err);
    return respond(500, { message: err.message || 'Internal error' }, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  }
};

const respond = (statusCode: number, body: any, headers: any) => ({
  statusCode,
  headers,
  body: JSON.stringify(body),
});
