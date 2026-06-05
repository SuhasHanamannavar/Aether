const API_BASE_URL = __DEV__
  ? 'https://ab0rf8bgm7.execute-api.us-east-1.amazonaws.com/v1'
  : 'https://ab0rf8bgm7.execute-api.us-east-1.amazonaws.com/v1';

export const config = {
  apiBaseUrl: API_BASE_URL,
  cognito: {
    userPoolId: 'us-east-1_W6ZH58RyS',
    clientId: '4eg9qnq9oie0a9pvvpv8pjaj23',
    region: 'us-east-1',
    domain: 'zelo.auth.us-east-1.amazoncognito.com',
  },
};
