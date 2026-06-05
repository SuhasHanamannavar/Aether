import { Stack, StackProps } from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import { Topic } from 'aws-cdk-lib/aws-sns';
import { Rule, Schedule } from 'aws-cdk-lib/aws-events';
import { LambdaFunction } from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { RetentionDays } from 'aws-cdk-lib/aws-logs';

interface NotificationStackProps extends StackProps {
  appName: string;
  tripTable: Table;
}

export class NotificationStack extends Stack {
  constructor(scope: Construct, id: string, props: NotificationStackProps) {
    super(scope, id, props);

    const snsTopic = new Topic(this, 'NotificationTopic', {
      topicName: `${props.appName}Notifications`,
    });

    const notifHandler = new NodejsFunction(this, 'NotificationHandler', {
      functionName: `${props.appName}NotificationHandler`,
      entry: 'lambdas/notification-service/index.ts',
      runtime: Runtime.NODEJS_22_X,
      memorySize: 256,
      timeout: Duration.seconds(30),
      environment: {
        TOPIC_ARN: snsTopic.topicArn,
        TRIPS_TABLE: props.tripTable.tableName,
      },
      bundling: {
        minify: true,
        sourceMap: true,
        target: 'node22',
        externalModules: ['@aws-sdk/*'],
      },
      logRetention: RetentionDays.ONE_WEEK,
    });

    props.tripTable.grantReadWriteData(notifHandler);
    snsTopic.grantPublish(notifHandler);

    // EventBridge: T-7 days check (runs daily at 8 AM)
    new Rule(this, 'PreTripReminder', {
      ruleName: `${props.appName}PreTripReminder`,
      schedule: Schedule.cron({ hour: '8', minute: '0' }),
      targets: [new LambdaFunction(notifHandler)],
    });

    // EventBridge: Day-of-travel check (runs every hour)
    new Rule(this, 'DayOfTravel', {
      ruleName: `${props.appName}DayOfTravel`,
      schedule: Schedule.cron({ hour: '*', minute: '0' }),
      targets: [new LambdaFunction(notifHandler)],
    });
  }
}

import { Duration } from 'aws-cdk-lib';
