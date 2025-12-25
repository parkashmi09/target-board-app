import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, BackHandler, Platform, Dimensions, Text, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Video, { ReactVideoSourceProperties, OnLoadData, OnProgressData, VideoRef } from 'react-native-video';
import Orientation from 'react-native-orientation-locker';
import { useTheme } from '../theme/theme';
import { MainStackParamList } from '../navigation/MainStack';
import { getStreamById } from '../services/api';
import StreamChatBox from '../components/StreamChatBox';
import { extractAssetId, loadSavedProgress, saveProgress } from '../utils/videoPlayerUtils';
import { moderateScale, getSpacing } from '../utils/responsive';
import GradientBackground from '../components/GradientBackground';
import ScreenHeader from '../components/ScreenHeader';

type SourceType = ReactVideoSourceProperties | null;
type StreamPlayerScreenRouteProp = RouteProp<MainStackParamList, 'StreamPlayer'>;

// TPStreams Configuration
const ORG_ID = 'kuepke';
const DEFAULT_ACCESS_TOKEN = '6cbd2fd52eb9ba3e1a98f80559b72df79e10335fae8f327c63fe856dd3864dae';
const isDRM = false;

const StreamPlayerScreen: React.FC = () => {
    const { colors, isDark } = useTheme();
    const route = useRoute<StreamPlayerScreenRouteProp>();
    const navigation = useNavigation();
    const { streamId, tpAssetId, hlsUrl } = route.params || {};
    
    // Validate required params
    if (!streamId && !tpAssetId && !hlsUrl) {
        return (
            <GradientBackground>
                <ScreenHeader title="Stream Player" showSearch={false} />
                <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
                    <Text style={[styles.errorText, { color: colors.error || 'red' }]}>
                        Missing stream information
                    </Text>
                    <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                        <Text style={[styles.backButtonText, { color: colors.text }]}>Go Back</Text>
                    </TouchableOpacity>
                </View>
            </GradientBackground>
        );
    }
    
    const isIOS = Platform.OS === 'ios';
    const screenData = Dimensions.get('window');
    
    const ASSET_ID = useMemo(() => extractAssetId(tpAssetId, hlsUrl), [tpAssetId, hlsUrl]);
    const BASE_URL = useMemo(() => 
        `https://d3tphhabckqhz3.cloudfront.net/live/${ORG_ID}/${ASSET_ID}/`,
        [ASSET_ID]
    );
    
    // State Management
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [source, setSource] = useState<SourceType>(null);
    const [isBuffering, setIsBuffering] = useState(false);
    const [duration, setDuration] = useState(0);
    const [chatEmbedUrl, setChatEmbedUrl] = useState<string | undefined>(undefined);
    const [accessToken, setAccessToken] = useState<string>(DEFAULT_ACCESS_TOKEN);
    const [isLandscape, setIsLandscape] = useState(screenData.width > screenData.height);
    const [fullScreen, setFullScreen] = useState(false);
    const [progress, setProgress] = useState<OnProgressData | null>(null);
    const [username, setUsername] = useState<string>('Guest');
    
    const videoRef = useRef<VideoRef>(null);
    const isMountedRef = useRef(true);
    const seekTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    
    const createVideoSource = useCallback((token?: string): SourceType => {
        if (!ASSET_ID) return null;
        
        let videoUri = hlsUrl || `${BASE_URL}video.m3u8`;
        
        // Ensure HTTPS for live streams
        if (videoUri && !videoUri.startsWith('https://')) {
            videoUri = videoUri.replace('http://', 'https://');
        }
        
        const manifestFormat = isDRM ? (isIOS ? 'm3u8' : 'mpd') : 'm3u8';
        const tokenToUse = token || accessToken;
        
        return {
            type: manifestFormat,
            uri: videoUri,
            drm: isDRM ? {
                type: 'fairplay' as any,
                licenseServer: `https://app.tpstreams.com/api/v1/${ORG_ID}/assets/${ASSET_ID}/drm_license/?access_token=${tokenToUse}&drm_type=fairplay`,
            } : undefined,
        };
    }, [ASSET_ID, BASE_URL, hlsUrl, isIOS, accessToken]);

    // Load username from AsyncStorage
    useEffect(() => {
        const loadUsername = async () => {
            try {
                const userDataStr = await AsyncStorage.getItem('userData');
                if (userDataStr) {
                    const userData = JSON.parse(userDataStr);
                    const name = userData.name || userData.fullName || userData.username || 'Guest';
                    if (isMountedRef.current) {
                        setUsername(name);
                    }
                }
            } catch (error) {
                if (__DEV__) {
                    console.error('[StreamPlayerScreen] Error loading username:', error);
                }
            }
        };
        loadUsername();
    }, []);

    // Track component mount status and cleanup
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (seekTimeoutRef.current) {
                clearTimeout(seekTimeoutRef.current);
                seekTimeoutRef.current = null;
            }
        };
    }, []);

    // Initialize video
    useEffect(() => {
        if (!ASSET_ID) {
            if (__DEV__) {
                console.error('[StreamPlayerScreen] No ASSET_ID available');
            }
            if (isMountedRef.current) {
                setError('Asset ID not available');
                setLoading(false);
            }
            return;
        }

        const initializeVideo = async () => {
            if (!isMountedRef.current) return;
            
            try {
                setLoading(true);
                setError(null);
                
                // Fetch stream data to get chat URL and access token
                if (streamId) {
                    try {
                        const streamData = await getStreamById(streamId);
                        if (!isMountedRef.current) return;
                        
                        if (streamData.stream.chatEmbedUrl) {
                            setChatEmbedUrl(streamData.stream.chatEmbedUrl);
                        }
                        
                        // Note: Access token is handled via DEFAULT_ACCESS_TOKEN or from stream data
                        // DRM support can be added later if needed
                    } catch (err) {
                        if (__DEV__) {
                            console.error('[StreamPlayerScreen] Error fetching stream data:', err);
                        }
                    }
                }
                
                // Load video source
                if (!isMountedRef.current) return;
                
                let savedPosition = 0;
                try {
                    if (streamId) {
                        savedPosition = await loadSavedProgress(streamId);
                    }
                } catch (seekErr) {
                    if (__DEV__) {
                        console.error('[StreamPlayerScreen] Error loading saved progress:', seekErr);
                    }
                    savedPosition = 0;
                }
                
                const videoSource = createVideoSource();
                setSource(videoSource);
                
                // Seek to saved position after video loads
                if (savedPosition > 0 && isMountedRef.current && streamId) {
                    if (seekTimeoutRef.current) {
                        clearTimeout(seekTimeoutRef.current);
                    }
                    seekTimeoutRef.current = setTimeout(() => {
                        if (!isMountedRef.current || !videoRef.current) return;
                        try {
                            videoRef.current.seek(savedPosition);
                        } catch (e) {
                            if (__DEV__) {
                                console.error('[StreamPlayerScreen] Error seeking to saved position:', e);
                            }
                        }
                    }, 1000);
                }
            } catch (initError) {
                if (__DEV__) {
                    console.error('[StreamPlayerScreen] Error in initializeVideo:', initError);
                }
                if (isMountedRef.current) {
                    setError('Failed to initialize video player');
                    setLoading(false);
                }
            }
        };

        try {
            initializeVideo().catch((err) => {
                if (__DEV__) {
                    console.error('[StreamPlayerScreen] Unhandled error in initializeVideo:', err);
                }
                if (isMountedRef.current) {
                    setError('Failed to load video');
                    setLoading(false);
                }
            });
        } catch (err) {
            if (__DEV__) {
                console.error('[StreamPlayerScreen] Error calling initializeVideo:', err);
            }
            if (isMountedRef.current) {
                setError('Failed to initialize');
                setLoading(false);
            }
        }
    }, [ASSET_ID, streamId, createVideoSource]);

    // Listen for orientation changes
    useEffect(() => {
        const onChange = ({ window }: { window: { width: number; height: number } }) => {
            setIsLandscape(window.width > window.height);
        };

        const subscription = Dimensions.addEventListener('change', onChange);
        return () => {
            if (typeof subscription?.remove === 'function') {
                subscription.remove();
            }
        };
    }, []);

    // Lock orientation on mount/unmount
    useEffect(() => {
        Orientation.unlockAllOrientations();
        return () => {
            if (!fullScreen) {
                Orientation.lockToPortrait();
            }
        };
    }, [fullScreen]);

    // Handle fullscreen orientation
    useEffect(() => {
        if (fullScreen) {
            Orientation.lockToLandscape();
        } else {
            Orientation.lockToPortrait();
        }
    }, [fullScreen]);

    const handleVideoError = useCallback((error: any) => {
        try {
            if (__DEV__) {
                console.error('[StreamPlayerScreen] Video error:', error);
            }
            
            let errorMessage = 'Failed to load video';
            
            if (error?.error) {
                if (error.error.localizedDescription) {
                    errorMessage = error.error.localizedDescription;
                } else if (error.error.localizedFailureReason) {
                    errorMessage = error.error.localizedFailureReason;
                } else if (error.error.code) {
                    errorMessage = `Error code: ${error.error.code}`;
                }
            } else if (error?.errorString) {
                errorMessage = error.errorString;
            } else if (error?.message) {
                errorMessage = error.message;
            } else if (typeof error === 'string') {
                errorMessage = error;
            }
            
            if (isMountedRef.current) {
                setError(errorMessage);
                setLoading(false);
                setIsBuffering(false);
            }
        } catch (err) {
            if (__DEV__) {
                console.error('[StreamPlayerScreen] Error in handleVideoError:', err);
            }
        }
    }, []);

    const handleVideoLoad = useCallback((data: OnLoadData) => {
        if (!isMountedRef.current) return;
        
        if (__DEV__) {
            console.log('[StreamPlayerScreen] Video loaded successfully');
        }
        setLoading(false);
        setIsBuffering(false);
        setDuration(data.duration);
    }, []);

    const handleProgress = useCallback((data: OnProgressData) => {
        if (!isMountedRef.current) return;
        
        setProgress(data);
        // Save progress every 5 seconds
        if (streamId && Math.floor(data.currentTime) % 5 === 0) {
            saveProgress(streamId, data.currentTime, duration || data.seekableDuration).catch((err) => {
                if (__DEV__) {
                    console.error('[StreamPlayerScreen] Error saving progress:', err);
                }
            });
        }
    }, [duration, streamId]);

    const handleBuffer = useCallback(({ isBuffering: buffering }: { isBuffering: boolean }) => {
        if (!isMountedRef.current) return;
        setIsBuffering(buffering);
    }, []);

    const handleRetry = useCallback(() => {
        if (!isMountedRef.current) return;
        
        setError(null);
        setLoading(true);
        setIsBuffering(false);
        const videoSource = createVideoSource();
        setSource(videoSource);
    }, [createVideoSource]);

    // Handle back button on Android
    useEffect(() => {
        if (Platform.OS !== 'android') {
            return;
        }

        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            try {
                if (!isMountedRef.current) {
                    return false;
                }
                
                if (fullScreen) {
                    setFullScreen(false);
                    return true;
                }
                
                if (!loading && !error && isMountedRef.current) {
                    try {
                        navigation.goBack();
                    } catch (navError) {
                        if (__DEV__) {
                            console.error('[StreamPlayerScreen] Navigation error:', navError);
                        }
                    }
                    return true;
                }
                
                return false;
            } catch (error) {
                if (__DEV__) {
                    console.error('[StreamPlayerScreen] BackHandler error:', error);
                }
                return false;
            }
        });
        
        return () => {
            try {
                backHandler.remove();
            } catch (e) {
                if (__DEV__) {
                    console.error('[StreamPlayerScreen] Error removing back handler:', e);
                }
            }
        };
    }, [navigation, fullScreen, loading, error]);

    return (
        <GradientBackground>
            {!fullScreen && (
                <ScreenHeader title="Live Stream" showSearch={false} />
            )}
            <View style={[styles.container, { backgroundColor: 'black' }]}>
                {error || !ASSET_ID ? (
                    <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
                        <Text style={[styles.errorText, { color: colors.error || 'red' }]}>
                            {error || 'Stream not available'}
                        </Text>
                        <TouchableOpacity
                            onPress={handleRetry}
                            style={[styles.retryButton, { backgroundColor: colors.primary }]}
                        >
                            <Text style={styles.retryButtonText}>Retry</Text>
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Text style={[styles.backButtonText, { color: colors.text }]}>Go Back</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* Video Player - Using Native Controls */}
                        <View style={[
                            styles.videoWrapper, 
                            fullScreen && styles.videoWrapperFullScreen,
                            !fullScreen && !isLandscape && styles.videoWrapperPortrait
                        ]}>
                            {source && (
                                <Video
                                    ref={videoRef}
                                    source={source}
                                    onLoad={handleVideoLoad}
                                    onError={handleVideoError}
                                    onProgress={handleProgress}
                                    onBuffer={handleBuffer}
                                    style={[styles.player, fullScreen && styles.playerFullScreen]}
                                    controls={true}
                                    resizeMode="cover"
                                    playInBackground={false}
                                    playWhenInactive={false}
                                    ignoreSilentSwitch="ignore"
                                    progressUpdateInterval={1000}
                                    allowsExternalPlayback={false}
                                    bufferConfig={{
                                        minBufferMs: 15000,
                                        maxBufferMs: 50000,
                                        bufferForPlaybackMs: 2500,
                                        bufferForPlaybackAfterRebufferMs: 5000,
                                    }}
                                    maxBitRate={10000000}
                                    onLoadStart={() => {
                                        if (isMountedRef.current) {
                                            setIsBuffering(true);
                                        }
                                    }}
                                    onReadyForDisplay={() => {
                                        if (isMountedRef.current) {
                                            setIsBuffering(false);
                                        }
                                    }}
                                />
                            )}
                            
                            {/* Loading Indicator */}
                            {(loading || isBuffering) && (
                                <View style={styles.loadingContainer}>
                                    <ActivityIndicator size="large" color={colors.accent || '#FFFFFF'} />
                                </View>
                            )}
                        </View>

                        {/* Chat Section - Hidden in landscape/fullscreen */}
                        {!fullScreen && !isLandscape && chatEmbedUrl && (
                            <View style={[
                                styles.chatContainer,
                                { 
                                    backgroundColor: colors.background || (isDark ? '#1A1A1A' : '#FFFFFF'),
                                    borderTopColor: isDark ? colors.border || '#333' : '#E0E0E0'
                                }
                            ]}>
                                <StreamChatBox 
                                    chatEmbedUrl={chatEmbedUrl} 
                                    username={username}
                                    title="Live Chat"
                                />
                            </View>
                        )}
                    </>
                )}
            </View>
        </GradientBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    videoWrapper: {
        width: '100%',
        backgroundColor: 'black',
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    videoWrapperPortrait: {
        aspectRatio: 16 / 9,
        maxHeight: '50%',
    },
    videoWrapperFullScreen: {
        width: '100%',
        height: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
    },
    player: {
        width: '100%',
        height: '100%',
        backgroundColor: 'black',
    },
    playerFullScreen: {
        width: '100%',
        height: '100%',
        backgroundColor: 'black',
    },
    chatContainer: {
        flex: 1,
        width: '100%',
        borderTopWidth: 1,
        minHeight: 200,
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    errorText: {
        fontSize: moderateScale(16),
        marginBottom: 20,
        textAlign: 'center',
    },
    retryButton: {
        paddingHorizontal: getSpacing(4),
        paddingVertical: getSpacing(1.5),
        borderRadius: moderateScale(8),
        marginBottom: getSpacing(2),
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: moderateScale(14),
        fontWeight: '600',
    },
    backButton: {
        padding: 12,
        backgroundColor: '#001F3F',
        borderRadius: 8,
    },
    backButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default StreamPlayerScreen;

