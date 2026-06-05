#!/usr/bin/env node
import { App } from 'aws-cdk-lib';
import { AuthStack } from '../lib/stacks/auth-stack';
import { UserStack } from '../lib/stacks/user-stack';
import { TripStack } from '../lib/stacks/trip-stack';
import { BookingStack } from '../lib/stacks/booking-stack';
import { NotificationStack } from '../lib/stacks/notification-stack';

const app = new App();

const account = '977133951538';
const region = 'us-east-1';
const env = { account, region };
const appName = 'Zelo';

const authStack = new AuthStack(app, `${appName}AuthStack`, {
  env,
  appName,
  stackName: `${appName}AuthStack`,
});

const userStack = new UserStack(app, `${appName}UserStack`, {
  env,
  appName,
});

const tripStack = new TripStack(app, `${appName}TripStack`, {
  env,
  appName,
});

const bookingStack = new BookingStack(app, `${appName}BookingStack`, {
  env,
  appName,
});

new NotificationStack(app, `${appName}NotificationStack`, {
  env,
  appName,
  tripTable: tripStack.tripTable,
});

app.synth();
