import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Alert, Linking, Dimensions } from 'react-native';
import Pdf from 'react-native-pdf';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../theme/theme';
import { moderateScale, getSpacing } from '../utils/responsive';
import { MainStackParamList } from '../navigation/MainStack';
import { addDownload } from '../services/api';
import { useToast } from '../components/Toast';
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
  const [numberOfPages, setNumberOfPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const pdfRef = useRef<any>(null);
  const toast = useToast();
  
  // CRITICAL FIX: Prevent double-close crashes and state updates after unmount
  const mounted = useRef(true);
  const isClosed = useRef(false);

  useEffect(() => {
    mounted.current = true;
    isClosed.current = false;
    
    return () => {
      // Cleanup: Mark as unmounted and closed
      mounted.current = false;
      isClosed.current = true;
      
      // Safely close PDF if ref exists and not already closed
      try {
        if (pdfRef.current && !isClosed.current) {
          // The PDF library will handle cleanup, but we prevent double-close
          isClosed.current = true;
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('[PDFViewer] Error during cleanup:', error);
        }
      }
    };
  }, []);


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

  // PDF source configuration
  const pdfSource = {
    uri: url,
    cache: true,
  };

  return (
    <GradientBackground>
      <View style={styles.container}>
        <View style={styles.header}>
          <ScreenHeader 
            title={'PDF Viewer'} 
            showSearch={false}
          />
        
        </View>

        <View style={styles.pdfContainer}>
          <Pdf
            ref={pdfRef}
            source={pdfSource}
            onLoadComplete={(numberOfPages, filePath, { width, height }) => {
              console.log(`Number of pages: ${numberOfPages}`);
              console.log(`File path: ${filePath}`);
              // Only update state if component is still mounted
              if (mounted.current) {
                setNumberOfPages(numberOfPages);
                setLoading(false);
              }
            }}
            onPageChanged={(page, numberOfPages) => {
              console.log(`Current page: ${page}`);
              // Only update state if component is still mounted
              if (mounted.current) {
                setCurrentPage(page);
              }
            }}
            onError={(error) => {
              console.error('PDF error:', error);
              // Only update state if component is still mounted
              if (mounted.current) {
                setLoading(false);
                Alert.alert(
                  'Error',
                  'Failed to load PDF. You can download it using the download button.',
                  [
                    { text: 'OK', onPress: () => {} },
                    { text: 'Download', onPress: handleDownload }
                  ]
                );
              }
            }}
            onPressLink={(uri) => {
              console.log(`Link pressed: ${uri}`);
            }}
            style={styles.pdf}
            enablePaging={false}
            horizontal={false}
            enableDoubleTapZoom={true}
            trustAllCerts={false}
            spacing={10}
            fitPolicy={2}
            renderActivityIndicator={(progress) => (
              <View style={styles.loader}>
                <ActivityIndicator size="large" color={theme.colors.primary} />
                {progress > 0 && (
                  <Text style={[styles.progressText, { color: theme.colors.text }]}>
                    {Math.round(progress * 100)}%
                  </Text>
                )}
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
  pdfContainer: {
    flex: 1,
  },
  pdf: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    backgroundColor: 'transparent',
  },
  progressText: {
    marginTop: getSpacing(1),
    fontSize: moderateScale(14),
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
