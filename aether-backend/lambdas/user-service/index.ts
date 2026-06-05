import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  AdminGetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const cognito = new CognitoIdentityProviderClient({});

const USERS_TABLE = process.env.USERS_TABLE!;
const USER_POOL_ID = process.env.USER_POOL_ID!;
const CLIENT_ID = process.env.CLIENT_ID!;

export const handler = async (event: any) => {
  try {
    const path = event.resource;
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};
    const userId = event.pathParameters?.userId;
    const authUserId = event.headers?.['x-user-id'] || event.headers?.['X-User-Id'];
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

    // --- Auth routes (no auth required) ---
    if (path === '/auth/signup' && method === 'POST') {
      const { email, password, givenName, familyName } = body;
      await cognito.send(new SignUpCommand({
        ClientId: CLIENT_ID,
        Username: email,
        Password: password,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'given_name', Value: givenName || '' },
          { Name: 'family_name', Value: familyName || '' },
        ],
      }));
      return respond(200, { message: 'Sign-up successful. Check email for confirmation code.' }, headers);
    }

    if (path === '/auth/confirm' && method === 'POST') {
      const { email, code } = body;
      await cognito.send(new ConfirmSignUpCommand({
        ClientId: CLIENT_ID,
        Username: email,
        ConfirmationCode: code,
      }));
      return respond(200, { message: 'Email confirmed. You can now log in.' }, headers);
    }

    if (path === '/auth/login' && method === 'POST') {
      const { email, password } = body;
      const result = await cognito.send(new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: CLIENT_ID,
        AuthParameters: { USERNAME: email, PASSWORD: password },
      }));
      return respond(200, {
        accessToken: result.AuthenticationResult?.AccessToken,
        idToken: result.AuthenticationResult?.IdToken,
        refreshToken: result.AuthenticationResult?.RefreshToken,
        expiresIn: result.AuthenticationResult?.ExpiresIn,
      }, headers);
    }

    // --- Protected routes (auth required) ---
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
    const statusCode = err.name === 'UserNotFoundException' || err.name === 'NotAuthorizedException' ? 401 : 500;
    return respond(statusCode, { message: err.message || 'Internal error' }, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  }
};

const respond = (statusCode: number, body: any, headers: any) => ({
  statusCode,
  headers,
  body: JSON.stringify(body),
});
