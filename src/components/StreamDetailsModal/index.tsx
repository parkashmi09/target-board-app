import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Modal from 'react-native-modal';
import { Calendar, PlayCircle, Radio, X, Video } from 'lucide-react-native';
import { useTheme } from '../../theme/theme';
import { moderateScale, getSpacing } from '../../utils/responsive';
import { Stream } from '../../services/api';

interface StreamDetailsModalProps {
    visible: boolean;
    stream: Stream | null;
    onClose: () => void;
    onPlay: () => void;
    getStreamStatus: (stream: Stream) => { label: string; color: string; bgColor: string };
    getCountdown: (startTime?: string) => string;
    formatDate: (dateString?: string) => string;
}

const StreamDetailsModal: React.FC<StreamDetailsModalProps> = React.memo(({
    visible,
    stream,
    onClose,
    onPlay,
    getStreamStatus,
    getCountdown,
    formatDate,
}) => {
    const theme = useTheme();
    const { colors } = theme;

    if (!stream) return null;

    const statusInfo = getStreamStatus(stream);
    const isLive = statusInfo.label === 'LIVE';
    const isUpcoming = statusInfo.label === 'UPCOMING';
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
            <View style={[styles.modalContent, { backgroundColor: colors.cardBackground }]}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <X size={moderateScale(24)} color={colors.text} />
                </TouchableOpacity>

                <View style={styles.bannerContainer}>
                    {thumbnailUrl ? (
                        <Image
                            source={{ uri: thumbnailUrl }}
                            style={styles.bannerImage}
                            resizeMode="cover"
                        />
                    ) : (
                        <View style={[styles.bannerPlaceholder, { backgroundColor: colors.border }]} />
                    )}
                    <View style={styles.bannerOverlays} pointerEvents="box-none">
                        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bgColor }]}>
                            {isLive && <Radio size={moderateScale(8)} color="#FFFFFF" fill="#FFFFFF" />}
                            <Text style={styles.statusText}>{statusInfo.label}</Text>
                        </View>
                        {stream.isPaid && (
                            <View style={styles.paidBadge}>
                                <Text style={styles.paidText}>PAID</Text>
                            </View>
                        )}
                    </View>
                </View>

                <View style={styles.detailsContainer}>
                    <View style={styles.titleRow}>
                        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
                            {stream.title || 'Untitled Stream'}
                        </Text>
                        <View style={[styles.titleBadge, { backgroundColor: statusInfo.bgColor }]}>
                            <Text style={styles.titleBadgeText}>{statusInfo.label}</Text>
                        </View>
                    </View>

                    {isUpcoming && stream.startTime && (
                        <Text style={[styles.countdown, { color: colors.textSecondary }]}>
                            Starts in: {getCountdown(stream.startTime)}
                        </Text>
                    )}

                    {stream.description && (
                        <Text style={[styles.description, { color: colors.textSecondary }]} numberOfLines={3}>
                            {stream.description}
                        </Text>
                    )}

                    <View style={styles.infoRow}>
                        <View style={styles.infoItem}>
                            <Calendar size={moderateScale(14)} color={colors.textSecondary} />
                            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                                {formatDate(stream.startTime || stream.scheduled_start)}
                            </Text>
                        </View>
                        {stream.resolutions && stream.resolutions.length > 0 && (
                            <View style={styles.infoItem}>
                                <Video size={moderateScale(14)} color={colors.textSecondary} />
                                <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                                    {stream.resolutions.join(', ')}
                                </Text>
                            </View>
                        )}
                    </View>

                    {isLive && (
                        <TouchableOpacity
                            style={[styles.watchButton, { backgroundColor: '#EF4444' }]}
                            onPress={onPlay}
                            activeOpacity={0.8}
                        >
                            <PlayCircle size={moderateScale(20)} color="#FFFFFF" fill="#FFFFFF" />
                            <Text style={styles.watchButtonText}>Watch Live</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </Modal>
    );
});

StreamDetailsModal.displayName = 'StreamDetailsModal';

const styles = StyleSheet.create({
    modalContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        margin: getSpacing(2),
        width: '100%',
    },
    modalContent: {
        borderRadius: moderateScale(24),
        overflow: 'hidden',
        maxHeight: '85%',
        maxWidth: '95%',
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
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    bannerContainer: {
        width: '100%',
        height: moderateScale(220),
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#000',
    },
    bannerImage: {
        height: moderateScale(220),
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
    },
    bannerPlaceholder: {
        height: moderateScale(220),
        width: '100%',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
    },
    bannerOverlays: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'space-between',
        padding: getSpacing(1.5),
        zIndex: 2,
    },
    statusBadge: {
        alignSelf: 'flex-start',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: getSpacing(1.25),
        paddingVertical: moderateScale(6),
        borderRadius: moderateScale(12),
        gap: getSpacing(0.5),
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    statusText: {
        fontSize: moderateScale(11),
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    paidBadge: {
        alignSelf: 'flex-start',
        backgroundColor: '#F59E0B',
        paddingHorizontal: getSpacing(1.25),
        paddingVertical: moderateScale(6),
        borderRadius: moderateScale(12),
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
    },
    paidText: {
        fontSize: moderateScale(10),
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    detailsContainer: {
        padding: getSpacing(2),
        backgroundColor: 'transparent',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: getSpacing(1),
        gap: getSpacing(1),
    },
    title: {
        flex: 1,
        fontSize: moderateScale(18),
        fontWeight: '700',
        lineHeight: moderateScale(24),
    },
    titleBadge: {
        paddingHorizontal: getSpacing(1.25),
        paddingVertical: moderateScale(6),
        borderRadius: moderateScale(8),
        alignSelf: 'flex-start',
    },
    titleBadgeText: {
        fontSize: moderateScale(11),
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    countdown: {
        fontSize: moderateScale(12),
        fontWeight: '600',
        marginTop: getSpacing(0.25),
    },
    description: {
        fontSize: moderateScale(13),
        lineHeight: moderateScale(18),
        marginBottom: getSpacing(1.5),
        opacity: 0.8,
    },
    infoRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: getSpacing(1.5),
        marginBottom: getSpacing(2),
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: getSpacing(0.5),
        flex: 1,
        minWidth: '45%',
    },
    infoText: {
        fontSize: moderateScale(12),
        flex: 1,
    },
    watchButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: getSpacing(1.5),
        paddingHorizontal: getSpacing(2),
        borderRadius: moderateScale(12),
        gap: getSpacing(1),
        marginTop: getSpacing(1),
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    watchButtonText: {
        color: '#FFFFFF',
        fontSize: moderateScale(14),
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});

export default StreamDetailsModal;

