import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { UserPool } from 'aws-cdk-lib/aws-cognito';
import { AttributeType, ProjectionType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { RestApi, CognitoUserPoolsAuthorizer, AuthorizationType } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { ApiLambda, configureCors } from '../constructs/api-lambda';
import { DynamoTable } from '../constructs/dynamo-table';

interface TripStackProps extends StackProps {
  appName: string;
  userPool: UserPool;
}

export class TripStack extends Stack {
  public readonly tripTable: Table;
  public readonly api: RestApi;
  public readonly authorizer: CognitoUserPoolsAuthorizer;

  constructor(scope: Construct, id: string, props: TripStackProps) {
    super(scope, id, props);

    this.api = new RestApi(this, 'TripApi', {
      restApiName: `${props.appName}TripApi`,
      description: 'Zelo Trip Service',
      deployOptions: { stageName: 'v1' },
    });
    configureCors(this.api);

    this.authorizer = new CognitoUserPoolsAuthorizer(this, 'TripAuthorizer', {
      cognitoUserPools: [props.userPool],
      authorizerName: `${props.appName}TripAuthorizer`,
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

    // --- Lambda: TripService ---
    const tripService = new ApiLambda(this, 'TripService', {
      functionName: `${props.appName}TripService`,
      entry: 'lambdas/trip-service/index.ts',
      api: this.api,
      resourcePath: '/trips',
      environment: {
        TRIPS_TABLE: this.tripTable.tableName,
        ITINERARY_TABLE: itineraryTable.tableName,
      },
      timeout: Duration.seconds(60),
      memorySize: 512,
    });

    this.tripTable.grantReadWriteData(tripService.lambda);
    itineraryTable.grantReadWriteData(tripService.lambda);

    // --- API Routes ---
    const auth: any = { authorizer: this.authorizer, authorizationType: AuthorizationType.COGNITO };

    // /trips
    const tripsResource = this.api.root.addResource('trips');
    tripsResource.addMethod('POST', tripService.integration, auth);
    tripsResource.addMethod('GET', tripService.integration, auth);

    // /trips/{id}
    const tripResource = tripsResource.addResource('{tripId}');
    tripResource.addMethod('GET', tripService.integration, auth);
    tripResource.addMethod('PUT', tripService.integration, auth);

    // /trips/{id}/canvas
    const canvasResource = tripResource.addResource('canvas');
    canvasResource.addMethod('GET', tripService.integration, auth);
    const generateCanvas = tripResource.addResource('generate-canvas');
    generateCanvas.addMethod('POST', tripService.integration, auth);

    // /trips/{id}/itinerary
    const itineraryResource = tripResource.addResource('itinerary');
    itineraryResource.addMethod('GET', tripService.integration, auth);

    // /trips/{id}/itinerary/reorder
    const reorderResource = itineraryResource.addResource('reorder');
    reorderResource.addMethod('PUT', tripService.integration, auth);

    // /trips/{id}/restaurants
    const restaurantsResource = tripResource.addResource('restaurants');
    restaurantsResource.addMethod('GET', tripService.integration, auth);

    // /trips/{id}/bookings
    const bookingsResource = tripResource.addResource('bookings');
    bookingsResource.addMethod('GET', tripService.integration, auth);

    // /trips/{id}/prep
    const prepResource = tripResource.addResource('prep');
    prepResource.addMethod('GET', tripService.integration, auth);

    // /trips/{id}/packing
    const packingResource = tripResource.addResource('packing');
    packingResource.addMethod('GET', tripService.integration, auth);

    // /trips/{id}/feedback
    const feedbackSubResource = tripResource.addResource('feedback');
    feedbackSubResource.addMethod('POST', tripService.integration, auth);

    new CfnOutput(this, 'TripApiUrl', { value: this.api.url });
  }
}

import { Duration } from 'aws-cdk-lib';
