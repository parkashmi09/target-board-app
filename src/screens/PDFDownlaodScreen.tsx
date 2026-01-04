import React, { useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ActivityIndicator, Alert, Platform, PermissionsAndroid, Dimensions } from 'react-native';
import Pdf from 'react-native-pdf';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTheme } from '../theme/theme';
import { moderateScale, getSpacing } from '../utils/responsive';
import ReactNativeBlobUtil from 'react-native-blob-util';
import { MainStackParamList } from '../navigation/MainStack';
import { addDownload } from '../services/api';
import { useToast } from '../components/Toast';
import { Download, Check, BookmarkPlus } from 'lucide-react-native';
import GradientBackground from '../components/GradientBackground';
import ScreenHeader from '../components/ScreenHeader';

type PDFDownloadRouteProp = RouteProp<MainStackParamList, 'PDFDownload'>;

const PDFDownloadScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute<PDFDownloadRouteProp>();
  const { url, title, contentId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [savingToDownloads, setSavingToDownloads] = useState(false);
  const [isInDownloads, setIsInDownloads] = useState(false);
  const [numberOfPages, setNumberOfPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const pdfRef = useRef<any>(null);
  const toast = useToast();

  // Validate required params
  if (!url) {
    return (
      <GradientBackground>
        <View style={styles.container}>
          <ScreenHeader 
            title="PDF Viewer" 
            showSearch={false}
            onBackPress={() => navigation.goBack()}
          />
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: theme.colors.error || 'red' }]}>
              Missing PDF URL
            </Text>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.errorBackButton}>
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

      // Permission check for Android
      if (Platform.OS === 'android') {
        if (Platform.Version < 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
            {
              title: 'Storage Permission Required',
              message: 'App needs access to your storage to download the PDF',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
            Alert.alert('Permission Denied', 'Storage permission is required to download files.');
            setDownloading(false);
            return;
          }
        }
      }

      const { dirs } = ReactNativeBlobUtil.fs;
      const fileName = title ? `${title.replace(/[^a-zA-Z0-9]/g, '_')}.pdf` : url.split('/').pop() || 'document.pdf';
      const path = Platform.OS === 'ios' ? dirs.DocumentDir + '/' + fileName : dirs.DownloadDir + '/' + fileName;

      ReactNativeBlobUtil.config({
        fileCache: true,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          path: path,
          description: 'Downloading PDF...',
          title: fileName,
          mediaScannable: true,
        },
        path: path,
      })
        .fetch('GET', url)
        .then((res) => {
          Alert.alert('Success', `File downloaded to ${res.path()}`);
          if (Platform.OS === 'ios') {
            ReactNativeBlobUtil.ios.previewDocument(res.path());
          }
          if (contentId) {
            toast.show({ text: 'PDF downloaded and added to downloads', type: 'success' });
          } else {
            toast.show({ text: 'PDF downloaded successfully', type: 'success' });
          }
        })
        .catch((err) => {
          console.error(err);
          Alert.alert('Error', 'Failed to download file');
          toast.show({ text: 'Failed to download PDF', type: 'error' });
        })
        .finally(() => {
          setDownloading(false);
        });

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'An unexpected error occurred');
      setDownloading(false);
    }
  };

  // PDF source configuration
  const pdfSource = {
    uri: url,
    cache: true,
  };

  // Right component with download buttons
  const rightComponent = (
    <View style={styles.headerActions}>
      {contentId && (
        <TouchableOpacity 
          onPress={handleAddToDownloads} 
          style={styles.actionButton} 
          disabled={savingToDownloads || isInDownloads}
        >
          {savingToDownloads ? (
            <ActivityIndicator size="small" color={theme.colors.text} />
          ) : isInDownloads ? (
            <Check size={20} color={theme.colors.success || '#4CAF50'} />
          ) : (
            <BookmarkPlus size={20} color={theme.colors.text} />
          )}
        </TouchableOpacity>
      )}
      <TouchableOpacity 
        onPress={handleDownload} 
        style={styles.actionButton} 
        disabled={downloading}
      >
        {downloading ? (
          <ActivityIndicator size="small" color={theme.colors.text} />
        ) : (
          <Download size={20} color={theme.colors.text} />
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <GradientBackground>
      <View style={styles.container}>
        <ScreenHeader 
          title={title || 'PDF Viewer'} 
          showSearch={false}
          onBackPress={() => navigation.goBack()}
          rightComponent={rightComponent}
        />

        <View style={styles.pdfContainer}>
          <Pdf
            ref={pdfRef}
            source={pdfSource}
            onLoadComplete={(numberOfPages, filePath, { width, height }) => {
              console.log(`Number of pages: ${numberOfPages}`);
              console.log(`File path: ${filePath}`);
              setNumberOfPages(numberOfPages);
              setLoading(false);
            }}
            onPageChanged={(page, numberOfPages) => {
              console.log(`Current page: ${page}`);
              setCurrentPage(page);
            }}
            onError={(error) => {
              console.error('PDF error:', error);
              setLoading(false);
              Alert.alert(
                'Error',
                'Failed to load PDF. You can download it using the download button.',
                [
                  { text: 'OK', onPress: () => {} },
                  { text: 'Download', onPress: handleDownload }
                ]
              );
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
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
  errorBackButton: {
    padding: getSpacing(1),
    marginTop: getSpacing(2),
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PDFDownloadScreen;
