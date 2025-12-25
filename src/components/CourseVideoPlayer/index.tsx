import React from 'react';
import { View, StyleSheet } from 'react-native';
import WebView from 'react-native-webview';

/**
 * Extract YouTube video ID from URL
 */
const extractYouTubeId = (url: string): string | null => {
  // Handle live YouTube URLs: https://www.youtube.com/live/VIDEO_ID
  const liveMatch = url.match(/youtube\.com\/live\/([^#&?\/]+)/);
  if (liveMatch && liveMatch[1] && liveMatch[1].length === 11) {
    return liveMatch[1];
  }
  
  // Handle regular YouTube URLs
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2] && match[2].length === 11 ? match[2] : null;
};

interface CourseVideoPlayerProps {
  videoUrl?: string;
}

const CourseVideoPlayer: React.FC<CourseVideoPlayerProps> = React.memo(({ videoUrl }) => {
  if (!videoUrl) return null;

  const videoId = extractYouTubeId(videoUrl);
  if (!videoId) return null;

  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&controls=1&fs=1&playsinline=1`;

  return (
    <View style={styles.container}>
      <WebView
        source={{ uri: embedUrl }}
        style={styles.player}
        allowsFullscreenVideo={true}
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        allowsInlineMediaPlayback={true}
        mixedContentMode="always"
      />
    </View>
  );
});

CourseVideoPlayer.displayName = 'CourseVideoPlayer';

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
  },
  player: {
    width: '100%',
    height: '100%',
  },
});

export default CourseVideoPlayer;

