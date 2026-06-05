import { Duration, Fn, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { IRestApi, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { ApiLambda } from '../constructs/api-lambda';
import { DynamoTable } from '../constructs/dynamo-table';
import { Bucket, HttpMethods } from 'aws-cdk-lib/aws-s3';
import { SqsDestination } from 'aws-cdk-lib/aws-lambda-destinations';
import { Queue } from 'aws-cdk-lib/aws-sqs';

interface BookingStackProps extends StackProps {
  appName: string;
  userPool: UserPool;
}

export class BookingStack extends Stack {
  public readonly api: IRestApi;

  constructor(scope: Construct, id: string, props: BookingStackProps) {
    super(scope, id, props);

    this.api = RestApi.fromRestApiAttributes(this, 'SharedApi', {
      restApiId: Fn.importValue(`${props.appName}ApiId`),
      rootResourceId: Fn.importValue(`${props.appName}ApiRootResourceId`),
    });

    // --- DynamoDB: Bookings ---
    const bookingsTable = new DynamoTable(this, 'BookingsTable', {
      tableName: `${props.appName}Bookings`,
      partitionKey: { name: 'bookingId', type: AttributeType.STRING },
      globalSecondaryIndexes: [
        {
          indexName: 'ByTrip',
          partitionKey: { name: 'tripId', type: AttributeType.STRING },
        },
        {
          indexName: 'ByUser',
          partitionKey: { name: 'userId', type: AttributeType.STRING },
        },
      ],
    }).table;

    // --- DynamoDB: Feedback ---
    const feedbackTable = new DynamoTable(this, 'FeedbackTable', {
      tableName: `${props.appName}Feedback`,
      partitionKey: { name: 'feedbackId', type: AttributeType.STRING },
      globalSecondaryIndexes: [
        {
          indexName: 'ByTrip',
          partitionKey: { name: 'tripId', type: AttributeType.STRING },
        },
      ],
    }).table;

    // --- DynamoDB: PrepChecklist ---
    const prepTable = new DynamoTable(this, 'PrepChecklistTable', {
      tableName: `${props.appName}PrepChecklist`,
      partitionKey: { name: 'tripId', type: AttributeType.STRING },
      sortKey: { name: 'itemId', type: AttributeType.STRING },
    }).table;

    // --- S3: Booking Assets (QR codes) ---
    const bookingAssetsBucket = new Bucket(this, 'BookingAssetsBucket', {
      bucketName: `${props.appName.toLowerCase()}-booking-assets-${this.account}`,
      cors: [{
        allowedMethods: [HttpMethods.GET, HttpMethods.PUT],
        allowedOrigins: ['*'],
        allowedHeaders: ['*'],
        maxAge: 3600,
      }],
      autoDeleteObjects: true,
      removalPolicy: cdkRemovalPolicy,
    });

    // --- SQS: Async booking queue ---
    const bookingQueue = new Queue(this, 'BookingQueue', {
      queueName: `${props.appName}BookingQueue`,
      visibilityTimeout: Duration.seconds(300),
      retentionPeriod: Duration.days(1),
    });

    // --- Lambda: BookingService ---
    const bookingService = new ApiLambda(this, 'BookingService', {
      functionName: `${props.appName}BookingService`,
      entry: 'lambdas/booking-service/index.ts',
      api: this.api,
      resourcePath: '/bookings',
      environment: {
        BOOKINGS_TABLE: bookingsTable.tableName,
        FEEDBACK_TABLE: feedbackTable.tableName,
        PREP_TABLE: prepTable.tableName,
        BOOKING_QUEUE_URL: bookingQueue.queueUrl,
        ASSETS_BUCKET: bookingAssetsBucket.bucketName,
        REGION: this.region,
      },
      timeout: Duration.seconds(60),
      memorySize: 512,
    });

    bookingsTable.grantReadWriteData(bookingService.lambda);
    feedbackTable.grantReadWriteData(bookingService.lambda);
    prepTable.grantReadWriteData(bookingService.lambda);
    bookingQueue.grantSendMessages(bookingService.lambda);
    bookingAssetsBucket.grantPut(bookingService.lambda);
    bookingAssetsBucket.grantRead(bookingService.lambda);

    // --- API Routes ---

    // /bookings
    const bookingsResource = this.api.root.addResource('bookings');
    bookingsResource.addMethod('POST', bookingService.integration);
    bookingsResource.addMethod('GET', bookingService.integration);
    const bookingResource = bookingsResource.addResource('{bookingId}');
    bookingResource.addMethod('GET', bookingService.integration);
    bookingResource.addMethod('POST', bookingService.integration); // confirm

    // /webhooks/stripe
    const webhooksResource = this.api.root.addResource('webhooks');
    const stripeWebhook = webhooksResource.addResource('stripe');
    stripeWebhook.addMethod('POST', bookingService.integration);

    // /feedback
    const feedbackResource = this.api.root.addResource('feedback');
    feedbackResource.addMethod('POST', bookingService.integration);
    const prepResource = this.api.root.addResource('prep');
    const prepTripResource = prepResource.addResource('{tripId}');
    prepTripResource.addMethod('GET', bookingService.integration);
    const prepItemResource = prepTripResource.addResource('{itemId}');
    prepItemResource.addMethod('PUT', bookingService.integration);

  }
}

const cdkRemovalPolicy = RemovalPolicy.DESTROY;
