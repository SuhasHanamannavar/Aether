import { Duration, Fn, Stack, StackProps } from 'aws-cdk-lib';
import { AttributeType, ProjectionType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { IRestApi, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { ApiLambda } from '../constructs/api-lambda';
import { DynamoTable } from '../constructs/dynamo-table';

interface TripStackProps extends StackProps {
  appName: string;
}

export class TripStack extends Stack {
  public readonly tripTable: Table;
  public readonly api: IRestApi;

  constructor(scope: Construct, id: string, props: TripStackProps) {
    super(scope, id, props);

    this.api = RestApi.fromRestApiAttributes(this, 'SharedApi', {
      restApiId: Fn.importValue(`${props.appName}ApiId`),
      rootResourceId: Fn.importValue(`${props.appName}ApiRootResourceId`),
    });

    // --- DynamoDB: Trips ---
    this.tripTable = new DynamoTable(this, 'TripsTable', {
      tableName: `${props.appName}Trips`,
      partitionKey: { name: 'tripId', type: AttributeType.STRING },
      globalSecondaryIndexes: [
        {
          indexName: 'ByUser',
          partitionKey: { name: 'userId', type: AttributeType.STRING },
          sortKey: { name: 'status', type: AttributeType.STRING },
          projectionType: ProjectionType.ALL,
        },
      ],
    }).table;

    // --- DynamoDB: ItineraryItems ---
    const itineraryTable = new DynamoTable(this, 'ItineraryTable', {
      tableName: `${props.appName}ItineraryItems`,
      partitionKey: { name: 'itemId', type: AttributeType.STRING },
      globalSecondaryIndexes: [
        {
          indexName: 'ByTrip',
          partitionKey: { name: 'tripId', type: AttributeType.STRING },
          sortKey: { name: 'day', type: AttributeType.NUMBER },
          projectionType: ProjectionType.ALL,
        },
      ],
    }).table;

    // --- DynamoDB: Expenses ---
    const expensesTable = new DynamoTable(this, 'ExpensesTable', {
      tableName: `${props.appName}Expenses`,
      partitionKey: { name: 'expenseId', type: AttributeType.STRING },
      globalSecondaryIndexes: [
        {
          indexName: 'ByTrip',
          partitionKey: { name: 'tripId', type: AttributeType.STRING },
          sortKey: { name: 'createdAt', type: AttributeType.STRING },
          projectionType: ProjectionType.ALL,
        },
      ],
    }).table;

    // --- DynamoDB: Memories ---
    const memoriesTable = new DynamoTable(this, 'MemoriesTable', {
      tableName: `${props.appName}Memories`,
      partitionKey: { name: 'memoryId', type: AttributeType.STRING },
      globalSecondaryIndexes: [
        {
          indexName: 'ByTrip',
          partitionKey: { name: 'tripId', type: AttributeType.STRING },
          sortKey: { name: 'day', type: AttributeType.NUMBER },
          projectionType: ProjectionType.ALL,
        },
      ],
    }).table;

    // --- Lambda: TripService ---
    const tripService = new ApiLambda(this, 'TripService', {
      functionName: `${props.appName}TripService`,
      entry: 'lambdas/trip-service/index.ts',
      api: this.api,
      resourcePath: '/trips',
      environment: {
        TRIPS_TABLE: this.tripTable.tableName,
        ITINERARY_TABLE: itineraryTable.tableName,
        EXPENSES_TABLE: expensesTable.tableName,
        MEMORIES_TABLE: memoriesTable.tableName,
      },
      timeout: Duration.seconds(60),
      memorySize: 512,
    });

    this.tripTable.grantReadWriteData(tripService.lambda);
    itineraryTable.grantReadWriteData(tripService.lambda);
    expensesTable.grantReadWriteData(tripService.lambda);
    memoriesTable.grantReadWriteData(tripService.lambda);

    // --- API Routes ---

    // /trips
    const tripsResource = this.api.root.addResource('trips');
    tripsResource.addMethod('POST', tripService.integration);
    tripsResource.addMethod('GET', tripService.integration);

    // /trips/{id}
    const tripResource = tripsResource.addResource('{tripId}');
    tripResource.addMethod('GET', tripService.integration);
    tripResource.addMethod('PUT', tripService.integration);

    // /trips/{id}/canvas
    const canvasResource = tripResource.addResource('canvas');
    canvasResource.addMethod('GET', tripService.integration);
    const generateCanvas = tripResource.addResource('generate-canvas');
    generateCanvas.addMethod('POST', tripService.integration);

    // /trips/{id}/itinerary
    const itineraryResource = tripResource.addResource('itinerary');
    itineraryResource.addMethod('GET', tripService.integration);

    // /trips/{id}/itinerary/reorder
    const reorderResource = itineraryResource.addResource('reorder');
    reorderResource.addMethod('PUT', tripService.integration);

    // /trips/{id}/restaurants
    const restaurantsResource = tripResource.addResource('restaurants');
    restaurantsResource.addMethod('GET', tripService.integration);

    // /trips/{id}/bookings
    const bookingsResource = tripResource.addResource('bookings');
    bookingsResource.addMethod('GET', tripService.integration);

    // /trips/{id}/prep
    const prepResource = tripResource.addResource('prep');
    prepResource.addMethod('GET', tripService.integration);

    // /trips/{id}/packing
    const packingResource = tripResource.addResource('packing');
    packingResource.addMethod('GET', tripService.integration);

    // /trips/{id}/feedback
    const feedbackSubResource = tripResource.addResource('feedback');
    feedbackSubResource.addMethod('POST', tripService.integration);

    // /trips/{id}/expenses
    const expensesResource = tripResource.addResource('expenses');
    expensesResource.addMethod('POST', tripService.integration);
    expensesResource.addMethod('GET', tripService.integration);
    const expenseResource = expensesResource.addResource('{expenseId}');
    expenseResource.addMethod('DELETE', tripService.integration);

    // /trips/{id}/memories
    const memoriesResource = tripResource.addResource('memories');
    memoriesResource.addMethod('POST', tripService.integration);
    memoriesResource.addMethod('GET', tripService.integration);
    const memoryResource = memoriesResource.addResource('{memoryId}');
    memoryResource.addMethod('DELETE', tripService.integration);

  }
}
