import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import Modal from 'react-native-modal';
import { X } from 'lucide-react-native';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';
import { Stream } from '../../services/api';

interface PurchaseModalProps {
    visible: boolean;
    stream: Stream | null;
    onClose: () => void;
    onBuyNow: () => void;
}

const PurchaseModal: React.FC<PurchaseModalProps> = React.memo(({ visible, stream, onClose, onBuyNow }) => {
    const theme = useTheme();
    const { colors } = theme;

    if (!stream) return null;

    const streamWithSelections = stream as any;
    const course = streamWithSelections.courseSelections?.[0]?.course;
    const courseName = course?.name || stream.title || 'Course';
    const currentPrice = 499;
    const thumbnailUrl = stream.bannerUrl || stream.thumbnail;

    return (
        <Modal
            isVisible={visible}
            onBackdropPress={onClose}
            onBackButtonPress={onClose}
            style={styles.modalContainer}
            backdropOpacity={0.6}
            animationIn="fadeIn"
            animationOut="fadeOut"
            avoidKeyboard={true}
            useNativeDriverForBackdrop={true}
        >
            <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <X size={moderateScale(24)} color={colors.text} />
                    </TouchableOpacity>

                    <View style={styles.bannerContainer}>
                        {thumbnailUrl ? (
                            <Image
                                source={{ uri: thumbnailUrl }}
                                style={styles.bannerImage}
                                resizeMode="contain"
                            />
                        ) : (
                            <View style={[styles.bannerPlaceholder, { backgroundColor: colors.border }]} />
                        )}
                    </View>

                    <View style={styles.titleContainer}>
                        <Text style={[styles.title, { color: colors.text }]}>
                            {courseName} - {stream.title || 'Stream'}
                        </Text>
                    </View>

                    <View style={styles.priceRow}>
                        <Text style={[styles.price, { color: colors.text }]}>₹{currentPrice}</Text>
                        <TouchableOpacity style={styles.buyButton} onPress={onBuyNow} activeOpacity={0.8}>
                            <Text style={styles.buyButtonText}>Buy Now</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.pricingInfo}>
                        <View style={styles.pricingRow}>
                            <Text style={[styles.pricingText, { color: colors.textSecondary }]}>
                                ₹{currentPrice}/12 Month
                            </Text>
                        </View>
                    </View>
                </View>
            </ScrollView>
        </Modal>
    );
});

PurchaseModal.displayName = 'PurchaseModal';

const styles = StyleSheet.create({
    modalContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        margin: getSpacing(2),
        width: '100%',
    },
    scroll: {
        maxHeight: '90%',
    },
    scrollContent: {
        padding: getSpacing(2),
    },
    card: {
        borderRadius: moderateScale(16),
        overflow: 'hidden',
        maxWidth: '100%',
        width: '100%',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
    },
    closeButton: {
        position: 'absolute',
        top: getSpacing(2),
        right: getSpacing(2),
        zIndex: 10,
        width: moderateScale(36),
        height: moderateScale(36),
        borderRadius: moderateScale(18),
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
    },
    bannerContainer: {
        width: '100%',
        height: moderateScale(280),
        position: 'relative',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    bannerPlaceholder: {
        width: '100%',
        height: '100%',
    },
    titleContainer: {
        padding: getSpacing(2),
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    title: {
        fontSize: moderateScale(16),
        fontWeight: '700',
        lineHeight: moderateScale(22),
    },
    priceRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: getSpacing(2),
    },
    price: {
        fontSize: moderateScale(28),
        fontWeight: '700',
    },
    buyButton: {
        backgroundColor: '#001F3F',
        paddingHorizontal: getSpacing(4),
        paddingVertical: getSpacing(1.5),
        borderRadius: moderateScale(8),
        elevation: 2,
    },
    buyButtonText: {
        color: '#FFFFFF',
        fontSize: moderateScale(16),
        fontWeight: '700',
    },
    pricingInfo: {
        padding: getSpacing(2),
        paddingTop: 0,
    },
    pricingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: getSpacing(0.5),
        gap: getSpacing(0.5),
    },
    pricingText: {
        fontSize: moderateScale(12),
        fontWeight: '500',
    },
});

export default PurchaseModal;

