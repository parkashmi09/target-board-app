import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Animated,
  Linking,
  Modal,
  Dimensions,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Tag, ChevronDown, ChevronUp, QrCode, CreditCard, Phone, Play, X } from 'lucide-react-native';
import Video from 'react-native-video';
import { useTheme } from '../theme/theme';
import { fetchCourseDetails, createPurchaseOrder, verifyPurchasePayment, createPaymentLink } from '../services/api';
import { RAZORPAY_KEY_ID } from '../services/config';
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../components/Toast';
import { useGlobalLoaderManual } from '../components/GlobalLoader';
import { getSpacing, moderateScale, scale, verticalScale } from '../utils/responsive';
import PaymentResultModal from '../components/PaymentResultModal';
import ScreenHeader from '../components/ScreenHeader';
import GradientBackground from '../components/GradientBackground';
import CourseVideoPlayer from '../components/CourseVideoPlayer';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PaymentCheckoutScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { courseId, packageId, originalPrice, currentPrice } = route.params || {};
  const toast = useToast();
  const loader = useGlobalLoaderManual();
  const queryClient = useQueryClient();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPromoCode, setShowPromoCode] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [discountedPrice, setDiscountedPrice] = useState<number | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [fingerAnimation] = useState(new Animated.Value(0));
  const [showResultModal, setShowResultModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);
  const [savedMobileNumber, setSavedMobileNumber] = useState<string>('');

  // Load saved mobile number on mount
  useEffect(() => {
    const loadMobileNumber = async () => {
      try {
        // First, try to get from Razorpay saved contact
        const razorpayContact = await AsyncStorage.getItem('razorpayContact');
        if (razorpayContact) {
          setSavedMobileNumber(razorpayContact);
          return;
        }

        // If not found, try to get from userData
        const userDataStr = await AsyncStorage.getItem('userData');
        if (userDataStr) {
          try {
            const userData = JSON.parse(userDataStr);
            const mobile = userData.mobile || userData.phone || userData.contact || '';
            if (mobile) {
              // Clean the mobile number (remove any non-digits)
              const cleanedMobile = mobile.replace(/\D/g, '');
              if (cleanedMobile.length === 10 || cleanedMobile.length === 12) {
                // If it's 12 digits, it might have country code, use last 10
                const finalMobile = cleanedMobile.length === 12 ? cleanedMobile.slice(-10) : cleanedMobile;
                setSavedMobileNumber(finalMobile);
                // Also save it for Razorpay
                await AsyncStorage.setItem('razorpayContact', finalMobile);
              }
            }
          } catch (e) {
            if (__DEV__) {
              console.error('[Payment] Error parsing userData:', e);
            }
          }
        }
      } catch (error) {
        if (__DEV__) {
          console.error('[Payment] Error loading mobile number:', error);
        }
      }
    };

    loadMobileNumber();
  }, []);

  // Validate required params
  if (!courseId) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.errorText, { color: theme.colors.error || 'red' }]}>
          Missing course information
        </Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: theme.colors.text }]}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const backgroundColor = theme.isDark ? theme.colors.background : '#F5F5F5';
  const cardBackgroundColor = theme.isDark ? theme.colors.cardBackground : '#FFFFFF';
  const textColor = theme.colors.text;
  const secondaryTextColor = theme.colors.textSecondary;
  const borderColor = theme.isDark ? theme.colors.border : '#E0E0E0';
  const inputBackgroundColor = theme.isDark ? theme.colors.backgroundTertiary : '#F8F8F8';

  const { data: course, isLoading } = useQuery({
    queryKey: ['courseDetails', courseId],
    queryFn: () => fetchCourseDetails(courseId),
    enabled: !!courseId,
  });

  // Pre-fetch QR code payment link for faster navigation
  const { data: qrPaymentLinkData } = useQuery({
    queryKey: ['qrCodePaymentLink', courseId, packageId, appliedPromoCode || null],
    queryFn: async () => {
      try {
        const linkData = await createPaymentLink(
          courseId,
          packageId,
          appliedPromoCode || undefined
        );
        if (__DEV__) {
          console.log('[PaymentCheckout] QR payment link pre-fetched:', linkData);
        }
        return linkData;
      } catch (err) {
        if (__DEV__) {
          console.error('[PaymentCheckout] Error pre-fetching QR link:', err);
        }
        return null;
      }
    },
    enabled: !!courseId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  // Parse courseFeatures if it's a string
  const courseFeatures = useMemo(() => {
    if (!course?.courseFeatures) return {};
    try {
      return typeof course.courseFeatures === 'string'
        ? JSON.parse(course.courseFeatures)
        : course.courseFeatures;
    } catch (e) {
      return {};
    }
  }, [course?.courseFeatures]);

  // Get selected package from packages array
  const selectedPackage = useMemo(() => {
    if (!course?.packages || !Array.isArray(course.packages)) return null;
    
    // If packageId is provided, find that package
    if (packageId) {
      return course.packages.find((pkg: any) => pkg._id === packageId) || null;
    }
    
    // Otherwise, find default package or first package
    return course.packages.find((pkg: any) => pkg.isDefault === true) 
      || course.packages[0] 
      || null;
  }, [course?.packages, packageId]);

  // Get pricing from package or fallback to course data or route params
  const packagePrice = selectedPackage?.price || 0;
  const courseOriginalPrice = course?.strikeoutPrice || originalPrice || 0;
  const courseCurrentPrice = packagePrice > 0 ? packagePrice : (course?.coursePrice || currentPrice || 0);

  // Calculate discount
  const baseDiscount = courseOriginalPrice > courseCurrentPrice
    ? Math.round(((courseOriginalPrice - courseCurrentPrice) / courseOriginalPrice) * 100)
    : 0;

  // Use discounted price if promo code is applied, otherwise use courseCurrentPrice (from package)
  const finalPrice = discountedPrice !== null ? discountedPrice : courseCurrentPrice;
  const totalDiscount = courseOriginalPrice - finalPrice;
  const discount = courseOriginalPrice > finalPrice
    ? Math.round(((courseOriginalPrice - finalPrice) / courseOriginalPrice) * 100)
    : baseDiscount;

  // Apply promo code
  const handleApplyPromoCode = useCallback(async () => {
    if (!promoCode.trim()) {
      toast.show({ text: 'Please enter a promo code', type: 'error' });
      return;
    }

    if (!courseId) {
      toast.show({ text: 'Course information not available', type: 'error' });
      return;
    }

    setIsApplyingPromo(true);
    try {
      const testOrder = await createPurchaseOrder(courseId, packageId, promoCode.trim().toUpperCase());

      if (testOrder && testOrder.notes) {
        const originalAmount = testOrder.notes.originalAmount || courseCurrentPrice;
        const discountAmt = testOrder.notes.discountAmount || 0;
        const finalAmt = originalAmount - discountAmt;

        setAppliedPromoCode(promoCode.trim().toUpperCase());
        setDiscountedPrice(finalAmt);
        setDiscountAmount(discountAmt);
        toast.show({ text: 'Promo code applied successfully!', type: 'success' });
      } else {
        throw new Error('Invalid promo code');
      }
    } catch (error: any) {
      toast.show({
        text: error?.message || 'Invalid or expired promo code',
        type: 'error'
      });
      setAppliedPromoCode(null);
      setDiscountedPrice(null);
      setDiscountAmount(0);
    } finally {
      setIsApplyingPromo(false);
    }
  }, [promoCode, courseId, packageId, courseCurrentPrice, toast]);

  // Remove promo code
  const handleRemovePromoCode = useCallback(() => {
    setAppliedPromoCode(null);
    setDiscountedPrice(null);
    setDiscountAmount(0);
    setPromoCode('');
    toast.show({ text: 'Promo code removed', type: 'info' });
  }, [toast]);

  const handleRazorpayPayment = useCallback(async () => {
    if (!course || !courseId) {
      toast.show({ text: 'Course information not available', type: 'error' });
      return;
    }

    if (isProcessingPayment) return;

    setIsProcessingPayment(true);
    loader.show();

    try {
      const order = await createPurchaseOrder(courseId, packageId, appliedPromoCode || undefined);

      if (!order || !order.id) {
        throw new Error('Failed to create order');
      }

      if (__DEV__) {
        console.log('[Payment] Order created:', order);
      }

      // Get user data for name and email
      let userName = '';
      let userEmail = '';
      try {
        const userDataStr = await AsyncStorage.getItem('userData');
        if (userDataStr) {
          const userData = JSON.parse(userDataStr);
          userName = userData.name || userData.fullName || '';
          userEmail = userData.email || '';
        }
      } catch (e) {
        if (__DEV__) {
          console.error('[Payment] Error getting user data:', e);
        }
      }

      // Use saved mobile number or get from userData
      let contactNumber = savedMobileNumber;
      if (!contactNumber) {
        try {
          const userDataStr = await AsyncStorage.getItem('userData');
          if (userDataStr) {
            const userData = JSON.parse(userDataStr);
            const mobile = userData.mobile || userData.phone || userData.contact || '';
            if (mobile) {
              const cleanedMobile = mobile.replace(/\D/g, '');
              contactNumber = cleanedMobile.length === 12 ? cleanedMobile.slice(-10) : cleanedMobile;
            }
          }
        } catch (e) {
          // Silent error
        }
      }

      const options = {
        description: course.name || 'Course Purchase',
        image: course.courseImage || course.thumbnail || '',
        currency: order.currency || 'INR',
        key: RAZORPAY_KEY_ID,
        amount: order.amount,
        name: 'Target Board',
        order_id: order.id,
        prefill: {
          email: userEmail,
          contact: contactNumber || '',
          name: userName,
        },
        theme: { color: '#001F3F' },
      };

      let paymentData;
      try {
        paymentData = await RazorpayCheckout.open(options);
      } catch (razorpayError: any) {
        // Handle case where native module isn't linked
        if (razorpayError?.message?.includes('null') || razorpayError?.message?.includes('undefined') || !RazorpayCheckout) {
          throw new Error('Razorpay native module not linked. Please rebuild the app after installing react-native-razorpay.');
        }
        throw razorpayError;
      }

      if (__DEV__) {
        console.log('[Payment] Payment data:', paymentData);
      }

      if (paymentData.razorpay_payment_id && paymentData.razorpay_signature) {
        // Save mobile number from payment response if available
        // Razorpay may return contact in paymentData
        if (paymentData.contact || paymentData.razorpay_contact) {
          const contact = paymentData.contact || paymentData.razorpay_contact || '';
          const cleanedContact = contact.replace(/\D/g, '');
          if (cleanedContact.length >= 10) {
            const finalContact = cleanedContact.length === 12 ? cleanedContact.slice(-10) : cleanedContact.slice(-10);
            await AsyncStorage.setItem('razorpayContact', finalContact);
            setSavedMobileNumber(finalContact);
            if (__DEV__) {
              console.log('[Payment] Saved mobile number from Razorpay:', finalContact);
            }
          }
        }

        await verifyPurchasePayment(
          order.id,
          paymentData.razorpay_payment_id,
          paymentData.razorpay_signature
        );

        queryClient.invalidateQueries({ queryKey: ['courseDetails', courseId] });
        queryClient.invalidateQueries({ queryKey: ['userCourses'] });

        setPaymentResult({
          type: 'success',
          title: 'Payment Successful!',
          message: 'Your course has been purchased successfully. You can now access all course content.',
        });
        setShowResultModal(true);
      } else {
        throw new Error('Payment data incomplete');
      }
    } catch (error: any) {
      if (__DEV__) {
        console.error('[Payment] Error:', error);
      }

      let errorTitle = 'Payment Failed';
      let errorMessage = 'Payment failed. Please try again.';

      if (error?.code === 'BAD_REQUEST_ERROR' || error?.code === 'NETWORK_ERROR') {
        errorTitle = 'Payment Cancelled';
        errorMessage = 'Payment was cancelled or failed. Please try again.';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      setPaymentResult({
        type: 'error',
        title: errorTitle,
        message: errorMessage,
      });
      setShowResultModal(true);
    } finally {
      setIsProcessingPayment(false);
      loader.hide();
    }
    }, [course, courseId, packageId, appliedPromoCode, isProcessingPayment, toast, loader, queryClient, navigation, savedMobileNumber]);

  const handleScanPay = useCallback(() => {
    // Navigate to QR code payment screen with pre-fetched data
    (navigation as any).navigate('QRCodePayment', {
      courseId,
      packageId,
      originalPrice: courseOriginalPrice,
      currentPrice: finalPrice,
      discountCode: appliedPromoCode || undefined,
      preFetchedQrData: qrPaymentLinkData || undefined, // Pass pre-fetched data
    });
  }, [navigation, courseId, packageId, courseOriginalPrice, finalPrice, appliedPromoCode, qrPaymentLinkData]);

  // Handle phone call
  const handlePhoneCall = useCallback(async () => {
    const phoneNumber = '+918929752338';
    const url = `tel:${phoneNumber}`;
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        toast.show({ text: 'Cannot make phone call', type: 'error' });
      }
    } catch (error) {
      toast.show({ text: 'Failed to make phone call', type: 'error' });
    }
  }, [toast]);

  // Check if URL is YouTube
  const isYouTubeUrl = useCallback((url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  }, []);

  // Animate finger icon
  React.useEffect(() => {
    const animateFinger = () => {
      Animated.sequence([
        Animated.timing(fingerAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(fingerAnimation, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setTimeout(animateFinger, 1000);
      });
    };
    animateFinger();
  }, [fingerAnimation]);

  const fingerTranslateX = fingerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 8],
  });

  if (isLoading) {
    return (
      <GradientBackground>
        <ScreenHeader title="Payment Details" showSearch={false} />
        <View style={[styles.loadingContainer]}>
          <ActivityIndicator size="large" color={textColor} />
        </View>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      {/* Header */}
      <ScreenHeader title="Payment Details" showSearch={false} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Course Details Card */}
        <View style={[styles.courseCard, { backgroundColor: cardBackgroundColor }]}>
          {/* Dotted Top Border */}
          <View style={[styles.dottedBorder, { borderColor: theme.isDark ? '#444' : '#D0D0D0' }]} />

          {/* Prominent Price Display */}
          <View style={styles.mainPriceContainer}>
            <Text style={[styles.mainPrice, { color: textColor }]}>₹{finalPrice}</Text>
            {appliedPromoCode && (
              <View style={styles.promoAppliedContainer}>
                <Text style={[styles.promoAppliedText, { color: '#10B981' }]}>
                  Promo {appliedPromoCode} applied! Saved ₹{discountAmount}
                </Text>
              </View>
            )}
          </View>

          {/* Course Name */}
          <Text style={[styles.courseName, { color: textColor }]}>
            {course?.name || 'Course'}
          </Text>

          {/* Details Section */}
          <View style={styles.detailsSection}>
            {appliedPromoCode && discountAmount > 0 && (
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: '#10B981' }]}>Promo Discount ({appliedPromoCode})</Text>
                <Text style={[styles.detailValue, { color: '#10B981' }]}>-₹{discountAmount}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: '#10B981' }]}>Total Discount</Text>
              <Text style={[styles.detailValue, { color: '#10B981' }]}>-₹{totalDiscount}</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: secondaryTextColor }]}>Currency</Text>
              <Text style={[styles.detailValueDark, { color: textColor }]}>INR</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: secondaryTextColor }]}>GST</Text>
              <Text style={[styles.detailValueDark, { color: textColor }]}>Included</Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: secondaryTextColor }]}>Savings</Text>
              <Text style={[styles.detailValueDark, { color: textColor }]}>₹{totalDiscount}</Text>
            </View>
          </View>
        </View>

        {/* Promo Code Section */}
        <TouchableOpacity
          style={[styles.promoCodeButton, { backgroundColor: cardBackgroundColor }]}
          onPress={() => setShowPromoCode(!showPromoCode)}
          activeOpacity={0.7}
        >
          <View style={styles.promoCodeContent}>
            <View style={[styles.promoCodeIcon, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : '#1e293b20' }]}>
              <Tag size={20} color={theme.isDark ? '#FFF' : '#1e293b'} />
            </View>
            <Text style={[styles.promoCodeText, { color: textColor }]}>Have a promo code?</Text>
            {showPromoCode ? (
              <ChevronUp size={20} color={secondaryTextColor} />
            ) : (
              <ChevronDown size={20} color={secondaryTextColor} />
            )}
          </View>
        </TouchableOpacity>

        {/* Promo Code Input */}
        {showPromoCode && (
          <View style={[styles.promoCodeInputContainer, { backgroundColor: cardBackgroundColor }]}>
            <TextInput
              style={[
                styles.promoCodeInput,
                {
                  backgroundColor: inputBackgroundColor,
                  borderColor: borderColor,
                  color: textColor
                }
              ]}
              placeholder="Enter promo code"
              placeholderTextColor={theme.isDark ? '#888' : '#999'}
              value={promoCode}
              onChangeText={setPromoCode}
              autoCapitalize="characters"
              editable={!appliedPromoCode}
            />
            {appliedPromoCode ? (
              <TouchableOpacity
                style={styles.removePromoButton}
                onPress={handleRemovePromoCode}
                activeOpacity={0.8}
              >
                <Text style={styles.removePromoText}>Remove</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.applyButton,
                  {
                    backgroundColor: theme.isDark ? '#333' : '#1e293b',
                    opacity: isApplyingPromo ? 0.6 : 1
                  }
                ]}
                onPress={handleApplyPromoCode}
                disabled={isApplyingPromo}
                activeOpacity={0.8}
              >
                {isApplyingPromo ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.applyButtonText}>Apply</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Popular Payment Methods */}
        <Text style={[styles.sectionTitle, { color: textColor }]}>
          Popular Payment Methods
        </Text>
        <View style={styles.paymentOptionsContainer}>
          {/* Razorpay Option */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              {
                backgroundColor: cardBackgroundColor,
                borderColor: selectedPaymentMethod === 'razorpay' ? (theme.isDark ? '#FFF' : '#1e293b') : borderColor,
                borderWidth: selectedPaymentMethod === 'razorpay' ? 2 : 1,
              }
            ]}
            onPress={handleRazorpayPayment}
            activeOpacity={0.7}
          >
            <View style={styles.paymentOptionContent}>
              <View style={[styles.paymentIcon, { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : '#1e293b20' }]}>
                <CreditCard size={24} color={theme.isDark ? '#FFF' : '#1e293b'} />
              </View>
              <View style={styles.paymentTextContainer}>
                <Text style={[styles.paymentTitle, { color: textColor }]}>Pay Online</Text>
                <Text style={styles.paymentSubtitle}>
                  PhonePe, Google Pay etc
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Scan & Pay Option */}
          <TouchableOpacity
            style={[
              styles.paymentOption,
              {
                backgroundColor: cardBackgroundColor,
                borderColor: selectedPaymentMethod === 'scanpay' ? (theme.isDark ? '#FFF' : '#1e293b') : borderColor,
                borderWidth: selectedPaymentMethod === 'scanpay' ? 2 : 1,
              }
            ]}
            onPress={handleScanPay}
            activeOpacity={0.7}
          >
            <View style={styles.paymentOptionContent}>
              <View style={[styles.paymentIcon, { backgroundColor: '#10B981' + '20' }]}>
                <QrCode size={24} color="#10B981" />
              </View>
              <View style={styles.paymentTextContainer}>
                <Text style={[styles.paymentTitle, { color: textColor }]}>Scan & Pay</Text>
                <Text style={styles.paymentSubtitle}>
                  Scan QR Code and get instant batch access
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        <View style={{ paddingBottom: getSpacing(12) }}>
          {/* Need Help Section */}
        <Text style={[styles.sectionTitle, { color: textColor}]}>
          Need Help?
        </Text>
        <View style={[styles.helpSection, { backgroundColor: cardBackgroundColor }]}>
          <View style={styles.helpContent}>
            {/* Video Thumbnail */}
            <TouchableOpacity
              style={styles.videoThumbnail}
              onPress={() => setShowVideoModal(true)}
              activeOpacity={0.8}
            >
              <View style={styles.videoThumbnailOverlay}>
                <View style={styles.playButton}>
                  <Play size={24} color="#FFFFFF" fill="#FFFFFF" />
                </View>
              </View>
              <Text style={styles.videoTitle}>PAYMENT कैसे करें?</Text>
            </TouchableOpacity>

            {/* Help Text */}
            <View style={styles.helpTextContainer}>
              <Text style={[styles.helpText, { color: textColor }]}>
                Admission लेने के लिए वीडियो देखें ।
              </Text>
              <Text style={[styles.helpText, { color: textColor, marginTop: getSpacing(1) }]}>
                नीचे दिए नंबर पर कॉल करें और हमारी टीम से बात करके अभी Admission लें।
              </Text>
              <TouchableOpacity
                style={styles.callButton}
                onPress={handlePhoneCall}
                activeOpacity={0.8}
              >
                <Phone size={16} color="#FFFFFF" />
                <Text style={styles.callButtonText}>   +91 1234567890</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        </View>
      </ScrollView>

      {/* Video Modal */}
      <Modal
        visible={showVideoModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowVideoModal(false)}
      >
        <View style={styles.videoModalContainer}>
          <View style={styles.videoModalHeader}>
            <Text style={styles.videoModalTitle}>PAYMENT कैसे करें?</Text>
            <TouchableOpacity
              onPress={() => setShowVideoModal(false)}
              style={styles.closeButton}
            >
              <X size={24} color={textColor} />
            </TouchableOpacity>
          </View>
          {course?.introVideoLink && (
            isYouTubeUrl(course.introVideoLink) ? (
              <CourseVideoPlayer videoUrl={course.introVideoLink} />
            ) : (
              <Video
                source={{ uri: course.introVideoLink }}
                style={styles.videoPlayer}
                controls={true}
                resizeMode="contain"
                paused={false}
              />
            )
          )}
        </View>
      </Modal>

      {/* Bottom Bar */}
      <View style={[
        styles.bottomBar,
        {
          backgroundColor: cardBackgroundColor,
          borderTopColor: borderColor
        }
      ]}>
        <View style={styles.bottomBarContent}>
          {/* Price Section */}
          <View style={styles.priceSection}>
            <View style={styles.priceRow}>
              <Text style={[styles.bottomPrice, { color: textColor }]}>₹{finalPrice}</Text>
              {discount > 0 && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountBadgeText}>{discount}% OFF</Text>
                </View>
              )}
            </View>
          </View>

          {/* Pay Now Button */}
          <TouchableOpacity
            style={styles.payNowButton}
            onPress={handleRazorpayPayment}
            disabled={isProcessingPayment}
            activeOpacity={0.8}
          >
            {isProcessingPayment ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <View style={styles.payNowButtonContent}>
                <Animated.View
                  style={{
                    transform: [{ translateX: fingerTranslateX }],
                  }}
                >
                  <Text style={styles.fingerIcon}>👉</Text>
                </Animated.View>
                <Text style={styles.payNowText}>Pay now</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Payment Result Modal */}
      {paymentResult && (
        <PaymentResultModal
          visible={showResultModal}
          type={paymentResult.type}
          title={paymentResult.title}
          message={paymentResult.message}
          onClose={() => {
            setShowResultModal(false);
            if (paymentResult.type === 'success') {
              setTimeout(() => {
                navigation.goBack();
              }, 300);
            }
          }}
        />
      )}
</GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingBottom: getSpacing(12),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#F5F5F5',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerButton: {
    padding: 8,
    width: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000',
    flex: 1,
    textAlign: 'center',
  },
  paymentOptionsContainer: {
    paddingBottom: getSpacing(4),
    flexDirection: 'row',
    gap: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: getSpacing(2),
    paddingBottom: getSpacing(10),
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    padding: getSpacing(2.5),
    marginBottom: getSpacing(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  dottedBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#D0D0D0',
  },
  mainPriceContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  mainPrice: {
    fontSize: moderateScale(36),
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#000',
  },
  courseName: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginBottom: getSpacing(2.5),
    textAlign: 'center',
    color: '#000',
  },
  detailsSection: {
    gap: getSpacing(1.5),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: moderateScale(14),
    fontWeight: '500',
    color: '#666',
  },
  detailValue: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#666',
  },
  detailValueDark: {
    fontSize: moderateScale(14),
    fontWeight: '600',
    color: '#000',
  },
  promoCodeButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    padding: getSpacing(2),
    marginBottom: getSpacing(1.5),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  promoCodeContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoCodeIcon: {
    width: moderateScale(32),
    height: moderateScale(32),
    borderRadius: moderateScale(16),
    backgroundColor: '#1e293b20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: getSpacing(1.5),
  },
  promoCodeText: {
    flex: 1,
    fontSize: moderateScale(16),
    fontWeight: '500',
    color: '#000',
  },
  promoCodeInputContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    flexDirection: 'row',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  promoCodeInput: {
    flex: 1,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000',
  },
  applyButton: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  removePromoButton: {
    marginLeft: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePromoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  promoAppliedContainer: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#10B98120',
  },
  promoAppliedText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: moderateScale(16),
    fontWeight: '700',
    marginBottom: getSpacing(1.5),
    color: '#000',
  },
  paymentOption: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    padding: getSpacing(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  paymentOptionContent: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  paymentIcon: {
    width: moderateScale(48),
    height: moderateScale(48),
    borderRadius: moderateScale(24),
    backgroundColor: '#1e293b20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: getSpacing(1.5),
  },
  paymentTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  paymentTitle: {
    fontSize: moderateScale(16),
    fontWeight: '600',
    marginBottom: getSpacing(0.5),
    color: '#000',
    textAlign: 'center',
  },
  paymentSubtitle: {
    fontSize: moderateScale(12),
    color: '#666',
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: getSpacing(2),
    paddingVertical: getSpacing(2),
    paddingBottom: verticalScale(20),
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomBarContent: {
    width: '100%',
  },
  priceSection: {
    marginBottom: getSpacing(1.5),
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(1),
  },
  bottomPrice: {
    fontSize: moderateScale(24),
    fontWeight: '700',
    color: '#1e293b',
  },
  discountBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: getSpacing(1),
    paddingVertical: getSpacing(0.5),
    borderRadius: moderateScale(4),
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: moderateScale(10),
    fontWeight: '700',
  },
  payNowButton: {
    width: '100%',
    backgroundColor: '#FFE55C',
    paddingVertical: verticalScale(14),
    borderRadius: moderateScale(8),
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  payNowButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: getSpacing(1),
  },
  payNowText: {
    color: '#000',
    fontSize: moderateScale(16),
    fontWeight: '700',
  },
  fingerIcon: {
    fontSize: moderateScale(20),
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
    fontSize: moderateScale(16),
    fontWeight: '600',
  },
  helpSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: moderateScale(12),
    padding: getSpacing(2),
    marginBottom: getSpacing(2),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  helpContent: {
    flexDirection: 'row',
    gap: getSpacing(2),
  },
  videoThumbnail: {
    width: scale(120),
    height: verticalScale(90),
    backgroundColor: '#000',
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  videoThumbnailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(20),
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoTitle: {
    position: 'absolute',
    bottom: getSpacing(1),
    left: getSpacing(1),
    right: getSpacing(1),
    fontSize: moderateScale(10),
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  helpTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  helpText: {
    fontSize: moderateScale(13),
    lineHeight: moderateScale(18),
    color: '#000',
  },
  callButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: getSpacing(2),
    paddingVertical: getSpacing(1),
    borderRadius: moderateScale(8),
    marginTop: getSpacing(1.5),
    gap: getSpacing(1),
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: moderateScale(14),
    fontWeight: '600',
  },
  videoModalContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getSpacing(2),
    paddingVertical: getSpacing(2),
    backgroundColor: '#1a1a1a',
    paddingTop: getSpacing(3),
  },
  videoModalTitle: {
    fontSize: moderateScale(18),
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  closeButton: {
    padding: getSpacing(1),
  },
  videoPlayer: {
    flex: 1,
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.6,
  },
});

export default PaymentCheckoutScreen;

