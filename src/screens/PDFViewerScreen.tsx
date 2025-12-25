import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Alert, Platform, Linking } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../theme/theme';
import { moderateScale, getSpacing } from '../utils/responsive';
import { MainStackParamList } from '../navigation/MainStack';
import { addDownload } from '../services/api';
import { useToast } from '../components/Toast';
import { Download, Check } from 'lucide-react-native';
import GradientBackground from '../components/GradientBackground';
import ScreenHeader from '../components/ScreenHeader';

type PDFViewerRouteProp = RouteProp<MainStackParamList, 'PDFViewer'>;

const PDFViewerScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute<PDFViewerRouteProp>();
  const { url, title, contentId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [savingToDownloads, setSavingToDownloads] = useState(false);
  const [isInDownloads, setIsInDownloads] = useState(false);
  const toast = useToast();

  // Validate required params
  if (!url) {
    return (
      <GradientBackground>
        <View style={styles.container}>
          <ScreenHeader title="PDF Viewer" showSearch={false} />
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.colors.error || 'red' }]}>
              Missing PDF URL
            </Text>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Text style={[styles.backButtonText, { color: theme.colors.text }]}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </GradientBackground>
    );
  }

  const handleAddToDownloads = async () => {
    if (!contentId || savingToDownloads || isInDownloads) return;

    try {
      setSavingToDownloads(true);
      await addDownload(contentId);
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
  };

  const handleDownload = async () => {
    if (downloading) return;

    try {
      setDownloading(true);

      // Call download API first if contentId is available
      if (contentId) {
        try {
          await addDownload(contentId);
          setIsInDownloads(true);
        } catch (apiError: any) {
          // If already downloaded (409), that's okay - continue with file download
          if (apiError.status === 409) {
            setIsInDownloads(true);
          } else {
            // Log error but continue with file download
            console.warn('Failed to add to downloads API:', apiError);
          }
        }
      }

      // Open PDF in browser for download
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        if (contentId) {
          toast.show({ text: 'PDF opened in browser', type: 'success' });
        }
      } else {
        Alert.alert('Error', 'Cannot open PDF URL');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setDownloading(false);
    }
  };

  // Create HTML content to display PDF using Google Docs Viewer for better compatibility
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <style>
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          html, body {
            width: 100%;
            height: 100%;
            overflow: hidden;
            background-color: ${theme.isDark ? '#1a1a1a' : '#ffffff'};
          }
          iframe {
            width: 100%;
            height: 100vh;
            border: none;
          }
        </style>
      </head>
      <body>
        <iframe src="https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true"></iframe>
      </body>
    </html>
  `;

  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <ScreenHeader 
            title={title || 'PDF Viewer'} 
            showSearch={false}
            onBackPress={() => navigation.goBack()}
          />
        
        </View>

        <View style={styles.webViewContainer}>
          <WebView
            source={{ html: htmlContent }}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView error: ', nativeEvent);
              Alert.alert(
                'Error', 
                'Failed to load PDF. You can download it using the download button.',
                [
                  { text: 'OK', onPress: () => setLoading(false) },
                  { text: 'Download', onPress: handleDownload }
                ]
              );
              setLoading(false);
            }}
            style={styles.webView}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={true}
            renderLoading={() => (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
              </View>
            )}
          />
          {loading && (
            <View style={styles.loader}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
            </View>
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
  header: {
    marginBottom: getSpacing(1),
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: getSpacing(2),
    paddingBottom: getSpacing(1),
    gap: getSpacing(1),
  },
  actionButton: {
    padding: getSpacing(0.5),
  },
  webViewContainer: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  loader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    padding: getSpacing(1),
    marginTop: getSpacing(2),
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PDFViewerScreen;
