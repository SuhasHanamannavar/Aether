import {
  CognitoUserPool,
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
} from 'amazon-cognito-identity-js';
import { config } from '../constants/config';
import { setAccessToken } from './api';

const userPool = new CognitoUserPool({
  UserPoolId: config.cognito.userPoolId,
  ClientId: config.cognito.clientId,
});

export const cognitoAuth = {
  signUp: (email: string, password: string, givenName?: string, familyName?: string): Promise<any> =>
    new Promise((resolve, reject) => {
      const attributes = [
        new CognitoUserAttribute({ Name: 'email', Value: email }),
      ];
      if (givenName) attributes.push(new CognitoUserAttribute({ Name: 'given_name', Value: givenName }));
      if (familyName) attributes.push(new CognitoUserAttribute({ Name: 'family_name', Value: familyName }));

      userPool.signUp(email, password, attributes, [], (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    }),

  confirmSignUp: (email: string, code: string): Promise<any> =>
    new Promise((resolve, reject) => {
      const user = new CognitoUser({ Username: email, Pool: userPool });
      user.confirmRegistration(code, true, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    }),

  signIn: (email: string, password: string): Promise<any> =>
    new Promise((resolve, reject) => {
      const user = new CognitoUser({ Username: email, Pool: userPool });
      const authDetails = new AuthenticationDetails({ Username: email, Password: password });

      user.authenticateUser(authDetails, {
        onSuccess: (session) => {
          const token = session.getAccessToken().getJwtToken();
          setAccessToken(token);
          resolve(session);
        },
        onFailure: (err) => reject(err),
      });
    }),

  signOut: () => {
    const user = userPool.getCurrentUser();
    if (user) {
      user.signOut();
      setAccessToken(null);
    }
  },

  getCurrentUser: (): CognitoUser | null => userPool.getCurrentUser(),

  getSession: (): Promise<any> =>
    new Promise((resolve, reject) => {
      const user = userPool.getCurrentUser();
      if (!user) {
        reject(new Error('No current user'));
        return;
      }
      user.getSession((err: any, session: any) => {
        if (err) reject(err);
        else {
          setAccessToken(session.getAccessToken().getJwtToken());
          resolve(session);
        }
      });
    }),
};
