import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Share,
  Platform,
  Alert,
  PermissionsAndroid,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Download, Share2 } from 'lucide-react-native';
import { useTheme } from '../theme/theme';
import { moderateScale, getSpacing, scale, verticalScale } from '../utils/responsive';
import GradientBackground from '../components/GradientBackground';
import ScreenHeader from '../components/ScreenHeader';
import type { MainStackParamList } from '../navigation/MainStack';
import { createPaymentLink } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '../components/Toast';
import ReactNativeBlobUtil from 'react-native-blob-util';

type QRCodePaymentRouteProp = RouteProp<MainStackParamList, 'QRCodePayment'>;

const QRCodePaymentScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute<QRCodePaymentRouteProp>();
  const { courseId, packageId, originalPrice, currentPrice, discountCode, preFetchedQrData } = route.params || {};
  const toast = useToast();

  // Normalize and validate params - filter out empty strings
  const normalizedCourseId = courseId?.trim() || '';
  const normalizedPackageId = packageId?.trim() || undefined;
  const normalizedDiscountCode = discountCode?.trim() || undefined;

  // Validate required params - check for empty strings too
  if (!normalizedCourseId || normalizedCourseId === '') {
    return (
      <GradientBackground>
        <ScreenHeader showSearch={false} />
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error || 'red' }]}>
            Missing course information
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: theme.colors.text }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </GradientBackground>
    );
  }

  // Create Razorpay Payment Link and get QR code
  // Use pre-fetched data if available, otherwise fetch
  const { data: paymentLinkData, isLoading, error, refetch } = useQuery({
    queryKey: [
      'qrCodePaymentLink', 
      normalizedCourseId, 
      normalizedPackageId || null, 
      normalizedDiscountCode || null
    ],
    queryFn: async () => {
      // If pre-fetched data is available, use it immediately
      if (preFetchedQrData) {
        if (__DEV__) {
          console.log('[QRCodePayment] Using pre-fetched payment link:', preFetchedQrData);
        }
        return preFetchedQrData;
      }
      
      try {
        // Only pass packageId and discountCode if they have valid non-empty values
        const linkData = await createPaymentLink(
          normalizedCourseId,
          normalizedPackageId || undefined,
          normalizedDiscountCode || undefined
        );
        if (__DEV__) {
          console.log('[QRCodePayment] Payment link created:', linkData);
        }
        return linkData;
      } catch (err: any) {
        if (__DEV__) {
          console.error('[QRCodePayment] Error creating payment link:', err);
        }
        toast.show({ text: err?.message || 'Failed to create payment link', type: 'error' });
        throw err;
      }
    },
    enabled: !!normalizedCourseId && normalizedCourseId !== '',
    retry: 1,
    initialData: preFetchedQrData, // Use pre-fetched data as initial data
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  console.log('paymentLinkData', paymentLinkData);

  // Get QR code image URL from API response - prioritize qrImageUrl (direct image URL)
  const qrImageUrl = React.useMemo(() => {
    if (!paymentLinkData) {
      if (__DEV__) {
        console.log('[QRCodePayment] No payment link data available');
      }
      return null;
    }
    
    // Prioritize qrImageUrl (direct image URL from API), then fallback to qrUrl or short_url
    const imageUrl = paymentLinkData.qrImageUrl || paymentLinkData.qrUrl || paymentLinkData.short_url || null;
    
    if (__DEV__) {
      console.log('[QRCodePayment] QR Image URL extracted:', imageUrl, {
        qrImageUrl: paymentLinkData.qrImageUrl,
        qrUrl: paymentLinkData.qrUrl,
        short_url: paymentLinkData.short_url,
        finalImageUrl: imageUrl,
      });
    }
    
    return imageUrl;
  }, [paymentLinkData]);

  const handleDownload = async () => {
    if (!qrImageUrl || downloading) {
      if (!qrImageUrl) {
        toast.show({ text: 'QR code not available', type: 'error' });
      }
      return;
    }

    try {
      setDownloading(true);

      // Request storage permission for Android
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: 'Storage Permission',
            message: 'App needs access to storage to download QR code',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          toast.show({ text: 'Storage permission denied', type: 'error' });
          setDownloading(false);
          return;
        }
      }

      const { dirs } = ReactNativeBlobUtil.fs;
      const fileName = `QRCode_${normalizedCourseId}_${Date.now()}.png`;
      const path = Platform.OS === 'ios' 
        ? `${dirs.DocumentDir}/${fileName}` 
        : `${dirs.DownloadDir}/${fileName}`;

      ReactNativeBlobUtil.config({
        fileCache: true,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          path: path,
          description: 'Downloading QR Code...',
          title: fileName,
          mediaScannable: true,
          mime: 'image/png',
        },
        path: path,
      })
        .fetch('GET', qrImageUrl)
        .then((res) => {
          if (Platform.OS === 'ios') {
            ReactNativeBlobUtil.ios.previewDocument(res.path());
          }
          toast.show({ text: 'QR code downloaded successfully', type: 'success' });
        })
        .catch((err) => {
          console.error('Download error:', err);
          toast.show({ text: 'Failed to download QR code', type: 'error' });
        })
        .finally(() => {
          setDownloading(false);
        });
    } catch (error) {
      console.error('Download error:', error);
      toast.show({ text: 'Failed to download QR code', type: 'error' });
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (!qrImageUrl) {
      toast.show({ text: 'QR code not available', type: 'error' });
      return;
    }

    try {
      // Get payment URL for sharing
      const paymentUrl = paymentLinkData?.qrUrl || paymentLinkData?.short_url || qrImageUrl;
      const shareMessage = `Scan this QR code to make payment:\n${paymentUrl}`;

      const result = await Share.share({
        message: shareMessage,
        url: qrImageUrl, // For iOS, this will share the image
        title: 'QR Code Payment',
      });

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Shared with activity type of result.activityType
          toast.show({ text: 'QR code shared successfully', type: 'success' });
        } else {
          // Shared
          toast.show({ text: 'QR code shared successfully', type: 'success' });
        }
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
      }
    } catch (error: any) {
      console.error('Share error:', error);
      toast.show({ text: error?.message || 'Failed to share QR code', type: 'error' });
    }
  };

  // Track image loading state
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Reset loading state when qrImageUrl changes
  useEffect(() => {
    if (qrImageUrl) {
      setImageLoading(true);
      setImageError(false);
    }
  }, [qrImageUrl]);

  return (
    <GradientBackground>
      <ScreenHeader title="QR Code Payment" showSearch={false} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* QR Code Container */}
        <View style={styles.qrCodeContainer}>
          {isLoading || !qrImageUrl ? (
            // Loading placeholder
            <View style={styles.qrCodePlaceholder}>
              <ActivityIndicator size="large" color={theme.colors.accent || '#001F3F'} />
              <Text style={[styles.qrCodePlaceholderText, { color: theme.colors.textSecondary }]}>
                Loading QR Code...
              </Text>
            </View>
          ) : imageError ? (
            // Error state
            <View style={styles.qrCodePlaceholder}>
              <Text style={[styles.qrCodePlaceholderText, { color: theme.colors.error || 'red' }]}>
                Failed to load QR Code
              </Text>
              <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // QR Code Image
            <View style={styles.qrCodeImageWrapper}>
              {imageLoading && (
                <View style={styles.qrCodeImageLoadingOverlay}>
                  <ActivityIndicator size="large" color={theme.colors.accent || '#001F3F'} />
                </View>
              )}
              <Image
                source={{ uri: qrImageUrl }}
                style={styles.qrCodeImage}
                resizeMode="contain"
                onLoadStart={() => setImageLoading(true)}
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  setImageLoading(false);
                  setImageError(true);
                }}
              />
            </View>
          )}
        </View>

        {/* Company Name */}
        <Text style={[styles.companyName, { color: theme.colors.text }]}>
          TARGET BOARD LEARNING SPACE PVT. LTD.
        </Text>

        {/* Note */}
        <View style={styles.noteContainer}>
          <Text style={[styles.noteLabel, { color: theme.colors.text }]}>Note:</Text>
          <Text style={[styles.noteText, { color: theme.colors.textSecondary }]}>
            आप किसी भी फ़ोन से QR Code स्कैन करके फीस भर सकते हैं, आपको तुरंत बैच का Access मिल जायेगा
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={[
            styles.actionButton, 
            styles.downloadButton, 
            { 
              backgroundColor: downloading || !qrImageUrl ? '#CCCCCC' : '#9C27B0',
              opacity: downloading || !qrImageUrl ? 0.6 : 1,
            }
          ]}
          onPress={handleDownload}
          activeOpacity={0.8}
          disabled={downloading || !qrImageUrl}
        >
          {downloading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Download size={moderateScale(20)} color="#FFFFFF" />
          )}
          <Text style={styles.actionButtonText}>
            {downloading ? 'Downloading...' : 'Download'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton, 
            styles.shareButton, 
            { 
              backgroundColor: !qrImageUrl ? '#CCCCCC' : theme.colors.accent,
              opacity: !qrImageUrl ? 0.6 : 1,
            }
          ]}
          onPress={handleShare}
          activeOpacity={0.8}
          disabled={!qrImageUrl}
        >
          <Share2 size={moderateScale(20)} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>
      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: getSpacing(2),
    paddingBottom: verticalScale(100),
    alignItems: 'center',
  },
  qrCodeContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: getSpacing(2.5),
  },
  qrCodePlaceholder: {
    width: scale(850),
    height: verticalScale(550),
    maxWidth: '95%',
    backgroundColor: '#F5F5F5',
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: moderateScale(2),
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  qrCodeImageWrapper: {
    position: 'relative',
    width: scale(950),
    height: verticalScale(550),
    maxWidth: '95%',
  },
  qrCodeImageLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(245, 245, 245, 0.8)',
    borderRadius: moderateScale(12),
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  qrCodeImage: {
    width: scale(850),
    height: verticalScale(550),
    maxWidth: '95%',
    borderRadius: moderateScale(12),
  },
  qrCodePlaceholderText: {
    fontSize: moderateScale(18),
    fontWeight: '600',
    color: '#9E9E9E',
    textAlign: 'center',
    marginBottom: getSpacing(1),
  },
  retryButton: {
    marginTop: getSpacing(1.5),
    paddingHorizontal: getSpacing(2.5),
    paddingVertical: getSpacing(1),
    backgroundColor: '#001F3F',
    borderRadius: moderateScale(8),
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  companyName: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    marginBottom: getSpacing(3),
    textAlign: 'center',
  },
  noteContainer: {
    width: '100%',
    maxWidth: scale(400),
  },
  noteLabel: {
    fontSize: moderateScale(14),
    fontWeight: '700',
    marginBottom: getSpacing(1),
  },
  noteText: {
    fontSize: moderateScale(14),
    lineHeight: moderateScale(20),
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: getSpacing(2),
    paddingVertical: getSpacing(1.5),
    paddingBottom: verticalScale(20),
    gap: getSpacing(1.5),
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(8),
    gap: getSpacing(1),
  },
  downloadButton: {
    // Styles handled by backgroundColor
  },
  shareButton: {
    // Styles handled by backgroundColor
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: getSpacing(2.5),
  },
  errorText: {
    fontSize: moderateScale(16),
    marginBottom: getSpacing(2.5),
    textAlign: 'center',
  },
  backButton: {
    padding: getSpacing(1.5),
    backgroundColor: '#001F3F',
    borderRadius: moderateScale(8),
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
});

export default QRCodePaymentScreen;

