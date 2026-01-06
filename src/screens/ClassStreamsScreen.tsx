import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, StatusBar } from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/theme';
import { getCourseStreams, getUserStreams, getStreamById, Stream } from '../services/api';
import { MainStackParamList } from '../navigation/MainStack';
import { Calendar, PlayCircle, Radio } from 'lucide-react-native';
import { moderateScale, getSpacing } from '../utils/responsive';
import GradientBackground from '../components/GradientBackground';
import ScreenHeader from '../components/ScreenHeader';
import FilterTabs, { FilterTab } from '../components/FilterTabs';
import StreamCard from '../components/StreamCard';
import StreamSkeletonCard from '../components/StreamSkeletonCard';
import StreamDetailsModal from '../components/StreamDetailsModal';
import PurchaseModal from '../components/PurchaseModal';
import { getStreamStatus, formatDate, getCountdown } from '../utils/streamUtils';

type ClassStreamsScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'ClassStreams'>;
type ClassStreamsScreenRouteProp = RouteProp<MainStackParamList, 'ClassStreams'>;

type StreamTabType = 'live' | 'upcoming';

const ClassStreamsScreen: React.FC = () => {
    const theme = useTheme();
    const { colors, isDark } = theme;
    const navigation = useNavigation<ClassStreamsScreenNavigationProp>();
    const route = useRoute<ClassStreamsScreenRouteProp>();
    const { courseId } = route.params || {};

    const [streams, setStreams] = useState<Stream[]>([]);

    console.log('streams', streams);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
    const [activeTab, setActiveTab] = useState<StreamTabType>('live');

    // Memoize filter tabs
    const filterTabs: FilterTab[] = useMemo(() => [
        { id: 'live', label: 'Live', icon: Radio as unknown as React.ComponentType<{ size: number; color: string }> },
        { id: 'upcoming', label: 'Upcoming', icon: Calendar as unknown as React.ComponentType<{ size: number; color: string }> },
    ], []);

    // Memoize fetchStreams with proper error handling
    const fetchStreams = useCallback(async () => {
        try {
            setError(null);
            const typeParam = activeTab as 'live' | 'upcoming';

            if (courseId) {
                const data = await getCourseStreams(courseId, typeParam);
                setStreams(Array.isArray(data) ? data : []);
            } else {
                try {
                    const userDetails = await AsyncStorage.getItem('userData');
                    if (userDetails) {
                        const parsedUser = JSON.parse(userDetails);
                        let classId: string | undefined;
                        if (parsedUser.classId) {
                            classId = parsedUser.classId;
                        } else if (parsedUser.class_id) {
                            classId = parsedUser.class_id;
                        } else if (parsedUser.class) {
                            classId = typeof parsedUser.class === 'object'
                                ? parsedUser.class._id
                                : parsedUser.class;
                        }

                        if (classId) {
                            const data = await getUserStreams(classId, typeParam);
                            setStreams(Array.isArray(data) ? data : []);
                        } else {
                            setError('Class information not found');
                            setStreams([]);
                        }
                    } else {
                        setError('User information not found');
                        setStreams([]);
                    }
                } catch (storageError) {
                    if (__DEV__) {
                        console.error('[ClassStreamsScreen] Storage error:', storageError);
                    }
                    setError('Failed to load user data');
                    setStreams([]);
                }
            }
        } catch (err: any) {
            if (__DEV__) {
                console.error('[ClassStreamsScreen] Error fetching streams:', err);
            }
            setError('Failed to load streams');
            setStreams([]);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [courseId, activeTab]);

    useEffect(() => {
        setLoading(true);
        fetchStreams();
    }, [fetchStreams]);

    useFocusEffect(
        useCallback(() => {
            if (!loading) {
                fetchStreams();
            }
        }, [fetchStreams, loading])
    );

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchStreams();
    }, [fetchStreams]);

    const handleStreamPress = useCallback(async (stream: Stream) => {
        const streamId = stream._id || stream.id;
        if (!streamId) {
            if (__DEV__) {
                console.error('[ClassStreamsScreen] Stream ID is missing');
            }
            return;
        }

        try {
            // Call API to get stream with purchase status
            const response = await getStreamById(streamId);

            // If user has purchased, navigate directly to player
            if (response.isUserPurchased === true) {
                navigation.navigate('StreamPlayer', {
                    streamId: response.stream._id || response.stream.id || streamId,
                    tpAssetId: response.stream.tpAssetId || stream.tpAssetId,
                    hlsUrl: response.stream.hlsUrl || stream.hlsUrl,
                });
                return;
            }

            // If not purchased, show purchase modal
            setSelectedStream(response.stream);
            setPurchaseModalVisible(true);
        } catch (error: any) {
            if (__DEV__) {
                console.error('[ClassStreamsScreen] Error fetching stream details:', error);
            }
            // Fallback: use the stream from the list
            setSelectedStream(stream);
            setPurchaseModalVisible(true);
        }
    }, []);

    const handlePlayStream = useCallback(() => {
        if (!selectedStream) return;
        const statusInfo = getStreamStatus(selectedStream);
        if (statusInfo.label !== 'LIVE') return;

        setModalVisible(false);
        navigation.navigate('StreamPlayer', {
            streamId: selectedStream._id || selectedStream.id || '',
            tpAssetId: selectedStream.tpAssetId,
            hlsUrl: selectedStream.hlsUrl,
        });
    }, [selectedStream, navigation]);

    const handleCloseModal = useCallback(() => {
        setModalVisible(false);
        setSelectedStream(null);
    }, []);

    const handleClosePurchaseModal = useCallback(() => {
        setPurchaseModalVisible(false);
        setSelectedStream(null);
    }, []);

    const handleBuyNow = useCallback(() => {
        if (selectedStream) {
            const streamWithSelections = selectedStream as any;
            const courseIdFromStream = streamWithSelections.courseSelections?.[0]?.course?._id ||
                (typeof selectedStream.courseId === 'string' ? selectedStream.courseId : (selectedStream.courseId as any)?._id);

            if (courseIdFromStream) {
                setPurchaseModalVisible(false);
                navigation.navigate('CourseDetails', { courseId: courseIdFromStream });
            }
        }
    }, [selectedStream, navigation]);

    const renderStreamItem = useCallback(({ item }: { item: Stream }) => {
        if (!item || !item._id) return null;
        return (
            <StreamCard
                item={item}
                onPress={handleStreamPress}
                getStreamStatus={getStreamStatus}
                getCountdown={getCountdown}
            />
        );
    }, [handleStreamPress]);

    // Memoize keyExtractor
    const keyExtractor = useCallback((item: Stream) => item._id || item.id || Math.random().toString(), []);

    // Memoize empty component
    const renderEmptyComponent = useMemo(() => (
        <View style={styles.emptyCardContainer}>
            <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <View style={styles.emptyCardContent}>
                    <PlayCircle size={moderateScale(64)} color={colors.textSecondary} />
                    <Text style={[styles.emptyCardTitle, { color: colors.text }]}>
                        No {activeTab === 'live' ? 'Live ' : 'Upcoming '}Streams Available
                    </Text>
                    <Text style={[styles.emptyCardSubtext, { color: colors.textSecondary }]}>
                        {activeTab === 'live'
                            ? 'There are no live streams at the moment. Check back later!'
                            : 'No upcoming streams scheduled. Stay tuned for updates!'}
                    </Text>
                </View>
            </View>
        </View>
    ), [activeTab, colors]);

    const renderSkeletonList = useMemo(() => (
        <FlatList
            data={[1, 2, 3, 4, 5, 6]}
            renderItem={() => <StreamSkeletonCard />}
            keyExtractor={(item) => item.toString()}
            contentContainerStyle={styles.listContent}
            scrollEnabled={false}
        />
    ), []);

    return (
        <GradientBackground>
            <StatusBar
                backgroundColor={colors.yellow}
                barStyle={isDark ? 'light-content' : 'dark-content'}
                translucent={false}
            />
            <View style={[styles.container, { backgroundColor: 'transparent' }]}>
                <ScreenHeader showSearch={false} title="Live Classes" />
                <FilterTabs
                    tabs={filterTabs}
                    activeTab={activeTab}
                    onTabChange={(tabId: string) => setActiveTab(tabId as StreamTabType)}
                />

                {loading && !refreshing ? (
                    renderSkeletonList
                ) : error ? (
                    <View style={styles.centerContainer}>
                        <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
                        <TouchableOpacity
                            onPress={fetchStreams}
                            style={[styles.retryButton, { backgroundColor: colors.primary }]}
                        >
                            <Text style={styles.retryText}>Retry</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <FlatList
                        data={streams}
                        renderItem={renderStreamItem}
                        keyExtractor={keyExtractor}
                        contentContainerStyle={styles.listContent}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={colors.primary}
                                colors={[colors.primary]}
                            />
                        }
                        ListEmptyComponent={renderEmptyComponent}
                        showsVerticalScrollIndicator={false}
                        removeClippedSubviews={true}
                        maxToRenderPerBatch={5}
                        updateCellsBatchingPeriod={100}
                        initialNumToRender={4}
                        windowSize={5}
                        getItemLayout={(data, index) => ({
                            length: moderateScale(280),
                            offset: moderateScale(280) * index,
                            index,
                        })}
                    />
                )}

                <StreamDetailsModal
                    visible={modalVisible}
                    stream={selectedStream}
                    onClose={handleCloseModal}
                    onPlay={handlePlayStream}
                    getStreamStatus={getStreamStatus}
                    getCountdown={getCountdown}
                    formatDate={formatDate}
                />

                <PurchaseModal
                    visible={purchaseModalVisible}
                    stream={selectedStream}
                    onClose={handleClosePurchaseModal}
                    onBuyNow={handleBuyNow}
                />
            </View>
        </GradientBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        paddingHorizontal: getSpacing(2),
        paddingBottom: getSpacing(12),
    },
    emptyCardContainer: {
        padding: getSpacing(2),
    },
    emptyCard: {
        borderRadius: moderateScale(16),
        borderWidth: 1,
        padding: getSpacing(4),
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: moderateScale(200),
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    emptyCardContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyCardTitle: {
        fontSize: moderateScale(18),
        fontWeight: '700',
        marginTop: getSpacing(2),
        marginBottom: getSpacing(1),
        textAlign: 'center',
    },
    emptyCardSubtext: {
        fontSize: moderateScale(14),
        textAlign: 'center',
        lineHeight: moderateScale(20),
        paddingHorizontal: getSpacing(2),
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: getSpacing(4),
    },
    errorText: {
        fontSize: moderateScale(16),
        marginBottom: getSpacing(2),
        textAlign: 'center',
    },
    retryButton: {
        paddingHorizontal: getSpacing(4),
        paddingVertical: getSpacing(1.5),
        borderRadius: moderateScale(8),
    },
    retryText: {
        color: '#FFFFFF',
        fontSize: moderateScale(14),
        fontWeight: '600',
    },
});

export default ClassStreamsScreen;

