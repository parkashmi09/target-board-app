import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Text } from 'react-native';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
// @ts-ignore - react-native-tpstreams types may not be available
import { TPStreams, TPStreamsPlayerView } from 'react-native-tpstreams';
import { MainStackParamList } from '../navigation/MainStack';
import { getStreamById } from '../services/api';
import GradientBackground from '../components/GradientBackground';
import ScreenHeader from '../components/ScreenHeader';
import LiveChat from '../components/LiveChat';
import { useTheme } from '../theme/theme';
import { moderateScale, getSpacing } from '../utils/responsive';
import { TPSTREAMS_ORG_ID, TPSTREAMS_ACCESS_TOKEN } from '../services/config';
import { getStreamStatus, getCountdown, formatDate } from '../utils/streamUtils';

type StreamPlayerScreenRouteProp = RouteProp<MainStackParamList, 'StreamPlayer'>;

// Initialize TPStreams once at module load
TPStreams.initialize(TPSTREAMS_ORG_ID);

const StreamPlayerScreen: React.FC = () => {
    const route = useRoute<StreamPlayerScreenRouteProp>();
    const navigation = useNavigation();
    const { colors } = useTheme();
    const { streamId, tpAssetId, hlsUrl } = route.params || {};

    // Handle back button press - works with both header button and Android hardware back button
    const handleBackPress = useCallback(() => {
        if (navigation.canGoBack()) {
            navigation.goBack();
        }
    }, [navigation]);

    console.log('[StreamPlayerScreen] Props:', {
        streamId,
        tpAssetId,
        hlsUrl,
    });

    const [chatRoomId, setChatRoomId] = useState<string | undefined>(undefined);
    const [username, setUsername] = useState<string>('Guest');
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [screenDimensions, setScreenDimensions] = useState(Dimensions.get('window'));
    const [streamStatus, setStreamStatus] = useState<string | undefined>(undefined);
    const [streamTpStatus, setStreamTpStatus] = useState<string | undefined>(undefined);
    const [streamTitle, setStreamTitle] = useState<string | undefined>(undefined);
    const [streamDescription, setStreamDescription] = useState<string | undefined>(undefined);
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [isLoadingToken, setIsLoadingToken] = useState(true);
    const [streamData, setStreamData] = useState<any>(null);
    const [countdown, setCountdown] = useState<string>('');

    useEffect(() => {
        const loadToken = async () => {
            try {
                const token = await AsyncStorage.getItem('token');
                setAuthToken(token);
            } catch (error) {
                console.error('Failed to load token:', error);
            } finally {
                setIsLoadingToken(false);
            }
        };
        loadToken();
    }, []);

    // Calculate responsive video height (16:9 aspect ratio) with proper orientation handling
    const videoHeight = useMemo(() => {
        const width = screenDimensions.width;
        const aspectRatio = 16 / 9;
        return width / aspectRatio;
    }, [screenDimensions.width]);

    // Use tpAssetId as videoId for TPStreamsPlayerView
    const videoId = useMemo(() => {
        if (!tpAssetId) {
            return null;
        }
        return tpAssetId;
    }, [tpAssetId]);

    // Load username from AsyncStorage
    useEffect(() => {
        const loadUsername = async () => {
            try {
                const userDataStr = await AsyncStorage.getItem('userData');
                if (userDataStr) {
                    const userData = JSON.parse(userDataStr);
                    const name = userData.name || userData.fullName || userData.username || 'Guest';
                    setUsername(name);
                }
            } catch (error) {
                if (__DEV__) {
                    console.error('[StreamPlayerScreen] Error loading username:', error);
                }
            }
        };
        loadUsername();
    }, []);

    // Track screen dimensions for orientation changes
    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            setScreenDimensions(window);
        });
        return () => subscription?.remove();
    }, []);

    // Delay player rendering to ensure screen layout is complete
    useEffect(() => {
        const timer = setTimeout(() => setIsPlayerReady(true), 100);
        return () => clearTimeout(timer);
    }, []);

    // Fetch stream data to get chatRoomId - fetch immediately on mount
    useEffect(() => {
        if (!streamId) {
            if (__DEV__) {
                console.warn('[StreamPlayerScreen] No streamId provided');
            }
            return;
        }

        // Fetch immediately when component mounts
        const fetchChatRoomId = async () => {
            try {
                const fetchedStreamData = await getStreamById(streamId);

                if (__DEV__) {
                    console.log('[StreamPlayerScreen] Stream data fetched:', {
                        chatRoomId: fetchedStreamData.chatRoomId,
                        hasRoomId: !!fetchedStreamData.chatRoomId?.roomId,
                        streamStatus: fetchedStreamData.stream?.status,
                        streamTpStatus: fetchedStreamData.stream?.tpStatus,
                    });
                }

                // Store stream data
                if (fetchedStreamData.stream) {
                    setStreamData(fetchedStreamData.stream);
                    setStreamStatus(fetchedStreamData.stream.status);
                    setStreamTpStatus(fetchedStreamData.stream.tpStatus);
                    setStreamTitle(fetchedStreamData.stream.title);
                    setStreamDescription(fetchedStreamData.stream.description);
                }

                if (fetchedStreamData.chatRoomId?.roomId) {
                    const roomId = fetchedStreamData.chatRoomId.roomId;
                    if (__DEV__) {
                        console.log('[StreamPlayerScreen] Setting chatRoomId:', roomId);
                    }
                    setChatRoomId(roomId);
                } else {
                    if (__DEV__) {
                        console.warn('[StreamPlayerScreen] No chatRoomId found in response');
                    }
                }
            } catch (err) {
                if (__DEV__) {
                    console.error('[StreamPlayerScreen] Error fetching stream data:', err);
                }
            }
        };

        // Call immediately, don't wait
        fetchChatRoomId();
    }, [streamId]);

    // Update countdown for upcoming streams
    useEffect(() => {
        if (!streamData) return;
        
        const statusInfo = getStreamStatus(streamData);
        if (statusInfo.label === 'UPCOMING' && streamData.startTime) {
            const updateCountdown = () => {
                const countdownText = getCountdown(streamData.startTime);
                setCountdown(countdownText);
            };
            
            updateCountdown();
            const interval = setInterval(updateCountdown, 1000);
            
            return () => clearInterval(interval);
        }
    }, [streamData]);



    // Check if stream is upcoming or live
    const isUpcoming = streamData ? getStreamStatus(streamData).label === 'UPCOMING' : false;
    const isLive = streamData ? getStreamStatus(streamData).label === 'LIVE' : false;

    if (!videoId) {
        return (
            <GradientBackground>
                <ScreenHeader title="Stream Player" showSearch={false} onBackPress={handleBackPress} />
                <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
                    <Text style={[styles.errorText, { color: colors.error || 'red' }]}>
                        Missing stream information
                    </Text>
                    <Text style={[styles.errorSubtext, { color: colors.textSecondary }]}>
                        Please provide a valid stream ID or asset URL
                    </Text>
                </View>
            </GradientBackground>
        );
    }

    return (
        <GradientBackground>
            <ScreenHeader title={isUpcoming ? "Upcoming Stream" : "Live Stream"} showSearch={false} onBackPress={handleBackPress} />
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Video Player Container */}
                <View style={[styles.videoContainer, { height: videoHeight, backgroundColor: 'black' }]}>
                    {isUpcoming ? (
                        // Upcoming Stream - Show countdown instead of player
                        <View style={styles.upcomingContainer}>
                            <View style={styles.upcomingContent}>
                                <Text style={[styles.upcomingTitle, { color: colors.text }]}>
                                    {streamTitle || 'Stream Starting Soon'}
                                </Text>
                                {streamDescription && (
                                    <Text style={[styles.upcomingDescription, { color: colors.textSecondary }]}>
                                        {streamDescription}
                                    </Text>
                                )}
                                <View style={styles.countdownContainer}>
                                    <Text style={[styles.countdownLabel, { color: colors.textSecondary }]}>
                                        Stream starts in:
                                    </Text>
                                    <Text style={[styles.countdownText, { color: colors.primary }]}>
                                        {countdown || 'Calculating...'}
                                    </Text>
                                </View>
                                {streamData?.startTime && (
                                    <Text style={[styles.startTimeText, { color: colors.textSecondary }]}>
                                        {formatDate(streamData.startTime)}
                                    </Text>
                                )}
                            </View>
                        </View>
                    ) : isPlayerReady && isLive ? (
                        // Live Stream - Show Player only for LIVE streams
                        <TPStreamsPlayerView
                            videoId={videoId}
                            accessToken={TPSTREAMS_ACCESS_TOKEN}
                            shouldAutoPlay={true}
                            showDefaultCaptions={false}
                            enableDownload={false}
                            style={styles.video}
                        />
                    ) : (
                        // Loading state
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                            <Text style={[styles.loadingText, { color: colors.text }]}>
                                {isLive ? 'Loading stream...' : 'Preparing stream...'}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Stream Info Section - Title and Description */}
                {(streamTitle || streamDescription) && (
                    <View style={[styles.streamInfoSection, { backgroundColor: colors.background }]}>
                        {streamTitle && (
                            <Text style={[styles.streamTitle, { color: colors.text }]} numberOfLines={2}>
                                {streamTitle}
                            </Text>
                        )}
                        {streamDescription && (
                            <Text style={[styles.streamDescription, { color: colors.textSecondary }]} numberOfLines={3}>
                                {streamDescription}
                            </Text>
                        )}
                    </View>
                )}

                {/* Chat Section */}
                {streamId ? (
                    <View style={[styles.chatSection, { 
                        backgroundColor: colors.background,
                        minHeight: Dimensions.get('window').height * 0.3,
                    }]}>
                        {isLoadingToken ? (
                            <View style={styles.chatLoaderContainer}>
                                <ActivityIndicator size="small" color={colors.primary || '#9C27B0'} />
                                <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                                    Preparing chat...
                                </Text>
                            </View>
                        ) : authToken ? (
                            <LiveChat
                                streamId={streamId}
                                token={authToken}
                                streamTitle={streamTitle}
                                streamDescription={streamDescription}
                            />
                        ) : (
                            <View style={styles.errorContainer}>
                                <Text style={[styles.errorText, { color: colors.textSecondary }]}>
                                    Please login to use chat
                                </Text>
                            </View>
                        )}
                    </View>
                ) : null}
            </View>
        </GradientBackground>
    );
};

export default StreamPlayerScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    videoContainer: {
        width: '100%',
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
        // Prevent dimension stretching on orientation change
        minHeight: 200,
    },
    video: {
        width: '100%',
        height: '100%',
        backgroundColor: 'black',
    },
    loadingText: {
        marginTop: getSpacing(1),
        fontSize: moderateScale(14),
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: getSpacing(3),
    },
    errorText: {
        fontSize: moderateScale(16),
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: getSpacing(1),
    },
    errorSubtext: {
        fontSize: moderateScale(14),
        textAlign: 'center',
        marginTop: getSpacing(0.5),
    },
    chatSection: {
        flex: 1,
        width: '100%',
        marginTop: getSpacing(1),
        minHeight: 200,
    },
    chatLoaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: getSpacing(2),
    },
    streamInfoSection: {
        width: '100%',
        paddingHorizontal: getSpacing(2),
        paddingVertical: getSpacing(1.5),
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0, 0, 0, 0.1)',
    },
    streamTitle: {
        fontSize: moderateScale(18),
        fontWeight: '700',
        marginBottom: getSpacing(0.5),
        lineHeight: moderateScale(24),
    },
    streamDescription: {
        fontSize: moderateScale(14),
        lineHeight: moderateScale(20),
        marginTop: getSpacing(0.5),
    },
    upcomingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: getSpacing(4),
    },
    upcomingContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    upcomingTitle: {
        fontSize: moderateScale(22),
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: getSpacing(2),
    },
    upcomingDescription: {
        fontSize: moderateScale(14),
        textAlign: 'center',
        marginBottom: getSpacing(3),
        lineHeight: moderateScale(20),
    },
    countdownContainer: {
        alignItems: 'center',
        marginBottom: getSpacing(2),
    },
    countdownLabel: {
        fontSize: moderateScale(14),
        marginBottom: getSpacing(1),
    },
    countdownText: {
        fontSize: moderateScale(32),
        fontWeight: '700',
        letterSpacing: 2,
    },
    startTimeText: {
        fontSize: moderateScale(12),
        marginTop: getSpacing(1),
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
