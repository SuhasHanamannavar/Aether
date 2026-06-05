import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand } from '@aws-sdk/lib-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const sns = new SNSClient({});

const TRIPS_TABLE = process.env.TRIPS_TABLE!;
const TOPIC_ARN = process.env.TOPIC_ARN!;

export const handler = async (event: any) => {
  try {
    console.log('Notification check triggered:', JSON.stringify(event));

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Scan for trips starting in 7 days
    const trips = await ddb.send(new ScanCommand({
      TableName: TRIPS_TABLE,
      FilterExpression: 'dateStart = :weekFromNow OR dateStart = :today',
      ExpressionAttributeValues: {
        ':weekFromNow': sevenDaysFromNow,
        ':today': today,
      },
    }));

    for (const trip of trips.Items || []) {
      let message = '';

      if (trip.dateStart === sevenDaysFromNow) {
        message = `Your trip to ${trip.destination} is one week away! Start preparing in the Prep Hub.`;
      } else if (trip.dateStart === today) {
        message = `Today is the day! Your trip to ${trip.destination} starts. Check your itinerary for details.`;
      }

      if (message) {
        console.log(`Notifying user ${trip.userId}: ${message}`);
        // In production: fetch user's push token from User table and send SNS platform endpoint
        // For H0: log the notification
      }
    }

    return { statusCode: 200, body: JSON.stringify({ checked: true, tripsFound: trips.Items?.length || 0 }) };
  } catch (err: any) {
    console.error('NotificationHandler error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
