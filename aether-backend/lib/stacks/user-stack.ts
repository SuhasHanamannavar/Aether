import { CfnOutput, Stack, StackProps } from 'aws-cdk-lib';
import { UserPool, UserPoolClient, CfnIdentityPool } from 'aws-cdk-lib/aws-cognito';
import { AttributeType, ProjectionType } from 'aws-cdk-lib/aws-dynamodb';
import { RestApi, CognitoUserPoolsAuthorizer, AuthorizationType } from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
import { ApiLambda, configureCors } from '../constructs/api-lambda';
import { DynamoTable } from '../constructs/dynamo-table';

interface UserStackProps extends StackProps {
  appName: string;
  userPool: UserPool;
  userPoolClient: UserPoolClient;
}

export class UserStack extends Stack {
  public readonly api: RestApi;
  public readonly authorizer: CognitoUserPoolsAuthorizer;

  constructor(scope: Construct, id: string, props: UserStackProps) {
    super(scope, id, props);

    // --- API Gateway ---
    this.api = new RestApi(this, 'UserApi', {
      restApiName: `${props.appName}UserApi`,
      description: 'Zelo User & Auth Service',
      deployOptions: { stageName: 'v1' },
    });
    configureCors(this.api);

    // --- Cognito Authorizer ---
    this.authorizer = new CognitoUserPoolsAuthorizer(this, 'UserPoolAuthorizer', {
      cognitoUserPools: [props.userPool],
      authorizerName: `${props.appName}Authorizer`,
    });

    // --- DynamoDB: Users ---
    const usersTable = new DynamoTable(this, 'UsersTable', {
      tableName: `${props.appName}Users`,
      partitionKey: { name: 'userId', type: AttributeType.STRING },
      globalSecondaryIndexes: [
        {
          indexName: 'ByEmail',
          partitionKey: { name: 'email', type: AttributeType.STRING },
          projectionType: ProjectionType.ALL,
        },
      ],
    });

    // --- Lambda: UserService ---
    const userService = new ApiLambda(this, 'UserService', {
      functionName: `${props.appName}UserService`,
      entry: 'lambdas/user-service/index.ts',
      api: this.api,
      resourcePath: '/users',
      environment: {
        USERS_TABLE: usersTable.table.tableName,
        USER_POOL_ID: props.userPool.userPoolId,
        CLIENT_ID: props.userPoolClient.userPoolClientId,
      },
    });

    usersTable.table.grantReadWriteData(userService.lambda);

    // --- API Routes ---

    // Auth endpoints (no auth required)
    const authResource = this.api.root.addResource('auth');
    const signUp = authResource.addResource('signup');
    signUp.addMethod('POST', userService.integration);

    const confirm = authResource.addResource('confirm');
    confirm.addMethod('POST', userService.integration);

    const login = authResource.addResource('login');
    login.addMethod('POST', userService.integration);

    // User endpoints (auth required)
    const usersResource = this.api.root.addResource('users');
    const userResource = usersResource.addResource('{userId}');

    usersResource.addMethod('POST', userService.integration, {
      authorizer: this.authorizer,
      authorizationType: AuthorizationType.COGNITO,
    });

    userResource.addMethod('GET', userService.integration, {
      authorizer: this.authorizer,
      authorizationType: AuthorizationType.COGNITO,
    });

    userResource.addMethod('PUT', userService.integration, {
      authorizer: this.authorizer,
      authorizationType: AuthorizationType.COGNITO,
    });

    const integrationsResource = userResource.addResource('integrations');
    integrationsResource.addMethod('PUT', userService.integration, {
      authorizer: this.authorizer,
      authorizationType: AuthorizationType.COGNITO,
    });

    new CfnOutput(this, 'ApiUrl', { value: this.api.url });
  }
}
