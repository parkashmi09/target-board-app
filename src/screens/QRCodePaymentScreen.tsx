import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
  PermissionsAndroid,
  Dimensions,
  Share as RNShare,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Download, Share2 } from 'lucide-react-native';
import { useTheme } from '../theme/theme';
import {
  moderateScale,
  getSpacing,
  verticalScale,
} from '../utils/responsive';
import { getFontFamily } from '../utils/fonts';
import GradientBackground from '../components/GradientBackground';
import ScreenHeader from '../components/ScreenHeader';
import type { MainStackParamList } from '../navigation/MainStack';
import { createPaymentLink } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '../components/Toast';
import ReactNativeBlobUtil from 'react-native-blob-util';
import Share from 'react-native-share';


type QRCodePaymentRouteProp = RouteProp<
  MainStackParamList,
  'QRCodePayment'
>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const QRCodePaymentScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<QRCodePaymentRouteProp>();
  const toast = useToast();

  const {
    courseId,
    packageId,
    discountCode,
    preFetchedQrData,
  } = route.params || {};

  const normalizedCourseId = courseId?.trim() || '';
  const normalizedPackageId = packageId?.trim() || undefined;
  const normalizedDiscountCode = discountCode?.trim() || undefined;

  /* ---------------- QR SIZE ---------------- */
  // Use full width minus minimal padding (98% of screen width)
  const qrWidth = SCREEN_WIDTH * 1.8;
  const qrHeight = qrWidth * 1;

  /* ---------------- FETCH PAYMENT LINK ---------------- */
  const { data: paymentLinkData, isLoading, refetch } = useQuery({
    queryKey: [
      'qrCodePayment',
      normalizedCourseId,
      normalizedPackageId,
      normalizedDiscountCode,
    ],
    queryFn: async () => {
      if (preFetchedQrData) return preFetchedQrData;
      return createPaymentLink(
        normalizedCourseId,
        normalizedPackageId,
        normalizedDiscountCode
      );
    },
    enabled: !!normalizedCourseId,
  });

  const qrImageUrl = useMemo(() => {
    return (
      paymentLinkData?.qrImageUrl ||
      paymentLinkData?.qrUrl ||
      paymentLinkData?.short_url ||
      null
    );
  }, [paymentLinkData]);

  /* ---------------- IMAGE STATES ---------------- */
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (qrImageUrl) {
      setImageLoading(true);
      setImageError(false);
    }
  }, [qrImageUrl]);

  /* ---------------- PERMISSION HANDLER ---------------- */
  const requestStoragePermission = async () => {
    if (Platform.OS !== 'android') return true;

    if (Platform.Version >= 33) {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }

    if (Platform.Version >= 29) return true;

    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  };

  /* ---------------- DOWNLOAD ---------------- */
  const handleDownload = async () => {
    if (!qrImageUrl || downloading) return;

    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      toast.show({ text: 'Storage permission denied', type: 'error' });
      return;
    }

    try {
      setDownloading(true);

      const { dirs } = ReactNativeBlobUtil.fs;
      const fileName = `QRCode_${Date.now()}.png`;
      
      // For Android, use DownloadDir; for iOS, use DocumentDir
      const downloadPath =
        Platform.OS === 'ios'
          ? `${dirs.DocumentDir}/${fileName}`
          : `${dirs.DownloadDir}/${fileName}`;

      // Download the image
      const response = await ReactNativeBlobUtil.config({
        fileCache: true,
        addAndroidDownloads: {
          useDownloadManager: true,
          notification: true,
          path: downloadPath,
          description: 'QR Code Payment Image',
          title: fileName,
          mime: 'image/png',
          mediaScannable: true,
        },
      }).fetch('GET', qrImageUrl);

      const savedPath = response.path();
      
      // For iOS, open the file location
      if (Platform.OS === 'ios') {
        ReactNativeBlobUtil.ios.previewDocument(savedPath);
      }

      toast.show({
        text: Platform.OS === 'ios' 
          ? 'QR code saved to Files app' 
          : 'QR code downloaded to Downloads folder',
        type: 'success',
      });
    } catch (error: any) {
      console.error('Download error:', error);
      toast.show({
        text: error?.message || 'Failed to download QR code',
        type: 'error',
      });
    } finally {
      setDownloading(false);
    }
  };

  /* ---------------- SHARE ---------------- */
  const handleShare = async () => {
    if (!qrImageUrl || sharing) return;
  
    try {
      setSharing(true);
  
      const { dirs } = ReactNativeBlobUtil.fs;
      const fileName = `QRCode_${Date.now()}.png`;
      const filePath = `${dirs.CacheDir}/${fileName}`;
  
      // Check if qrImageUrl is actually an image URL or a payment link
      // Prioritize qrImageUrl from API (should be direct image URL)
      let imageUrl = paymentLinkData?.qrImageUrl || qrImageUrl;
      const isImageUrl = imageUrl.match(/\.(png|jpg|jpeg|gif|webp)(\?|$)/i);
      
      // If we don't have a direct image URL and it's a payment link, 
      // the API should provide qrImageUrl, but if not, try to construct it
      if (!isImageUrl && imageUrl.includes('rzp.io')) {
        // Razorpay payment links - try common QR code image endpoints
        const possibleImageUrls = [
          imageUrl.replace(/\/$/, '') + '/qr.png',
          imageUrl.replace(/\/$/, '') + '/qr.jpg',
          imageUrl + '/qr.png',
          imageUrl + '/qr.jpg',
        ];
        imageUrl = possibleImageUrls[0];
      }
  
      // Download the QR code image with proper headers
      const response = await ReactNativeBlobUtil.config({
        fileCache: true,
        path: filePath,
        addAndroidDownloads: {
          useDownloadManager: false,
        },
      }).fetch('GET', imageUrl, {
        'Content-Type': 'image/png',
        'Accept': 'image/png,image/jpeg,image/*',
      });
  
      const savedPath = response.path();
  
      if (!(await ReactNativeBlobUtil.fs.exists(savedPath))) {
        throw new Error('File not found after download');
      }
  
      // Verify it's actually an image by checking file size and content
      const fileInfo = await ReactNativeBlobUtil.fs.stat(savedPath);
      if (fileInfo.size === 0) {
        throw new Error('Downloaded file is empty');
      }
  
      // Prepare file URI - use file:// prefix for both platforms
      // react-native-share needs this format for proper image sharing
      const fileUri = savedPath.startsWith('file://') 
        ? savedPath 
        : `file://${savedPath}`;
  
      // Prepare share message with payment link
      const paymentLink = qrImageUrl;
      const message = `Please scan this QR code to complete the payment.\n\nUPI apps supported: GPay, PhonePe, Paytm\n\nPayment Link: ${paymentLink}`;
  
      // Use react-native-share with proper configuration for image preview
      // The key is using url with type: 'image/png' for WhatsApp to show preview
      await Share.open({
        title: 'Course Payment QR Code',
        message: message,
        url: fileUri,
        type: 'image/png',
        filename: fileName,
        failOnCancel: false,
        showAppsToView: true,
      });
  
      toast.show({ text: 'QR code shared successfully', type: 'success' });
    } catch (error: any) {
      console.error('Share error:', error);
      
      // User cancelled - don't show error
      if (
        error?.message?.includes('User did not share') ||
        error?.message?.includes('cancel') ||
        error?.message?.includes('User cancelled') ||
        error?.code === 'E_SHARE_CANCELLED'
      ) {
        return;
      }
      
      // Fallback: Try sharing the image URL directly if it's a web URL
      if (qrImageUrl.startsWith('http://') || qrImageUrl.startsWith('https://')) {
        try {
          // Try using React Native's built-in Share for URL sharing
          await RNShare.share({
            title: 'Course Payment QR Code',
            message: Platform.OS === 'android'
              ? `Please scan this QR code to complete the payment.\n\nUPI apps supported: GPay, PhonePe, Paytm\n\n${qrImageUrl}`
              : `Please scan this QR code to complete the payment.\n\nUPI apps supported: GPay, PhonePe, Paytm`,
            url: Platform.OS === 'ios' ? qrImageUrl : undefined,
          });
          toast.show({ text: 'QR code link shared', type: 'success' });
        } catch (fallbackError) {
          toast.show({ text: 'Failed to share QR code', type: 'error' });
        }
      } else {
        toast.show({ text: 'Failed to share QR code', type: 'error' });
      }
    } finally {
      setSharing(false);
    }
  };

  console.log('qrImageUrl', qrImageUrl);
  
  
  

  return (
    <GradientBackground>
      <ScreenHeader title="QR Code Payment" showSearch={false} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.qrContainer}>
          {isLoading || !qrImageUrl ? (
            <ActivityIndicator size="large" color={theme.colors.accent} />
          ) : imageError ? (
            <TouchableOpacity onPress={() => refetch()}>
              <Text style={[styles.retryText, { color: theme.colors.text }]}>Retry</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.qrCard, { backgroundColor: theme.colors.cardBackground }]}>
              {/* Powered by Razorpay Section */}
              <View style={styles.brandingSection}>
                <Text style={[styles.poweredByText, { color: theme.colors.textSecondary }]}>
                  Powered by
                </Text>
                <Text style={[styles.razorpayText, { color: '#0B2447' }]}>
                  Razorpay
                </Text>
                <View style={styles.upiLogosContainer}>
                  <Text style={[styles.upiLogoText, { color: theme.colors.textSecondary }]}>
                    BHIM
                  </Text>
                  <View style={styles.logoDivider} />
                  <Text style={[styles.upiLogoText, { color: theme.colors.textSecondary }]}>
                    UPI
                  </Text>
                </View>
              </View>

              {/* QR Code Image */}
              <View style={styles.qrImageContainer}>
                {imageLoading && (
                  <View style={[styles.loadingOverlay, { backgroundColor: theme.colors.cardBackground }]}>
                    <ActivityIndicator size="large" color={theme.colors.accent} />
                  </View>
                )}
                <Image
                  source={{ uri: qrImageUrl }}
                  style={styles.qrImage}
                  resizeMode="contain"
                  onLoad={() => setImageLoading(false)}
                  onError={() => setImageError(true)}
                />
              </View>

              {/* Scan & Pay Text */}
              <Text style={[styles.scanPayText, { color: theme.colors.text }]}>
                SCAN & PAY WITH ANY UPI APP
              </Text>

              {/* UPI Apps Logos */}
              <View style={styles.upiAppsContainer}>
                <Text style={[styles.upiAppName, { color: theme.colors.text }]}>G Pay</Text>
                <Text style={[styles.upiAppName, { color: theme.colors.text }]}>PhonePe</Text>
                <Text style={[styles.upiAppName, { color: theme.colors.text }]}>Paytm</Text>
              </View>
            </View>
          )}
        </View>

        <Text style={[styles.companyName, { color: theme.colors.text }]}>
        TARGET BOARD GURUKUL 
        </Text>
        <Text style={[styles.descriptionText, { color: theme.colors.text }]}>
        किसी भी UPI APP से SCAN करके इस बैच के लिए पेमेंट कर सकते हैं
        </Text>

        <View style={styles.note}>
          <Text style={[styles.noteLabel, { color: theme.colors.text }]}>Note:</Text>
          <Text style={[styles.noteText, { color: theme.colors.textSecondary }]}>
            +91 82491 71935
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={[styles.btn, styles.downloadBtn, { backgroundColor: theme.colors.accent || '#9C27B0' }]}
          onPress={handleDownload}
          disabled={downloading}
        >
          {downloading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Download size={20} color="#fff" />
          )}
          <Text style={styles.btnText}>Download</Text>
        </TouchableOpacity>
      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    padding: getSpacing(1),
    paddingBottom: verticalScale(120),
    alignItems: 'center',
  },
  qrContainer: {
    marginBottom: getSpacing(2.5),
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: getSpacing(2),
  },
  qrCard: {
    borderRadius: moderateScale(16),
    padding: getSpacing(3),
    width: '100%',
    maxWidth: moderateScale(400),
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  brandingSection: {
    width: '100%',
    alignItems: 'center',
    marginBottom: getSpacing(2),
  },
  poweredByText: {
    fontSize: moderateScale(11),
    fontFamily: getFontFamily('400'),
    marginBottom: getSpacing(0.5),
  },
  razorpayText: {
    fontSize: moderateScale(18),
    fontFamily: getFontFamily('700'),
    marginBottom: getSpacing(1.5),
    letterSpacing: 0.5,
  },
  upiLogosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(1),
  },
  upiLogoText: {
    fontSize: moderateScale(10),
    fontFamily: getFontFamily('600'),
  },
  logoDivider: {
    width: 1,
    height: moderateScale(12),
    backgroundColor: '#E0E0E0',
    marginHorizontal: getSpacing(0.5),
  },
  qrImageContainer: {
    width: moderateScale(280),
    height: moderateScale(280),
    marginVertical: getSpacing(2),
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  scanPayText: {
    fontSize: moderateScale(13),
    fontFamily: getFontFamily('700'),
    marginTop: getSpacing(1),
    marginBottom: getSpacing(2),
    letterSpacing: 0.5,
  },
  upiAppsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: getSpacing(3),
    width: '100%',
  },
  upiAppName: {
    fontSize: moderateScale(12),
    fontFamily: getFontFamily('600'),
  },
  descriptionText: {
    fontSize: moderateScale(12),
    fontFamily: getFontFamily('600'),
    marginBottom: getSpacing(2),
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  retryText: {
    fontSize: moderateScale(16),
    fontFamily: getFontFamily('600'),
  },
  companyName: {
    fontSize: moderateScale(12),
    fontFamily: getFontFamily('600'),
    // marginBottom: getSpacing(2),
  },
  note: {
    maxWidth: 420,
  },
  noteLabel: {
    fontFamily: getFontFamily('700'),
    marginBottom: 6,
  },
  noteText: {
    lineHeight: 20,
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: getSpacing(2),
    gap: getSpacing(1.5),
  },
  btn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  downloadBtn: {
    // backgroundColor will be set dynamically from theme
  },
  btnText: {
    color: '#fff',
    fontFamily: getFontFamily('700'),
  },
});

export default QRCodePaymentScreen;
