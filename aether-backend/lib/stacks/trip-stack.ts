import { Duration, Fn, Stack, StackProps } from 'aws-cdk-lib';
import { AttributeType, ProjectionType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { IRestApi, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam';
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
        PLACE_INDEX_NAME: `${props.appName}PlaceIndex`,
      },
      timeout: Duration.seconds(60),
      memorySize: 512,
    });

    this.tripTable.grantReadWriteData(tripService.lambda);
    itineraryTable.grantReadWriteData(tripService.lambda);
    expensesTable.grantReadWriteData(tripService.lambda);
    memoriesTable.grantReadWriteData(tripService.lambda);

    // Location Service permission for place search
    tripService.lambda.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['geo:SearchPlaceIndexForText'],
      resources: ['*'],
    }));

    // --- API Routes ---

    // /trips — list & create
    const tripsResource = this.api.root.addResource('trips');
    tripsResource.addMethod('POST', tripService.integration);
    tripsResource.addMethod('GET', tripService.integration);

    // /trips/{tripId} — get & update
    const tripResource = tripsResource.addResource('{tripId}');
    tripResource.addMethod('GET', tripService.integration);
    tripResource.addMethod('PUT', tripService.integration);

    // /trips/{tripId}/{proxy+} — all sub-routes (reduces Lambda permission count)
    const proxyResource = tripResource.addResource('{proxy+}');
    proxyResource.addMethod('ANY', tripService.integration);

  }
}
