import React, { useCallback, useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation, RouteProp, useFocusEffect } from '@react-navigation/native';
// @ts-ignore - react-native-tpstreams types may not be available
import { TPStreams, TPStreamsPlayerView } from 'react-native-tpstreams';
import Orientation from 'react-native-orientation-locker';
import { X, Download, Check, BookmarkPlus } from 'lucide-react-native';
import { useTheme } from '../theme/theme';
import { moderateScale, getSpacing } from '../utils/responsive';
import { MainStackParamList } from '../navigation/MainStack';
import GradientBackground from '../components/GradientBackground';
import ScreenHeader from '../components/ScreenHeader';
import { addDownload } from '../services/api';
import { useToast } from '../components/Toast';

/**
 * VideoPlayerScreen - Uses TPStreams SDK for video playback with DRM support
 * 
 * ✅ CORRECT MAPPING FROM JSON DATA:
 * - videoId = tpAssetId (from stream.tpAssetId)
 * - accessToken = from route params or DEFAULT_ACCESS_TOKEN (should be fetched from backend in production)
 * 
 * Example JSON structure:
 * {
 *   "tpAssetId": "AAT3Z7YX8Hr",
 *   "hlsUrl": "https://d3tphhabckqhz3.cloudfront.net/live/kuepke/AAT3Z7YX8Hr/video.m3u8"
 * }
 * 
 * 🔐 DRM Features Enabled:
 * - enableDownload: true (default) - allows offline DRM video downloads
 * - offlineLicenseExpireTime: configurable via route params
 * - downloadMetadata: configurable via route params
 * - startInFullscreen: configurable via route params
 * 
 * ⚠️ TODO: Replace static DEFAULT_ACCESS_TOKEN with backend API call
 * GET /api/tpstreams/access-token -> { "accessToken": "..." }
 */

type VideoPlayerScreenRouteProp = RouteProp<MainStackParamList, 'VideoPlayer'>;

// TPStreams Configuration
// ⚠️ IMPORTANT: This value comes from .env file
import Config from 'react-native-config';
const ORG_ID = Config.TPSTREAMS_ORG_ID || 'kuepke';

// Initialize TPStreams once at module load
TPStreams.initialize(ORG_ID);

const VideoPlayerScreen: React.FC = () => {
  const theme = useTheme();
  const { colors, isDark } = theme;
  const navigation = useNavigation();
  const route = useRoute<VideoPlayerScreenRouteProp>();
  const { 
    hlsUrl, 
    title, 
    tpAssetId,
    contentId,
    accessToken: routeAccessToken,
    startInFullscreen = false,
    enableDownload = true, // Enable download by default for DRM videos
    offlineLicenseExpireTime,
    downloadMetadata,
    startAt,
  } = route.params || {};

  console.log('[VideoPlayerScreen] Props:', {
   contentId
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [savingToDownloads, setSavingToDownloads] = useState(false);
  const [isInDownloads, setIsInDownloads] = useState(false);
  const toast = useToast();
  
  
  // TPStreams Configuration
  const DEFAULT_ACCESS_TOKEN = 'eb608abc-0b42-4dc4-b161-fe6512b996a8';
  
  // Use route access token if provided, otherwise use default
  const accessToken = useMemo(() => {
    return routeAccessToken || DEFAULT_ACCESS_TOKEN;
  }, [routeAccessToken]);
  
  // Calculate video height - 30% of screen height
  const screenData = Dimensions.get('window');
  const videoHeight = useMemo(() => {
    return screenData.height * 0.3;
  }, [screenData.height]);
  
  // ✅ CORRECT MAPPING: videoId = tpAssetId (from JSON data)
  const videoId = useMemo(() => {
    if (!tpAssetId) {
      return null;
    }
    return tpAssetId;
  }, [tpAssetId]);

  // Delay player rendering to ensure screen layout is complete (for DRM initialization)
  useEffect(() => {
    const timer = setTimeout(() => setIsPlayerReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle orientation when screen is focused
  useFocusEffect(
    useCallback(() => {
      // Unlock all orientations first
      Orientation.unlockAllOrientations();
      
      // If startInFullscreen is true, allow all orientations, otherwise lock to portrait
      if (startInFullscreen) {
        // Allow all orientations for fullscreen mode
        Orientation.unlockAllOrientations();
      } else {
        // Lock to portrait mode (default)
        const timer = setTimeout(() => {
          Orientation.lockToPortrait();
        }, 100);
        
        return () => {
          clearTimeout(timer);
          // Return to portrait when screen loses focus
          Orientation.unlockAllOrientations();
          setTimeout(() => {
            Orientation.lockToPortrait();
          }, 100);
        };
      }
      
      return () => {
        // Cleanup: return to portrait when screen loses focus
        Orientation.unlockAllOrientations();
        setTimeout(() => {
          Orientation.lockToPortrait();
        }, 100);
      };
    }, [startInFullscreen])
  );

  const handleClose = () => {
    navigation.goBack();
  };

  // TPStreams Player Event Handlers
  const handlePlayerStateChanged = useCallback((state: number) => {
    switch(state) {
      case 0:
        // Player is idle
        setLoading(true);
        break;
      case 1:
        // Player is buffering
        setLoading(true);
        break;
      case 2:
        // Player is ready
        setLoading(false);
        setError(null);
        break;
      case 3:
        // Video ended
        setLoading(false);
        break;
      default:
        setLoading(false);
    }
  }, []);

  const handleIsPlayingChanged = useCallback((playing: boolean) => {
    setIsPlaying(playing);
    if (playing) {
      setLoading(false);
    }
  }, []);

  const handleIsLoadingChanged = useCallback((isLoading: boolean) => {
    setLoading(isLoading);
  }, []);

  const handlePlaybackSpeedChanged = useCallback((speed: number) => {
    setPlaybackSpeed(speed);
    if (__DEV__) {
      console.log('[VideoPlayerScreen] Playback speed changed:', speed);
    }
  }, []);

  const handleError = useCallback((errorData: any) => {
    console.error('TPStreams Player error:', errorData);
    setLoading(false);
    const errorMessage = errorData?.message || errorData?.details || 'Failed to load video';
    setError(errorMessage);
  }, []);

  const handleAccessTokenExpired = useCallback(async (videoId: string, callback: (token: string) => void) => {
    // ⚠️ TODO: In production, fetch a new token from your backend API
    // For DRM videos, this is critical - expired tokens will cause playback to fail
    // Example: 
    // const response = await fetch(`/api/tpstreams/access-token?videoId=${videoId}`);
    // const data = await response.json();
    // callback(data.accessToken);
    
    // For now, return the same token (this may fail if token is expired)
    callback(accessToken);
  }, [accessToken]);

  // Handle adding video to downloads
  const handleAddToDownloads = useCallback(async () => {
    if (!contentId || savingToDownloads || isInDownloads) return;

    try {
      setSavingToDownloads(true);
      // Pass 'video' as assetType for video downloads
      await addDownload(contentId, 'video');
      setIsInDownloads(true);
      toast.show({ text: 'Added to downloads', type: 'success' });
    } catch (error: any) {
      if (error.status === 409) {
        setIsInDownloads(true);
        toast.show({ text: 'Already in downloads', type: 'info' });
      } else if (error.status === 404) {
        toast.show({ text: 'Download endpoint not found. Please try again later.', type: 'error' });
        if (__DEV__) {
          console.error('[VideoPlayerScreen] 404 error adding video to downloads:', error);
        }
      } else {
        toast.show({ text: error.message || 'Failed to add to downloads', type: 'error' });
      }
    } finally {
      setSavingToDownloads(false);
    }
  }, [contentId, savingToDownloads, isInDownloads, toast]);

  // Create dynamic styles based on theme
  const dynamicStyles = useMemo(() => ({
    wrapper: {
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.background,
      borderBottomColor: colors.border,
    },
    title: {
      color: colors.text,
    },
    errorText: {
      color: colors.error,
    },
    errorOverlay: {
      backgroundColor: isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.8)',
    },
    contentArea: {
      backgroundColor: colors.background,
    },
    loader: {
      backgroundColor: colors.overlay,
    },
  }), [colors, isDark]);

  if (!videoId) {
    return (
      <GradientBackground>
        <View style={[styles.wrapper, dynamicStyles.wrapper]}>
          <View style={[styles.header, dynamicStyles.header]}>
            <Text style={[styles.title, dynamicStyles.title]} numberOfLines={1}>
              {title || 'Video Player'}
            </Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, dynamicStyles.errorText]}>
              Video URL not available
            </Text>
          </View>
        </View>
      </GradientBackground>
    );
  }

  // Right component with download button
  const rightComponent = contentId ? (
    <View style={styles.headerActions}>
      <TouchableOpacity 
        onPress={handleAddToDownloads} 
        style={styles.actionButton} 
        disabled={savingToDownloads || isInDownloads}
      >
        {savingToDownloads ? (
          <ActivityIndicator size="small" color={colors.text} />
        ) : isInDownloads ? (
          <Check size={20} color={colors.success || '#4CAF50'} />
        ) : (
          <BookmarkPlus size={20} color={colors.text} />
        )}
      </TouchableOpacity>
    </View>
  ) : undefined;

  return (
   <GradientBackground>
     <View style={styles.container}>
       <ScreenHeader 
         title={title || "Video Player"} 
         showSearch={false}
         rightComponent={rightComponent}
       />
       
       {/* Video Container - 30% height */}
       {/* ✅ CORRECT MAPPING: videoId = tpAssetId, accessToken = from route or default */}
       {/* 🔐 DRM Features: enableDownload, offlineLicenseExpireTime, downloadMetadata */}
       <View style={[styles.videoWrapper, { height: videoHeight }]}>
         {isPlayerReady && (
           <TPStreamsPlayerView
             videoId={videoId}
             accessToken={accessToken}
             shouldAutoPlay={true}
             showDefaultCaptions={false}
             enableDownload={enableDownload}
             offlineLicenseExpireTime={offlineLicenseExpireTime}
             downloadMetadata={downloadMetadata}
             startAt={startAt}
             startInFullscreen={startInFullscreen}
             style={styles.video}
             onPlayerStateChanged={handlePlayerStateChanged}
             onIsPlayingChanged={handleIsPlayingChanged}
             onIsLoadingChanged={handleIsLoadingChanged}
             onPlaybackSpeedChanged={handlePlaybackSpeedChanged}
             onError={handleError}
             onAccessTokenExpired={handleAccessTokenExpired}
           />
         )}

         {/* Loading Indicator */}
         {loading && (
           <View style={[styles.loader, dynamicStyles.loader]}>
             <ActivityIndicator size="large" color={colors.accent} />
           </View>
         )}

         {/* Error Message */}
         {error && (
           <View style={[styles.errorOverlay, dynamicStyles.errorOverlay]}>
             <Text style={[styles.errorText, dynamicStyles.errorText]}>
               {error}
             </Text>
           </View>
         )}
       </View>

       {/* Content area below video - 70% of screen */}
       <View style={[styles.contentArea, dynamicStyles.contentArea]} />
     </View>
   </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  wrapper: {
    flex: 1,
  },
  header: {
    height: Platform.OS === 'ios' ? 60 : 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getSpacing(2),
    paddingTop: Platform.OS === 'ios' ? getSpacing(2) : 0,
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    flex: 1,
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginRight: getSpacing(1),
  },
  closeButton: {
    padding: getSpacing(0.5),
    borderRadius: moderateScale(20),
    backgroundColor: 'transparent',
  },
  videoWrapper: {
    width: '100%',
    backgroundColor: '#000',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 5,
  },
  contentArea: {
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getSpacing(4),
  },
  errorText: {
    fontSize: moderateScale(16),
    textAlign: 'center',
    fontWeight: '500',
  },
  errorOverlay: {
    position: 'absolute',
    bottom: getSpacing(4),
    left: getSpacing(2),
    right: getSpacing(2),
    padding: getSpacing(2),
    borderRadius: moderateScale(12),
    zIndex: 5,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: getSpacing(1),
  },
  actionButton: {
    padding: getSpacing(0.5),
  },
});

export default VideoPlayerScreen;

