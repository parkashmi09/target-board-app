import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

type StreamPlayerScreenRouteProp = RouteProp<MainStackParamList, 'StreamPlayer'>;

// Initialize TPStreams once at module load
TPStreams.initialize(TPSTREAMS_ORG_ID);

const StreamPlayerScreen: React.FC = () => {
    const route = useRoute<StreamPlayerScreenRouteProp>();
    const navigation = useNavigation();
    const { colors } = useTheme();
    const { streamId, tpAssetId, hlsUrl } = route.params || {};

    console.log('[StreamPlayerScreen] Props:', {
        streamId,
        tpAssetId,
        hlsUrl,
    });

    const [loading, setLoading] = useState(true);
    const [chatRoomId, setChatRoomId] = useState<string | undefined>(undefined);
    const [username, setUsername] = useState<string>('Guest');
    const [error, setError] = useState<string | null>(null);
    const [isPlayerReady, setIsPlayerReady] = useState(false);
    const [screenWidth, setScreenWidth] = useState(Dimensions.get('window').width);
    const [streamStatus, setStreamStatus] = useState<string | undefined>(undefined);
    const [streamTpStatus, setStreamTpStatus] = useState<string | undefined>(undefined);
    const [streamTitle, setStreamTitle] = useState<string | undefined>(undefined);
    const [streamDescription, setStreamDescription] = useState<string | undefined>(undefined);
    const [authToken, setAuthToken] = useState<string | null>(null);
    const [isLoadingToken, setIsLoadingToken] = useState(true);

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

    // Calculate responsive video height (16:9 aspect ratio)
    const videoHeight = useMemo(() => screenWidth * (9 / 16), [screenWidth]);

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

    // Track screen dimensions
    useEffect(() => {
        const subscription = Dimensions.addEventListener('change', ({ window }) => {
            setScreenWidth(window.width);
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
                    setStreamStatus(fetchedStreamData.stream.status);
                    setStreamTpStatus(fetchedStreamData.stream.tpStatus);
                    setStreamTitle(fetchedStreamData.stream.title);
                    setStreamDescription(fetchedStreamData.stream.description);

                    // Check if stream has ended (but don't navigate for now)
                    const isEnded =
                        fetchedStreamData.stream.tpStatus === 'COMPLETED' ||
                        fetchedStreamData.stream.tpStatus === 'STOPPED' ||
                        fetchedStreamData.stream.status === 'completed' ||
                        (fetchedStreamData.stream.status as string) === 'ended';

                    if (isEnded && __DEV__) {
                        console.log('[StreamPlayerScreen] Stream has ended');
                    }
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


    // TPStreams Player Event Handlers
    const handlePlayerStateChanged = useCallback((state: number) => {
        switch (state) {
            case 0: // Player is idle
            case 1: // Player is buffering
                setLoading(true);
                break;
            case 2: // Player is ready
                setLoading(false);
                setError(null);
                break;
            case 3: // Video ended
                setLoading(false);
                // Check stream status from API response instead of player state
                // Navigation will be handled by the stream status check
                break;
            default:
                setLoading(false);
        }
    }, [navigation]);

    const handleIsLoadingChanged = useCallback((isLoading: boolean) => {
        setLoading(isLoading);
    }, []);

    const handleError = useCallback((errorData: any) => {
        if (__DEV__) {
            console.error('[StreamPlayerScreen] TPStreams Player error:', errorData);
        }
        setLoading(false);
        setError('Failed to load stream');
    }, []);

    const handleAccessTokenExpired = useCallback(
        async (videoId: string, callback: (token: string) => void) => {
            // Return the same token (in production, fetch a new token from backend)
            callback(TPSTREAMS_ACCESS_TOKEN);
        },
        []
    );

    if (!videoId) {
        return (
            <GradientBackground>
                <ScreenHeader title="Stream Player" showSearch={false} />
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
            <ScreenHeader title="Live Stream" showSearch={false} />
            <View style={[styles.container, { backgroundColor: colors.background }]}>
                {/* Video Player Container */}
                <View style={[styles.videoContainer, { height: videoHeight, backgroundColor: 'black' }]}>
                    {isPlayerReady && (
                        <TPStreamsPlayerView
                            videoId={videoId}
                            accessToken={TPSTREAMS_ACCESS_TOKEN}
                            shouldAutoPlay={true}
                            showDefaultCaptions={false}
                            enableDownload={false}
                            style={styles.video}
                            onPlayerStateChanged={handlePlayerStateChanged}
                            onIsLoadingChanged={handleIsLoadingChanged}
                            onError={handleError}
                            onAccessTokenExpired={handleAccessTokenExpired}
                        />
                    )}

                    {/* Loading Indicator */}
                    {loading && (
                        <View style={styles.loadingOverlay}>
                            <ActivityIndicator size="large" color={colors.primary || '#9C27B0'} />
                            <Text style={[styles.loadingText, { color: colors.text }]}>
                                Loading stream...
                            </Text>
                        </View>
                    )}

                    {/* Error Overlay */}
                    {error && (
                        <View style={styles.errorOverlay}>
                            <Text style={[styles.errorText, { color: colors.error || 'red' }]}>
                                {error}
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
    },
    video: {
        width: '100%',
        height: '100%',
        backgroundColor: 'black',
    },
    loadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
    },
    loadingText: {
        marginTop: getSpacing(1),
        fontSize: moderateScale(14),
        fontWeight: '500',
    },
    errorOverlay: {
        position: 'absolute',
        bottom: getSpacing(2),
        left: getSpacing(2),
        right: getSpacing(2),
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: getSpacing(2),
        borderRadius: moderateScale(8),
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
});
