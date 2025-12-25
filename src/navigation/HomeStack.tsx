import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import ChooseBoardClassScreen from '../screens/ChooseBoardClassScreen';
import TeacherDetailsScreen from '../screens/TeacherDetailsScreen';

export type HomeStackParamList = {
  HomeScreen: undefined;
  ChooseBoardClass: undefined;
  TeacherDetails: { teacherId: string };
};

const Stack = createNativeStackNavigator<HomeStackParamList>();

const HomeStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="HomeScreen"
    >
      <Stack.Screen name="HomeScreen" component={HomeScreen} />
      <Stack.Screen name="ChooseBoardClass" component={ChooseBoardClassScreen} />
      <Stack.Screen name="TeacherDetails" component={TeacherDetailsScreen} />
    </Stack.Navigator>
  );
};

export default HomeStack;

