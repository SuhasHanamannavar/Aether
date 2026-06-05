const API_BASE_URL = __DEV__
  ? 'http://localhost:3000/v1'
  : 'https://api.zelo.app/v1';

export const config = {
  apiBaseUrl: API_BASE_URL,
  cognito: {
    userPoolId: 'us-east-1_XXXXXXXXX', // Replace after CDK deploy from stack output
    clientId: 'XXXXXXXXXXXXXXXXXXXXXXXXX', // Replace after CDK deploy from stack output
    region: 'us-east-1',
    domain: 'zelo.auth.us-east-1.amazoncognito.com',
  },
};
