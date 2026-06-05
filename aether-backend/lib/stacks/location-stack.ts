import { Duration, Fn, Stack, StackProps } from 'aws-cdk-lib';
import { IRestApi, RestApi } from 'aws-cdk-lib/aws-apigateway';
import {
  CfnPlaceIndex,
  CfnRouteCalculator,
  CfnGeofenceCollection,
  CfnTracker,
} from 'aws-cdk-lib/aws-location';
import { PolicyStatement, Effect } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { ApiLambda } from '../constructs/api-lambda';

interface LocationStackProps extends StackProps {
  appName: string;
}

export class LocationStack extends Stack {
  public readonly placeIndex: CfnPlaceIndex;
  public readonly routeCalculator: CfnRouteCalculator;
  public readonly geofenceCollection: CfnGeofenceCollection;
  public readonly tracker: CfnTracker;
  public readonly api: IRestApi;

  constructor(scope: Construct, id: string, props: LocationStackProps) {
    super(scope, id, props);

    this.api = RestApi.fromRestApiAttributes(this, 'SharedApi', {
      restApiId: Fn.importValue(`${props.appName}ApiId`),
      rootResourceId: Fn.importValue(`${props.appName}ApiRootResourceId`),
    });

    // --- Amazon Location Resources ---
    this.placeIndex = new CfnPlaceIndex(this, 'PlaceIndex', {
      dataSource: 'Esri',
      indexName: `${props.appName}PlaceIndex`,
      description: 'Place search index for Zelo travel app',
      pricingPlan: 'RequestBasedUsage',
    });

    this.routeCalculator = new CfnRouteCalculator(this, 'RouteCalculator', {
      calculatorName: `${props.appName}RouteCalculator`,
      description: 'Route calculator for Zelo travel app',
      pricingPlan: 'RequestBasedUsage',
      dataSource: 'Esri',
    });

    this.geofenceCollection = new CfnGeofenceCollection(this, 'GeofenceCollection', {
      collectionName: `${props.appName}GeofenceCollection`,
      description: 'Geofence collection for Zelo travel app',
      pricingPlan: 'RequestBasedUsage',
    });

    this.tracker = new CfnTracker(this, 'Tracker', {
      trackerName: `${props.appName}Tracker`,
      description: 'Device tracker for Zelo travel app',
      pricingPlan: 'RequestBasedUsage',
      positionFiltering: 'TimeBased',
    });

    // --- Lambda ---
    const locationService = new ApiLambda(this, 'LocationService', {
      functionName: `${props.appName}LocationService`,
      entry: 'lambdas/location-service/index.ts',
      api: this.api,
      resourcePath: '/location',
      environment: {
        PLACE_INDEX_NAME: this.placeIndex.indexName,
        ROUTE_CALCULATOR_NAME: this.routeCalculator.calculatorName,
        GEOFENCE_COLLECTION_NAME: this.geofenceCollection.collectionName,
        TRACKER_NAME: this.tracker.trackerName,
      },
      timeout: Duration.seconds(30),
      memorySize: 256,
    });

    // Grant Location Service permissions
    locationService.lambda.addToRolePolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        'geo:SearchPlaceIndexForText',
        'geo:SearchPlaceIndexForPosition',
        'geo:CalculateRoute',
        'geo:BatchEvaluateGeofences',
        'geo:PutGeofence',
        'geo:DeleteGeofence',
        'geo:ListGeofences',
        'geo:BatchUpdateDevicePosition',
        'geo:GetDevicePosition',
        'geo:ListDevicePositions',
      ],
      resources: ['*'],
    }));

    // API routes
    const locationResource = this.api.root.addResource('location');
    const proxyResource = locationResource.addResource('{proxy+}');
    proxyResource.addMethod('ANY', locationService.integration);
  }
}
