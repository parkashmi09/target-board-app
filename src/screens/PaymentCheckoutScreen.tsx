import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ArrowLeft, X, Tag, ChevronDown, ChevronUp, QrCode, CreditCard } from 'lucide-react-native';
import { useTheme } from '../theme/theme';
import { fetchCourseDetails, createPurchaseOrder, verifyPurchasePayment } from '../services/api';
import { RAZORPAY_KEY_ID } from '../services/config';
// @ts-ignore
import RazorpayCheckout from 'react-native-razorpay';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useToast } from '../components/Toast';
import { useGlobalLoaderManual } from '../components/GlobalLoader';
import { getSpacing } from '../utils/responsive';
import PaymentResultModal from '../components/PaymentResultModal';

const PaymentCheckoutScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { courseId, packageId, originalPrice, currentPrice } = route.params || {};
  const { top } = useSafeAreaInsets();
  const toast = useToast();
  const loader = useGlobalLoaderManual();
  const queryClient = useQueryClient();

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'razorpay' | 'scanpay'>('razorpay');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPromoCode, setShowPromoCode] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(null);
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [discountedPrice, setDiscountedPrice] = useState<number | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [fingerAnimation] = useState(new Animated.Value(0));
  const [showResultModal, setShowResultModal] = useState(false);
  const [paymentResult, setPaymentResult] = useState<{
    type: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);

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

  // Calculate discount
  const baseDiscount = originalPrice > currentPrice
    ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
    : 0;

  // Use discounted price if promo code is applied, otherwise use currentPrice
  const finalPrice = discountedPrice !== null ? discountedPrice : currentPrice;
  const totalDiscount = originalPrice - finalPrice;
  const discount = originalPrice > finalPrice
    ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
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
        const originalAmount = testOrder.notes.originalAmount || currentPrice;
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
  }, [promoCode, courseId, packageId, currentPrice, toast]);

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

      const options = {
        description: course.name || 'Course Purchase',
        image: course.courseImage || course.thumbnail || '',
        currency: order.currency || 'INR',
        key: RAZORPAY_KEY_ID,
        amount: order.amount,
        name: 'Target Board',
        order_id: order.id,
        prefill: {
          email: '',
          contact: '',
          name: '',
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
  }, [course, courseId, packageId, appliedPromoCode, isProcessingPayment, toast, loader, queryClient, navigation]);

  const handleScanPay = useCallback(() => {
    // Navigate to QR code payment screen
    (navigation as any).navigate('QRCodePayment', {
      courseId,
      packageId,
      originalPrice,
      currentPrice: finalPrice,
      discountCode: appliedPromoCode || undefined,
    });
  }, [navigation, courseId, packageId, originalPrice, finalPrice, appliedPromoCode]);

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
      <View style={[styles.container, { backgroundColor }]}>
        <View style={[styles.loadingContainer, { paddingTop: top + 20 }]}>
          <ActivityIndicator size="large" color={textColor} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor }]}>
      {/* Header */}
      <View style={[
        styles.header,
        {
          paddingTop: top + 12,
          backgroundColor: backgroundColor,
          borderBottomColor: borderColor
        }
      ]}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={textColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Payment Details</Text>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <X size={24} color={textColor} />
        </TouchableOpacity>
      </View>

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
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: secondaryTextColor }]}>Original Price</Text>
              <Text style={[styles.detailValue, { color: secondaryTextColor }]}>₹{originalPrice}</Text>
            </View>

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
      </ScrollView>

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
              <Text style={[styles.bottomOriginalPrice, { color: secondaryTextColor }]}>₹{originalPrice}</Text>
              <View style={styles.discountBadge}>
                <Text style={styles.discountBadgeText}>{discount}% OFF</Text>
              </View>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
    paddingBottom: getSpacing(12),
    flexDirection: 'row',
    gap: 12,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: getSpacing(10),
  },
  courseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
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
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#000',
  },
  courseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
    color: '#000',
  },
  detailsSection: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  detailValueDark: {
    fontSize: 14,
    fontWeight: '600',
    color: '#000',
  },
  promoCodeButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#1e293b20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  promoCodeText: {
    flex: 1,
    fontSize: 16,
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
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    color: '#000',
  },
  paymentOption: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
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
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1e293b20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  paymentTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  paymentTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: '#000',
    textAlign: 'center',
  },
  paymentSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom: 20,
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
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bottomPrice: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  bottomOriginalPrice: {
    fontSize: 14,
    textDecorationLine: 'line-through',
    color: '#666',
  },
  discountBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  payNowButton: {
    width: '100%',
    backgroundColor: '#FFE55C',
    paddingVertical: 14,
    borderRadius: 8,
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
    gap: 8,
  },
  payNowText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '700',
  },
  fingerIcon: {
    fontSize: 20,
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

export default PaymentCheckoutScreen;

