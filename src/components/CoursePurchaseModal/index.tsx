import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import Modal from 'react-native-modal';
import { useNavigation } from '@react-navigation/native';
import { X, Check } from 'lucide-react-native';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';

interface CoursePurchaseModalProps {
    visible: boolean;
    course: any;
    courseFeatures: any;
    originalPrice: number;
    currentPrice: number;
    selectedPackageId: string | null;
    isProcessingPayment: boolean;
    onClose: () => void;
    onPayment: () => void;
    onPackageSelect: (packageId: string) => void;
}

const CoursePurchaseModal: React.FC<CoursePurchaseModalProps> = React.memo(({
    visible,
    course,
    courseFeatures,
    originalPrice,
    currentPrice,
    selectedPackageId,
    isProcessingPayment,
    onClose,
    onPayment,
    onPackageSelect,
}) => {
    const theme = useTheme();
    const navigation = useNavigation<any>();

    if (!course) return null;

    const selectedPackage = course.packages?.find((pkg: any) => pkg._id === selectedPackageId);
    const displayPrice = selectedPackage?.price || currentPrice;

    return (
        <Modal
            isVisible={visible}
            onBackdropPress={onClose}
            onBackButtonPress={onClose}
            style={styles.modal}
            backdropOpacity={0.6}
            animationIn="fadeIn"
            animationOut="fadeOut"
            avoidKeyboard={true}
        >
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.card, { backgroundColor: theme.colors.cardBackground }]}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X size={moderateScale(24)} color={theme.colors.text} />
                    </TouchableOpacity>

                    {/* Banner Section */}
                    {course.courseImage || course.thumbnail || course.bannerUrl ? (
                        <View style={styles.bannerContainer}>
                            <Image
                                source={{ uri: course.courseImage || course.thumbnail || course.bannerUrl }}
                                style={styles.bannerImage}
                                resizeMode="contain"
                            />
                        </View>
                    ) : null}

                    {/* Course Title */}
                    <View style={styles.titleContainer}>
                        <Text style={[styles.title, { color: theme.colors.text }]}>
                            {course.name}
                        </Text>
                    </View>

                    {/* Package Selection */}
                    {course.packages && Array.isArray(course.packages) && course.packages.length > 1 && (
                        <View style={styles.packageContainer}>
                            <Text style={[styles.packageTitle, { color: theme.colors.text }]}>
                                Select Package
                            </Text>
                            {course.packages.map((pkg: any) => {
                                const isSelected = selectedPackageId === pkg._id;
                                return (
                                    <TouchableOpacity
                                        key={pkg._id}
                                        style={[
                                            styles.packageOption,
                                            {
                                                backgroundColor: isSelected ? theme.colors.accent + '20' : theme.colors.cardBackground,
                                                borderColor: isSelected ? theme.colors.accent : theme.colors.border,
                                            }
                                        ]}
                                        onPress={() => onPackageSelect(pkg._id)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.packageContent}>
                                            <View style={styles.packageLeft}>
                                                <Text style={[styles.packageDuration, { color: theme.colors.text }]}>
                                                    {pkg.durationInMonths} Months
                                                </Text>
                                                {pkg.isDefault && (
                                                    <View style={styles.defaultBadge}>
                                                        <Text style={styles.defaultText}>DEFAULT</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={[styles.packagePrice, { color: theme.colors.text }]}>
                                                ₹{pkg.price}
                                            </Text>
                                        </View>
                                        {isSelected && (
                                            <View style={[styles.checkmark, { backgroundColor: theme.colors.accent }]}>
                                                <Check size={16} color="#FFFFFF" strokeWidth={3} />
                                            </View>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )}

                    {/* Price and Buy Button */}
                    <View style={styles.priceRow}>
                        <View>
                            <Text style={[styles.price, { color: theme.colors.text }]}>
                                ₹{displayPrice}
                            </Text>
                            {selectedPackage?.durationInMonths && (
                                <Text style={[styles.priceSubtext, { color: theme.colors.textSecondary }]}>
                                    for {selectedPackage.durationInMonths} months
                                </Text>
                            )}
                        </View>
                        <TouchableOpacity
                            style={[
                                styles.buyButton,
                                isProcessingPayment && styles.buyButtonDisabled
                            ]}
                            onPress={() => {
                                onClose();
                                onPayment();
                            }}
                            activeOpacity={0.8}
                            disabled={isProcessingPayment}
                        >
                            {isProcessingPayment ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : (
                                <Text style={styles.buyButtonText}>Buy Now</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    {/* Pricing Info */}
                    <View style={styles.pricingInfo}>
                        <View style={styles.pricingRow}>
                            <Text style={styles.pricingIcon}>→</Text>
                            <Text style={[styles.pricingText, { color: theme.colors.textSecondary }]}>
                                ₹{currentPrice}/12 Month
                            </Text>
                        </View>
                        <View style={styles.pricingRow}>
                            <Text style={styles.pricingThumbs}>👍</Text>
                            <Text style={[styles.pricingText, { color: theme.colors.textSecondary }]}>
                                {course.class?.name || 'Class'} Fee - <Text style={styles.pricingStrike}>{originalPrice}</Text> {currentPrice}
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </Modal>
    );
});

CoursePurchaseModal.displayName = 'CoursePurchaseModal';

const styles = StyleSheet.create({
    modal: {
        margin: 0,
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
    },
    scroll: {
        flex: 1,
        width: '100%',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 16,
    },
    card: {
        width: '100%',
        maxWidth: 500,
        borderRadius: 16,
        overflow: 'hidden',
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },
    closeButton: {
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 10,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bannerContainer: {
        width: '100%',
        height: 220,
        position: 'relative',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    titleContainer: {
        padding: 16,
        paddingTop: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
    },
    packageContainer: {
        marginTop: 20,
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    packageTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
    },
    packageOption: {
        borderWidth: 2,
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        position: 'relative',
    },
    packageContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    packageLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    packageDuration: {
        fontSize: 16,
        fontWeight: '600',
    },
    defaultBadge: {
        backgroundColor: '#4CAF50',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 4,
    },
    defaultText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
    },
    packagePrice: {
        fontSize: 18,
        fontWeight: '700',
    },
    checkmark: {
        position: 'absolute',
        top: 12,
        right: 12,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    priceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingBottom: 12,
    },
    price: {
        fontSize: 28,
        fontWeight: '700',
    },
    priceSubtext: {
        fontSize: 12,
        marginTop: 4,
    },
    buyButton: {
        backgroundColor: '#001F3F',
        paddingHorizontal: 32,
        paddingVertical: 12,
        borderRadius: 6,
    },
    buyButtonDisabled: {
        opacity: 0.6,
    },
    buyButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    pricingInfo: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    pricingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    pricingIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    pricingThumbs: {
        fontSize: 16,
        marginRight: 8,
    },
    pricingText: {
        fontSize: 14,
    },
    pricingStrike: {
        textDecorationLine: 'line-through',
    },
});

export default CoursePurchaseModal;

