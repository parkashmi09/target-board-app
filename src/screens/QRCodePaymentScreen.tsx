import React, { useState, useEffect, useMemo } from 'react';
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
  PermissionsAndroid,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { Download, Share2 } from 'lucide-react-native';
import { useTheme } from '../theme/theme';
import {
  moderateScale,
  getSpacing,
  verticalScale,
} from '../utils/responsive';
import GradientBackground from '../components/GradientBackground';
import ScreenHeader from '../components/ScreenHeader';
import type { MainStackParamList } from '../navigation/MainStack';
import { createPaymentLink } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '../components/Toast';
import ReactNativeBlobUtil from 'react-native-blob-util';

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
    if (!qrImageUrl || sharing) {
      if (!qrImageUrl) {
        toast.show({ text: 'QR code not available', type: 'error' });
      }
      return;
    }

    const batchName =
      paymentLinkData?.batchName ||
      paymentLinkData?.courseName ||
      'इस';

    const shareText =
      `हमें ${batchName} बैच में जुड़ना है।\n` +
      `इसके लिए इस QR Code को scan करके पेमेंट कर दीजिए।`;

    try {
      setSharing(true);

      // First, download the image to a temporary location
      const { dirs } = ReactNativeBlobUtil.fs;
      const tempFileName = `QRCode_Share_${Date.now()}.png`;
      const tempPath = `${dirs.CacheDir}/${tempFileName}`;

      // Download the image to cache
      const response = await ReactNativeBlobUtil.config({
        fileCache: true,
        path: tempPath,
      }).fetch('GET', qrImageUrl);

      const imagePath = response.path();

      // Share the image file with text
      // For both iOS and Android, use the file path format
      const fileUri = Platform.OS === 'ios' 
        ? `file://${imagePath}` 
        : `file://${imagePath}`;

      // Share with image file
      const shareOptions: any = {
        message: shareText,
        title: 'QR Code Payment',
      };

      // Add URL for sharing the image file
      if (Platform.OS === 'android') {
        shareOptions.url = fileUri;
      } else {
        shareOptions.url = fileUri;
      }

      await Share.share(shareOptions);
      toast.show({ text: 'QR code shared successfully', type: 'success' });
    } catch (error: any) {
      console.error('Share error:', error);
      
      // Fallback to sharing URL if file share fails
      try {
        await Share.share({
          message: shareText + '\n\n' + qrImageUrl,
          title: 'QR Code Payment',
        });
        toast.show({ text: 'QR code shared successfully', type: 'success' });
      } catch (fallbackError) {
        toast.show({ text: 'Failed to share QR code', type: 'error' });
      }
    } finally {
      setSharing(false);
    }
  };

  return (
    <GradientBackground>
      <ScreenHeader title="QR Code Payment" showSearch={false} />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.qrContainer}>
          {isLoading || !qrImageUrl ? (
            <ActivityIndicator size="large" />
          ) : imageError ? (
            <TouchableOpacity onPress={() => refetch()}>
              <Text>Retry</Text>
            </TouchableOpacity>
          ) : (
            <View style={[styles.qrWrapper, { width: qrWidth, height: qrHeight }]}>
              {imageLoading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" />
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
          )}
        </View>

        <Text style={styles.companyName}>
          TARGET BOARD LEARNING SPACE PVT. LTD.
        </Text>

        <View style={styles.note}>
          <Text style={styles.noteLabel}>Note:</Text>
          <Text style={styles.noteText}>
            आप किसी भी फ़ोन से QR Code स्कैन करके फीस भर सकते हैं, आपको तुरंत बैच
            का Access मिल जायेगा
          </Text>
        </View>
      </ScrollView>

      <View style={styles.bottomButtons}>
        <TouchableOpacity
          style={[styles.btn, styles.downloadBtn]}
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

        <TouchableOpacity
          style={[styles.btn, styles.shareBtn]}
          onPress={handleShare}
          disabled={sharing}
        >
          {sharing ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Share2 size={20} color="#fff" />
          )}
          <Text style={styles.btnText}>Share</Text>
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
  },
  qrWrapper: {
    borderRadius: moderateScale(12),
    overflow: 'hidden',
  },
  qrImage: {
    width: '100%',
    height: '100%',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
  },
  companyName: {
    fontSize: moderateScale(12),
    fontWeight: '600',
    marginBottom: getSpacing(2),
  },
  note: {
    maxWidth: 420,
  },
  noteLabel: {
    fontWeight: '700',
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
    backgroundColor: '#9C27B0',
  },
  shareBtn: {
    backgroundColor: '#FFC107',
  },
  btnText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default QRCodePaymentScreen;
