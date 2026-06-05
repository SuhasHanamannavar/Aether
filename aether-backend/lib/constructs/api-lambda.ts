import { Duration } from 'aws-cdk-lib';
import { Cors, LambdaIntegration, ResourceOptions, RestApi } from 'aws-cdk-lib/aws-apigateway';
import { IFunction, Runtime, StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface ApiLambdaProps {
  functionName: string;
  entry: string;
  environment?: Record<string, string>;
  api: RestApi;
  resourcePath: string;
  method?: string;
  allowCognitoAuth?: boolean;
  userPoolId?: string;
  memorySize?: number;
  timeout?: Duration;
}

export class ApiLambda extends Construct {
  public readonly lambda: NodejsFunction;
  public readonly integration: LambdaIntegration;

  constructor(scope: Construct, id: string, props: ApiLambdaProps) {
    super(scope, id);

    this.lambda = new NodejsFunction(this, 'Handler', {
      functionName: props.functionName,
      entry: props.entry,
      runtime: Runtime.NODEJS_22_X,
      memorySize: props.memorySize ?? 256,
      timeout: props.timeout ?? Duration.seconds(30),
      environment: {
        NODE_OPTIONS: '--enable-source-maps',
        ...props.environment,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'node22',
        externalModules: ['@aws-sdk/*'],
      },
      logRetention: RetentionDays.ONE_WEEK,
    });

    this.integration = new LambdaIntegration(this.lambda, {
      proxy: true,
    });
  }
}

export function configureCors(api: RestApi): void {
  const corsOptions: ResourceOptions = {
    defaultCorsPreflightOptions: {
      allowOrigins: Cors.ALL_ORIGINS,
      allowMethods: Cors.ALL_METHODS,
      allowHeaders: [
        'Content-Type',
        'X-Amz-Date',
        'Authorization',
        'X-Api-Key',
        'X-Amz-Security-Token',
        'x-amz-user-agent',
      ],
      allowCredentials: true,
      maxAge: Duration.days(1),
    },
  };

  (api.node.defaultChild as any).defaultCorsPreflightOptions = corsOptions;
}
