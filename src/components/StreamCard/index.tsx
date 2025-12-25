import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { moderateScale, getSpacing } from '../../utils/responsive';
import { Stream } from '../../services/api';
import { useTheme } from '../../theme/theme';

interface StreamCardProps {
    item: Stream;
    onPress: (stream: Stream) => void;
    getStreamStatus: (stream: Stream) => { label: string; color: string; bgColor: string };
    getCountdown: (startTime?: string) => string;
}

const StreamCard: React.FC<StreamCardProps> = React.memo(({ item, onPress, getStreamStatus, getCountdown }) => {
    const theme = useTheme();
    const statusInfo = getStreamStatus(item);
    const isUpcoming = statusInfo.label === 'UPCOMING';
    const thumbnailUrl = item.bannerUrl || item.thumbnail;
    const screenWidth = Dimensions.get('window').width;
    const sidePadding = getSpacing(2);
    const cardWidth = screenWidth - (sidePadding * 2);
    const bannerHeight = cardWidth * (9 / 16);
    const [countdown, setCountdown] = useState('');

    const updateCountdown = useCallback(() => {
        if (item.startTime) {
            setCountdown(getCountdown(item.startTime));
        }
    }, [item.startTime, getCountdown]);

    useEffect(() => {
        if (isUpcoming && item.startTime) {
            updateCountdown();
            const interval = setInterval(updateCountdown, 5000);
            return () => clearInterval(interval);
        } else {
            setCountdown('');
        }
    }, [isUpcoming, item.startTime, updateCountdown]);

    const handlePress = useCallback(() => {
        if (item && onPress) {
            onPress(item);
        }
    }, [item, onPress]);

    if (!item || !item._id) {
        return null;
    }

    return (
        <TouchableOpacity
            style={[
                styles.card,
                {
                    backgroundColor: theme.colors.cardBackground,
                    borderWidth: theme.isDark ? 1 : 0,
                    borderColor: theme.isDark ? '#FFFFFF' : 'transparent'
                }
            ]}
            onPress={handlePress}
            activeOpacity={0.8}
        >
            <View style={[styles.bannerContainer, { height: bannerHeight }]}>
                {thumbnailUrl ? (
                    <Image
                        source={{ uri: thumbnailUrl }}
                        style={styles.bannerImage}
                        resizeMode="cover"
                    />
                ) : (
                    <View style={[styles.bannerPlaceholder, { backgroundColor: theme.colors.border }]} />
                )}
                <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
                    <Text style={styles.statusBadgeText}>{statusInfo.label}</Text>
                </View>
            </View>
            <View style={[styles.titleContainer, { backgroundColor: theme.colors.cardBackground }]}>
                <Text style={[styles.title, { color: theme.colors.text }]} numberOfLines={2}>
                    {item.title || 'Untitled Stream'}
                </Text>
                {isUpcoming && countdown && (
                    <Text style={[styles.countdown, { color: theme.colors.textSecondary }]}>Starts in: {countdown}</Text>
                )}
            </View>
        </TouchableOpacity>
    );
}, (prevProps, nextProps) => {
    // Custom comparison for memoization
    return (
        prevProps.item._id === nextProps.item._id &&
        prevProps.item.title === nextProps.item.title &&
        prevProps.item.bannerUrl === nextProps.item.bannerUrl &&
        prevProps.item.status === nextProps.item.status &&
        prevProps.item.tpStatus === nextProps.item.tpStatus &&
        prevProps.item.startTime === nextProps.item.startTime
    );
});

StreamCard.displayName = 'StreamCard';

const styles = StyleSheet.create({
    card: {
        borderRadius: moderateScale(16),
        marginBottom: getSpacing(2),
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.8,
        shadowRadius: 8,
        width: '100%',
    },
    bannerContainer: {
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
    },
    bannerImage: {
        width: '100%',
        height: '100%',
    },
    bannerPlaceholder: {
        width: '100%',
        height: '100%',
    },
    statusBadge: {
        position: 'absolute',
        top: getSpacing(1),
        right: getSpacing(1),
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: getSpacing(1),
        paddingVertical: moderateScale(4),
        borderRadius: moderateScale(12),
        gap: getSpacing(0.5),
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    statusBadgeText: {
        fontSize: moderateScale(10),
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    titleContainer: {
        padding: getSpacing(1.5),
    },
    title: {
        fontSize: moderateScale(14),
        fontWeight: '700',
        lineHeight: moderateScale(20),
        marginBottom: getSpacing(0.5),
    },
    countdown: {
        fontSize: moderateScale(12),
        fontWeight: '600',
        marginTop: getSpacing(0.25),
    },
});

export default StreamCard;

