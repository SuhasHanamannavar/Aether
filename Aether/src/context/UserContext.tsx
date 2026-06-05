import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setUserId as setApiUserId } from '../services/api';

const USER_ID_KEY = '@aether_user_id';

function generateId(): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let id = '';
  for (let i = 0; i < 24; i++) {
    id += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return id;
}

interface UserProfile {
  userId: string;
  email?: string;
  travelerType?: string | null;
  preferences?: Record<string, any>;
  integrations?: Record<string, any>;
  onboardingComplete?: boolean;
}

interface UserContextValue {
  userId: string | null;
  userProfile: UserProfile | null;
  isLoading: boolean;
  setUserProfile: (profile: UserProfile | null) => void;
  refreshUserId: () => Promise<void>;
}

const UserContext = createContext<UserContextValue>({
  userId: null,
  userProfile: null,
  isLoading: true,
  setUserProfile: () => {},
  refreshUserId: async () => {},
});

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUserId = useCallback(async () => {
    try {
      let stored = await AsyncStorage.getItem(USER_ID_KEY);
      if (!stored) {
        stored = generateId();
        await AsyncStorage.setItem(USER_ID_KEY, stored);
      }
      setUserId(stored);
      setApiUserId(stored);
    } catch {
      const fallback = generateId();
      setUserId(fallback);
      setApiUserId(fallback);
    }
  }, []);

  useEffect(() => {
    refreshUserId().finally(() => setIsLoading(false));
  }, [refreshUserId]);

  return (
    <UserContext.Provider value={{ userId, userProfile, isLoading, setUserProfile, refreshUserId }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  return useContext(UserContext);
}
