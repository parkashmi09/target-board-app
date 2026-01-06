import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../navigation/MainStack';
import { useTheme } from '../theme/theme';
import { moderateScale, getSpacing } from '../utils/responsive';
import LiveChatInterface from '../components/LiveChatInterface';
import GradientBackground from '../components/GradientBackground';
import ScreenHeader from '../components/ScreenHeader';
import AsyncStorage from '@react-native-async-storage/async-storage';

type LiveChatScreenRouteProp = RouteProp<MainStackParamList, 'LiveChat'>;
type LiveChatScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'LiveChat'>;

const LiveChatScreen: React.FC = () => {
  const theme = useTheme();
  const route = useRoute<LiveChatScreenRouteProp>();
  const { roomId, username } = route.params || {};
  const [userName, setUserName] = useState<string>(username || 'Student');

  useEffect(() => {
    const loadUsername = async () => {
      try {
        if (!username) {
          const userDataStr = await AsyncStorage.getItem('userData');
          if (userDataStr) {
            const user = JSON.parse(userDataStr);
            setUserName(user.name || user.fullName || 'Student');
          }
        }
      } catch (error) {
        // Silent error handling
      }
    };
    loadUsername();
  }, [username]);

  const handleMessageSend = (message: string) => {
    // Handle message sending logic here
    if (__DEV__) {
      console.log('[LiveChatScreen] Message sent:', message);
    }
  };

  return (
    <GradientBackground>
      <View style={styles.container}>
        <ScreenHeader showSearch={false} title="Live Chat" />
        <View style={styles.chatWrapper}>
          <LiveChatInterface
            roomId={roomId}
            username={userName}
            onMessageSend={handleMessageSend}
          />
        </View>
      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatWrapper: {
    flex: 1,
    paddingHorizontal: getSpacing(2),
    paddingBottom: getSpacing(2),
  },
});

export default LiveChatScreen;

