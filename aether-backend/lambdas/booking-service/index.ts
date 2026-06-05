import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { v4 as uuidv4 } from 'uuid';
import * as QRCode from 'qrcode';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const s3 = new S3Client({});
const sqs = new SQSClient({});

const BOOKINGS_TABLE = process.env.BOOKINGS_TABLE!;
const FEEDBACK_TABLE = process.env.FEEDBACK_TABLE!;
const PREP_TABLE = process.env.PREP_TABLE!;
const BOOKING_QUEUE_URL = process.env.BOOKING_QUEUE_URL!;
const ASSETS_BUCKET = process.env.ASSETS_BUCKET!;
const REGION = process.env.REGION!;

export const handler = async (event: any) => {
  try {
    const path = event.resource;
    const method = event.httpMethod;
    const body = event.body ? JSON.parse(event.body) : {};
    const bookingId = event.pathParameters?.bookingId;
    const authUserId = event.headers?.['x-user-id'] || event.headers?.['X-User-Id'];
    const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

    // POST /bookings — Create booking quote
    if (path === '/bookings' && method === 'POST') {
      const id = uuidv4();
      const now = new Date().toISOString();
      const booking = {
        bookingId: id,
        tripId: body.tripId,
        userId: authUserId,
        items: body.items || [],
        subtotal: body.subtotal || 0,
        taxes: body.taxes || 0,
        total: body.total || 0,
        currency: 'USD',
        paymentMethod: body.paymentMethod || null,
        paymentIntentId: null,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };
      await ddb.send(new PutCommand({ TableName: BOOKINGS_TABLE, Item: booking }));
      return respond(200, booking, headers);
    }

    // POST /bookings/{bookingId} — Confirm booking
    if (path === '/bookings/{bookingId}' && method === 'POST') {
      // In production: trigger Stripe payment + Step Function
      // For H0: confirm directly and generate QR
      const qrData = JSON.stringify({ bookingId, userId: authUserId, timestamp: new Date().toISOString() });
      const qrBuffer = await QRCode.toBuffer(qrData);
      const qrKey = `qrs/${bookingId}.png`;

      await s3.send(new PutObjectCommand({
        Bucket: ASSETS_BUCKET,
        Key: qrKey,
        Body: qrBuffer,
        ContentType: 'image/png',
      }));

      const qrUrl = `https://${ASSETS_BUCKET}.s3.${REGION}.amazonaws.com/${qrKey}`;

      await ddb.send(new UpdateCommand({
        TableName: BOOKINGS_TABLE,
        Key: { bookingId },
        UpdateExpression: 'SET #status = :s, qrUrl = :q, #updatedAt = :u',
        ExpressionAttributeNames: { '#status': 'status', '#updatedAt': 'updatedAt' },
        ExpressionAttributeValues: { ':s': 'confirmed', ':q': qrUrl, ':u': new Date().toISOString() },
      }));

      // Send to SQS for async processing
      await sqs.send(new SendMessageCommand({
        QueueUrl: BOOKING_QUEUE_URL,
        MessageBody: JSON.stringify({ bookingId, userId: authUserId, action: 'booking_confirmed' }),
      }));

      return respond(200, { bookingId, status: 'confirmed', qrUrl, message: 'Booking confirmed!' }, headers);
    }

    // GET /bookings — List user bookings
    if (path === '/bookings' && method === 'GET') {
      const result = await ddb.send(new QueryCommand({
        TableName: BOOKINGS_TABLE,
        IndexName: 'ByUser',
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': authUserId },
        ScanIndexForward: false,
      }));
      return respond(200, result.Items || [], headers);
    }

    // GET /bookings/{bookingId}
    if (path === '/bookings/{bookingId}' && method === 'GET') {
      const result = await ddb.send(new GetCommand({
        TableName: BOOKINGS_TABLE,
        Key: { bookingId },
      }));
      if (!result.Item) return respond(404, { message: 'Booking not found' }, headers);
      return respond(200, result.Item, headers);
    }

    // POST /webhooks/stripe — Stripe callback
    if (path === '/webhooks/stripe') {
      const sessionId = body.data?.object?.id;
      const paymentIntent = body.data?.object?.payment_intent;
      console.log('Stripe webhook:', { sessionId, paymentIntent });
      return respond(200, { received: true }, headers);
    }

    // POST /feedback
    if (path === '/feedback' && method === 'POST') {
      const feedback = {
        feedbackId: uuidv4(),
        tripId: body.tripId,
        userId: authUserId,
        ratings: body.ratings || [],
        review: body.review || '',
        createdAt: new Date().toISOString(),
      };
      await ddb.send(new PutCommand({ TableName: FEEDBACK_TABLE, Item: feedback }));
      return respond(200, { message: 'Thank you for your feedback!', feedbackId: feedback.feedbackId }, headers);
    }

    // GET /prep/{tripId} — Get checklist state
    if (path === '/prep/{tripId}' && method === 'GET') {
      const tripId = event.pathParameters?.tripId;
      const result = await ddb.send(new QueryCommand({
        TableName: PREP_TABLE,
        KeyConditionExpression: 'tripId = :tid',
        ExpressionAttributeValues: { ':tid': tripId },
      }));
      return respond(200, result.Items || [], headers);
    }

    // PUT /prep/{tripId}/{itemId} — Mark checklist complete
    if (path === '/prep/{tripId}/{itemId}' && method === 'PUT') {
      const tripId = event.pathParameters?.tripId;
      const itemId = event.pathParameters?.itemId;
      const { completed } = body;
      await ddb.send(new PutCommand({
        TableName: PREP_TABLE,
        Item: {
          tripId,
          itemId,
          completed: completed ?? true,
          updatedAt: new Date().toISOString(),
        },
      }));
      return respond(200, { message: 'Checklist updated' }, headers);
    }

    return respond(404, { message: 'Route not found' }, headers);
  } catch (err: any) {
    console.error('BookingService error:', err);
    return respond(500, { message: err.message || 'Internal error' }, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
  }
};

const respond = (statusCode: number, body: any, headers: any) => ({
  statusCode,
  headers,
  body: JSON.stringify(body),
});
