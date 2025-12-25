import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LandingPage from '../screens/auth/LandingPage';
import OtpVerificationScreen from '../screens/auth/OtpVerificationScreen';
import RegisterStep1Screen from '../screens/auth/RegisterStep1Screen';
import RegisterStep2Screen from '../screens/auth/RegisterStep2Screen';

export type AuthStackParamList = {
  LandingPage: undefined;
  OtpVerification: { mobile: string; userExists: boolean };
  RegisterStep1: { tempToken: string };
  RegisterStep2: { tempToken: string; fullName: string };
};

const Stack = createNativeStackNavigator<AuthStackParamList>();

const AuthStack: React.FC = () => {
  const [initialRoute, setInitialRoute] = useState<keyof AuthStackParamList | null>(null);

  useEffect(() => {
    const checkFirstTimeVisited = async () => {
      try {
        const firstTimeVisited = await AsyncStorage.getItem('firstTimeVisited');
        if (firstTimeVisited === 'true') {
          setInitialRoute('LandingPage');
        } else {
          setInitialRoute('LandingPage');
        }
      } catch (error) {
        setInitialRoute('LandingPage');
      }
    };

    checkFirstTimeVisited();
  }, []);

  if (!initialRoute) {
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={initialRoute}
    >
      <Stack.Screen name="LandingPage" component={LandingPage} />
      <Stack.Screen name="OtpVerification" component={OtpVerificationScreen} />
      <Stack.Screen name="RegisterStep1" component={RegisterStep1Screen} />
      <Stack.Screen name="RegisterStep2" component={RegisterStep2Screen} />
    </Stack.Navigator>
  );
};

export default AuthStack;


