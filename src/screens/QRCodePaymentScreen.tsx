import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { ArrowLeft, Download, Share2 } from 'lucide-react-native';
import { useTheme } from '../theme/theme';
import GradientBackground from '../components/GradientBackground';
import type { MainStackParamList } from '../navigation/MainStack';
import { createPaymentLink } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '../components/Toast';

type QRCodePaymentRouteProp = RouteProp<MainStackParamList, 'QRCodePayment'>;

const QRCodePaymentScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const route = useRoute<QRCodePaymentRouteProp>();
  const { courseId, packageId, originalPrice, currentPrice, discountCode } = route.params || {};
  const { top } = useSafeAreaInsets();
  const screenWidth = Dimensions.get('window').width;
  const toast = useToast();

  // Normalize and validate params - filter out empty strings
  const normalizedCourseId = courseId?.trim() || '';
  const normalizedPackageId = packageId?.trim() || undefined;
  const normalizedDiscountCode = discountCode?.trim() || undefined;

  // Validate required params - check for empty strings too
  if (!normalizedCourseId || normalizedCourseId === '') {
    return (
      <GradientBackground>
        <View style={[styles.header, { paddingTop: top + 10 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
            <ArrowLeft size={24} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
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
  // Only include packageId and discountCode in query key if they have valid values
  const { data: paymentLinkData, isLoading, error, refetch } = useQuery({
    queryKey: [
      'qrCodePaymentLink', 
      normalizedCourseId, 
      normalizedPackageId || null, 
      normalizedDiscountCode || null
    ],
    queryFn: async () => {
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

  const handleDownload = () => {
    // TODO: Implement QR code download functionality
    toast.show({ text: 'Download feature coming soon', type: 'info' });
  };

  const handleShare = () => {
    // TODO: Implement QR code share functionality
    if (qrImageUrl) {
      toast.show({ text: 'Share feature coming soon', type: 'info' });
    } else {
      toast.show({ text: 'QR code not available', type: 'error' });
    }
  };

  return (
    <GradientBackground>
      {/* Header */}
      <View style={[styles.header, { paddingTop: top + 10 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerButton}>
          <ArrowLeft size={24} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
     

   
       

        
                {/* Display QR code image directly from API response */}
                <Image
                  source={{ uri: qrImageUrl }}
                  style={styles.qrCodeImage}
                  resizeMode="contain"
                />
            
         
        

          {/* Instruction Text */}
         

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
          style={[styles.actionButton, styles.downloadButton, { backgroundColor: '#9C27B0' }]}
          onPress={handleDownload}
          activeOpacity={0.8}
        >
          <Download size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Download</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, styles.shareButton, { backgroundColor: theme.colors.accent }]}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <Share2 size={20} color="#FFFFFF" />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>
      </View>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoWrapper: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#001F3F',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    position: 'relative',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  logoCheckmark: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
  },
  appName: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  appTagline: {
    fontSize: 14,
    fontWeight: '500',
  },
  qrCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  upiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    width: '100%',
    justifyContent: 'center',
  },
  upiLogoContainer: {
    marginRight: 12,
  },
  bhimText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000000',
  },
  upiText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000000',
  },
  upiTextContainer: {
    alignItems: 'flex-start',
  },
  unifiedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#000000',
    lineHeight: 12,
  },
  qrCodeContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  qrCodePlaceholder: {
    width: 250,
    height: 250,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },

  qrCodeImage: {
    width: 850,
    height: 550,
    borderRadius: 12,
  },
  qrCodePlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9E9E9E',
    textAlign: 'center',
    marginBottom: 8,
  },
  qrCodeNote: {
    fontSize: 12,
    color: '#9E9E9E',
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#001F3F',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  instructionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#001F3F',
    textAlign: 'center',
    lineHeight: 18,
  },
  companyName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  noteContainer: {
    width: '100%',
    maxWidth: 400,
  },
  noteLabel: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  noteText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
  },
  downloadButton: {
    // Styles handled by backgroundColor
  },
  shareButton: {
    // Styles handled by backgroundColor
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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
    padding: 12,
    backgroundColor: '#001F3F',
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default QRCodePaymentScreen;

