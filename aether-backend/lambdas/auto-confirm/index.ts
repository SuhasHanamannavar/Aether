import { PostConfirmationConfirmSignUpTriggerEvent } from 'aws-lambda';
import {
  CognitoIdentityProviderClient,
  AdminConfirmSignUpCommand,
} from '@aws-sdk/client-cognito-identity-provider';

const client = new CognitoIdentityProviderClient({});

export const handler = async (
  event: PostConfirmationConfirmSignUpTriggerEvent
): Promise<PostConfirmationConfirmSignUpTriggerEvent> => {
  await client.send(
    new AdminConfirmSignUpCommand({
      UserPoolId: event.userPoolId,
      Username: event.userName,
    })
  );
  return event;
};
