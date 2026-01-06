import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TabNavigator from './TabNavigator';
import TeacherDetailsScreen from '../screens/TeacherDetailsScreen';
import CourseDetailsScreen from '../screens/CourseDetailsScreen';
import PaymentCheckoutScreen from '../screens/PaymentCheckoutScreen';
import QRCodePaymentScreen from '../screens/QRCodePaymentScreen';
import DownloadsScreen from '../screens/DownloadsScreen';
import HelpScreen from '../screens/HelpScreen';
import SettingsScreen from '../screens/SettingsScreen';
import PDFViewerScreen from '../screens/PDFViewerScreen';
import PDFDownloadScreen from '../screens/PDFDownlaodScreen';
import CategoriesScreen from '../screens/CategoriesScreen';
import CategoryContentScreen from '../screens/CategoryContentScreen';
import ClassStreamsScreen from '../screens/ClassStreamsScreen';
import StreamPlayerScreen from '../screens/StreamPlayerScreen';
import VideoPlayerScreen from '../screens/VideoPlayerScreen';
import LiveChatScreen from '../screens/LiveChatScreen';
import { CategoryNode } from '../services/api';

export type MainStackParamList = {
  TabNavigator: undefined;
  TeacherDetails: { teacherId: string };
  CourseDetails: { courseId: string; openPurchaseModal?: boolean };
  PaymentCheckout: { 
    courseId: string; 
    packageId?: string; 
    originalPrice: number; 
    currentPrice: number;
  };
  QRCodePayment: {
    courseId: string;
    packageId?: string;
    originalPrice: number;
    currentPrice: number;
    discountCode?: string;
    preFetchedQrData?: any;
  };
  Downloads: undefined;
  Help: undefined;
  Settings: undefined;
  PDFViewer: {
    url: string;
    title?: string;
    contentId?: string;
  };
  PDFDownload: {
    url: string;
    title?: string;
    contentId?: string;
  };
  Categories: {
    courseId: string;
    courseName?: string;
    parentCategory?: CategoryNode;
  };
  CategoryContent: {
    category: CategoryNode;
    courseId: string;
    courseName?: string;
  };
  ClassStreams: {
    courseId?: string;
  };
  StreamPlayer: {
    streamId?: string;
    tpAssetId?: string;
    hlsUrl?: string;
  };
  VideoPlayer: {
    hlsUrl?: string;
    tpAssetId?: string;
    title?: string;
  };
  LiveChat: {
    roomId?: string;
    username?: string;
  };
};

const Stack = createNativeStackNavigator<MainStackParamList>();

const MainStack: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="TabNavigator"
    >
      <Stack.Screen name="TabNavigator" component={TabNavigator} />
      <Stack.Screen name="TeacherDetails" component={TeacherDetailsScreen} />
      <Stack.Screen name="CourseDetails" component={CourseDetailsScreen} />
      <Stack.Screen name="PaymentCheckout" component={PaymentCheckoutScreen} />
      <Stack.Screen name="QRCodePayment" component={QRCodePaymentScreen} />
      <Stack.Screen name="Downloads" component={DownloadsScreen} />
      <Stack.Screen name="Help" component={HelpScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="PDFViewer" component={PDFViewerScreen} />
      <Stack.Screen name="PDFDownload" component={PDFDownloadScreen} />
      <Stack.Screen name="Categories" component={CategoriesScreen} />
      <Stack.Screen name="CategoryContent" component={CategoryContentScreen} />
      <Stack.Screen name="ClassStreams" component={ClassStreamsScreen} />
      <Stack.Screen name="StreamPlayer" component={StreamPlayerScreen} />
      <Stack.Screen 
        name="VideoPlayer" 
        component={VideoPlayerScreen}
        options={{
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen name="LiveChat" component={LiveChatScreen} />
    </Stack.Navigator>
  );
};

export default MainStack;

