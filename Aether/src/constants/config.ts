const API_BASE_URL = 'https://ab0rf8bgm7.execute-api.us-east-1.amazonaws.com/v1';

export const config = {
  apiBaseUrl: API_BASE_URL,
  awsLocation: {
    region: process.env.EXPO_PUBLIC_AWS_REGION || 'us-east-1',
    apiKey: process.env.EXPO_PUBLIC_AWS_LOCATION_API_KEY || '',
    mapStyle: 'Standard',
  },
};
