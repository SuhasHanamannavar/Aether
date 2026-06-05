import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';

export const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));

export const respond = (statusCode: number, body: any, headers?: any) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*', ...headers },
  body: JSON.stringify(body),
});

export const getUserId = (event: any): string | undefined =>
  event.requestContext?.authorizer?.claims?.sub;

export const parseBody = (event: any): any => {
  try { return event.body ? JSON.parse(event.body) : {}; } catch { return {}; }
};
