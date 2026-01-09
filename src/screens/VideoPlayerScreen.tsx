import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
// @ts-ignore - react-native-tpstreams types may not be available
import { TPStreams, TPStreamsPlayerView } from 'react-native-tpstreams';
import { Check, BookmarkPlus } from 'lucide-react-native';
import { useTheme } from '../theme/theme';
import { getSpacing } from '../utils/responsive';
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
import { TPSTREAMS_ORG_ID } from '../services/config';

// Initialize TPStreams once at module load
TPStreams.initialize(TPSTREAMS_ORG_ID);

const VideoPlayerScreen: React.FC = () => {
  const theme = useTheme();
  const { colors } = theme;
  const route = useRoute<VideoPlayerScreenRouteProp>();
  const { 
    title, 
    tpAssetId,
    contentId,
    accessToken: routeAccessToken,
    startInFullscreen = false,
    enableDownload = true,
    offlineLicenseExpireTime,
    downloadMetadata,
    startAt,
  } = route.params || {};

  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [savingToDownloads, setSavingToDownloads] = useState(false);
  const [isInDownloads, setIsInDownloads] = useState(false);
  const toast = useToast();
  
  // TPStreams Configuration
  const DEFAULT_ACCESS_TOKEN = 'eb608abc-0b42-4dc4-b161-fe6512b996a8';
  const accessToken = routeAccessToken || DEFAULT_ACCESS_TOKEN;
  const videoId = tpAssetId || null;

  // Delay player rendering to ensure screen layout is complete
  useEffect(() => {
    const timer = setTimeout(() => setIsPlayerReady(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Handle adding video to downloads
  const handleAddToDownloads = useCallback(async () => {
    if (!contentId || savingToDownloads || isInDownloads) return;

    try {
      setSavingToDownloads(true);
      await addDownload(contentId, 'video');
      setIsInDownloads(true);
      toast.show({ text: 'Added to downloads', type: 'success' });
    } catch (error: any) {
      if (error.status === 409) {
        setIsInDownloads(true);
        toast.show({ text: 'Already in downloads', type: 'info' });
      } else {
        toast.show({ text: error.message || 'Failed to add to downloads', type: 'error' });
      }
    } finally {
      setSavingToDownloads(false);
    }
  }, [contentId, savingToDownloads, isInDownloads, toast]);

  if (!videoId) {
    return (
      <GradientBackground>
        <ScreenHeader title={title || "Video Player"} showSearch={false} />
        <View style={styles.container} />
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
        
        <View style={styles.playerContainer}>
          {isPlayerReady && (
            <TPStreamsPlayerView
              videoId={videoId}
              accessToken={accessToken}
              enableDownload={enableDownload}
              shouldAutoPlay={true}
              showDefaultCaptions={false}
              offlineLicenseExpireTime={offlineLicenseExpireTime}
              downloadMetadata={downloadMetadata}
              startAt={startAt}
              startInFullscreen={startInFullscreen}
              style={styles.player}
            />
          )}
        </View>
      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  playerContainer: {
    width: '100%',
    backgroundColor: '#000',
  },
  player: {
    height: 250,
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

