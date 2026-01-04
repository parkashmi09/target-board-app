import React, { useCallback, useState, useMemo } from 'react';
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
import { X } from 'lucide-react-native';
import { useTheme } from '../theme/theme';
import { moderateScale, getSpacing } from '../utils/responsive';
import { MainStackParamList } from '../navigation/MainStack';
import GradientBackground from '../components/GradientBackground';
import ScreenHeader from '../components/ScreenHeader';

/**
 * VideoPlayerScreen - Uses TPStreams SDK for video playback
 * 
 * ✅ CORRECT MAPPING FROM JSON DATA:
 * - videoId = tpAssetId (from stream.tpAssetId)
 * - accessToken = DEFAULT_ACCESS_TOKEN (should be fetched from backend in production)
 * 
 * Example JSON structure:
 * {
 *   "tpAssetId": "AAT3Z7YX8Hr",
 *   "hlsUrl": "https://d3tphhabckqhz3.cloudfront.net/live/kuepke/AAT3Z7YX8Hr/video.m3u8"
 * }
 * 
 * ⚠️ TODO: Replace static DEFAULT_ACCESS_TOKEN with backend API call
 * GET /api/tpstreams/access-token -> { "accessToken": "..." }
 */

type VideoPlayerScreenRouteProp = RouteProp<MainStackParamList, 'VideoPlayer'>;

// TPStreams Configuration
const ORG_ID = 'kuepke';

// Initialize TPStreams once at module load
TPStreams.initialize(ORG_ID);

const VideoPlayerScreen: React.FC = () => {
  const theme = useTheme();
  const { colors } = theme;
  const navigation = useNavigation();
  const route = useRoute<VideoPlayerScreenRouteProp>();
  const { hlsUrl, title, tpAssetId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  
  // TPStreams Configuration
  const DEFAULT_ACCESS_TOKEN = 'eb608abc-0b42-4dc4-b161-fe6512b996a8';
  
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

  // Handle orientation when screen is focused - keep in portrait mode
  useFocusEffect(
    useCallback(() => {
      // Unlock all orientations first
      Orientation.unlockAllOrientations();
      
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
    }, [])
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

  const handleError = useCallback((errorData: any) => {
    console.error('TPStreams Player error:', errorData);
    setLoading(false);
    setError('Failed to load video');
  }, []);

  const handleAccessTokenExpired = useCallback(async (videoId: string, callback: (token: string) => void) => {
    // ⚠️ TODO: In production, fetch a new token from your backend API
    // For now, return the same token (this may fail if token is expired)
    // Example: const newToken = await fetch('/api/tpstreams/access-token').then(r => r.json());
    callback(DEFAULT_ACCESS_TOKEN);
  }, []);

  if (!videoId) {
    return (
      <View style={[styles.wrapper, { backgroundColor: colors.background || '#FFFFFF' }]}>
        <View style={[styles.header, { backgroundColor: colors.background || '#FFFFFF' }]}>
          <Text style={[styles.title, { color: colors.text || '#000' }]} numberOfLines={1}>
            {title || 'Video Player'}
          </Text>
          <TouchableOpacity onPress={handleClose}>
            <X size={24} color={colors.text || '#000'} />
          </TouchableOpacity>
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: colors.error || '#ff0000' }]}>
            Video URL not available
          </Text>
        </View>
      </View>
    );
  }

  return (
   <GradientBackground>
     <View>
     <ScreenHeader title="Video Player" showSearch={false} />
      
    

     {/* Video Container - 30% height */}
     {/* ✅ CORRECT MAPPING: videoId = tpAssetId, accessToken = DEFAULT_ACCESS_TOKEN */}
     <View style={[styles.videoWrapper, { height: videoHeight }]}>
       <TPStreamsPlayerView
         videoId={videoId}
         accessToken={DEFAULT_ACCESS_TOKEN}
         shouldAutoPlay={true}
         showDefaultCaptions={false}
         enableDownload={false}
         style={styles.video}
         onPlayerStateChanged={handlePlayerStateChanged}
         onIsPlayingChanged={handleIsPlayingChanged}
         onIsLoadingChanged={handleIsLoadingChanged}
         onError={handleError}
         onAccessTokenExpired={handleAccessTokenExpired}
       />

       {/* Loading Indicator */}
       {loading && (
         <View style={styles.loader}>
           <ActivityIndicator size="large" color={colors.accent || '#000'} />
         </View>
       )}

       {/* Error Message */}
       {error && (
         <View style={styles.errorOverlay}>
           <Text style={[styles.errorText, { color: colors.error || '#ff0000' }]}>
             {error}
           </Text>
         </View>
       )}
     </View>

     {/* White space below video - 70% of screen */}
     <View style={[styles.contentArea, { backgroundColor: colors.background || '#FFFFFF' }]} />
   </View>
   </GradientBackground>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: Platform.OS === 'ios' ? 60 : 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getSpacing(2),
    paddingTop: Platform.OS === 'ios' ? getSpacing(2) : 0,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    flex: 1,
    fontSize: moderateScale(16),
    fontWeight: '600',
    color: '#000',
    marginRight: getSpacing(1),
  },
  closeButton: {
    padding: getSpacing(0.5),
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 5,
  },
  contentArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    color: '#ff0000',
  },
  errorOverlay: {
    position: 'absolute',
    bottom: getSpacing(4),
    left: getSpacing(2),
    right: getSpacing(2),
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: getSpacing(2),
    borderRadius: moderateScale(8),
    zIndex: 5,
  },
});

export default VideoPlayerScreen;

