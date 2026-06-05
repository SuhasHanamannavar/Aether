import { CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import {
  UserPool,
  UserPoolClient,
  AccountRecovery,
  OAuthScope,
  ClientAttributes,
  StringAttribute,
} from 'aws-cdk-lib/aws-cognito';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';
import { Construct } from 'constructs';

interface AuthStackProps extends StackProps {
  appName: string;
}

export class AuthStack extends Stack {
  public readonly userPool: UserPool;
  public readonly userPoolClient: UserPoolClient;

  constructor(scope: Construct, id: string, props: AuthStackProps) {
    super(scope, id, props);

    const autoConfirmFn = new NodejsFunction(this, 'AutoConfirmFn', {
      functionName: `${props.appName}AutoConfirm`,
      entry: 'lambdas/auto-confirm/index.ts',
      runtime: Runtime.NODEJS_22_X,
      logRetention: RetentionDays.ONE_WEEK,
      bundling: {
        minify: true,
        target: 'node22',
      },
    });

    this.userPool = new UserPool(this, 'UserPool', {
      userPoolName: `${props.appName}UserPool`,
      selfSignUpEnabled: true,
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      signInAliases: { email: true },
      autoVerify: { email: true },
      standardAttributes: {
        email: { required: true, mutable: true },
        givenName: { required: false, mutable: true },
        familyName: { required: false, mutable: true },
      },
      customAttributes: {
        travelerType: new StringAttribute({ mutable: true }),
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: false,
      },
      lambdaTriggers: {
        preSignUp: autoConfirmFn,
      },
      removalPolicy: RemovalPolicy.DESTROY,
    });

    this.userPoolClient = new UserPoolClient(this, 'UserPoolClient', {
      userPoolClientName: `${props.appName}MobileClient`,
      userPool: this.userPool,
      generateSecret: false,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: { authorizationCodeGrant: true, implicitCodeGrant: true },
        scopes: [OAuthScope.EMAIL, OAuthScope.OPENID, OAuthScope.PROFILE],
        callbackUrls: ['zelo://callback', 'https://zelo.app/callback'],
        logoutUrls: ['zelo://logout', 'https://zelo.app/logout'],
      },
      preventUserExistenceErrors: true,
      readAttributes: new ClientAttributes().withStandardAttributes({ email: true, givenName: true, familyName: true }),
      writeAttributes: new ClientAttributes().withStandardAttributes({ email: true, givenName: true, familyName: true }),
    });

    new CfnOutput(this, 'UserPoolId', { value: this.userPool.userPoolId });
    new CfnOutput(this, 'UserPoolClientId', { value: this.userPoolClient.userPoolClientId });
    new CfnOutput(this, 'Region', { value: this.region });
  }
}
