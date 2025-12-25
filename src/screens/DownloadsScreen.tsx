import React, { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, RefreshControl, Animated, Easing, TouchableOpacity } from 'react-native';
import { StatusBar } from 'react-native';
import { useTheme } from '../theme/theme';
import { moderateScale, getSpacing } from '../utils/responsive';
import GradientBackground from '../components/GradientBackground';
import ScreenHeader from '../components/ScreenHeader';
import FilterTabs, { FilterTab } from '../components/FilterTabs';
import { Video, FileText, Play, Download } from 'lucide-react-native';
import { Svg, Circle, Rect, Path, G } from 'react-native-svg';
import { useQuery } from '@tanstack/react-query';
import { getDownloads, Download as DownloadType, ContentDownload } from '../services/api';
import { useNavigation } from '@react-navigation/native';
import { useToast } from '../components/Toast';

type DownloadTabType = 'video' | 'pdf';

const DownloadsScreen: React.FC = () => {
    const theme = useTheme();
    const { colors, isDark } = theme;
    const navigation = useNavigation<any>();
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<DownloadTabType>('video');
    const [refreshing, setRefreshing] = useState(false);

    // Filter tabs configuration
    const filterTabs: FilterTab[] = [
        { 
            id: 'video', 
            label: 'Video',
            icon: Video as unknown as React.ComponentType<{ size: number; color: string }>
        },
        { 
            id: 'pdf', 
            label: 'PDF',
            icon: FileText as unknown as React.ComponentType<{ size: number; color: string }>
        },
    ];

    // Fetch downloads
    const { data: downloadsData, isLoading, refetch } = useQuery({
        queryKey: ['downloads'],
        queryFn: getDownloads,
        retry: 2,
    });

    // Filter downloads by active tab
    const filteredDownloads = useMemo(() => {
        if (!downloadsData?.downloads) return [];
        return downloadsData.downloads.filter((download: DownloadType) => {
            return download.assetType === activeTab;
        });
    }, [downloadsData, activeTab]);

    const onRefresh = async () => {
        setRefreshing(true);
        try {
            await refetch();
        } catch (error) {
            toast.show({ text: 'Failed to refresh downloads', type: 'error' });
        } finally {
            setRefreshing(false);
        }
    };

    const handleDownloadPress = (download: DownloadType) => {
        const content = typeof download.content === 'string' ? null : download.content as ContentDownload;
        
        if (!content) {
            toast.show({ text: 'Content information not available', type: 'error' });
            return;
        }

        const contentId = content._id || (typeof download.content === 'string' ? download.content : null);

        if (download.assetType === 'video') {
            toast.show({ text: 'Video playback coming soon', type: 'info' });
        } else if (download.assetType === 'pdf' && content.pdf?.url) {
            navigation.navigate('PDFViewer', {
                url: content.pdf.url,
                title: content.title || 'PDF Document',
                contentId: contentId || undefined,
            });
        }
    };

    const renderDownloadItem = ({ item }: { item: DownloadType }) => {
        const content = typeof item.content === 'string' ? null : item.content as ContentDownload;
        const title = content?.title || 'Unknown Content';
        const category = content?.category?.name || '';
        const course = content?.course?.title || '';

        return (
            <TouchableOpacity
                style={[styles.downloadItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}
                onPress={() => handleDownloadPress(item)}
                activeOpacity={0.7}
            >
                <View style={styles.downloadItemIcon}>
                    {item.assetType === 'video' ? (
                        <Video size={24} color={colors.primary} />
                    ) : (
                        <FileText size={24} color={colors.primary} />
                    )}
                </View>
                <View style={styles.downloadItemContent}>
                    <Text style={[styles.downloadItemTitle, { color: colors.text }]} numberOfLines={2}>
                        {title}
                    </Text>
                    {category && (
                        <Text style={[styles.downloadItemSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                            {category}
                        </Text>
                    )}
                    {course && (
                        <Text style={[styles.downloadItemSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                            {course}
                        </Text>
                    )}
                </View>
                <View style={styles.downloadItemAction}>
                    {item.assetType === 'video' ? (
                        <Play size={20} color={colors.primary} />
                    ) : (
                        <Download size={20} color={colors.primary} />
                    )}
                </View>
            </TouchableOpacity>
        );
    };

    // Custom Animated Empty State SVG Component
    const EmptyStateIllustration = () => {
        const rotateAnim = useRef(new Animated.Value(0)).current;
        const translateXAnim = useRef(new Animated.Value(0)).current;
        const translateYAnim = useRef(new Animated.Value(0)).current;
        const scaleAnim = useRef(new Animated.Value(1)).current;
        const opacityAnim = useRef(new Animated.Value(0.8)).current;

        useEffect(() => {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(rotateAnim, {
                        toValue: 1,
                        duration: 2000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(rotateAnim, {
                        toValue: 0,
                        duration: 2000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            Animated.loop(
                Animated.sequence([
                    Animated.parallel([
                        Animated.timing(translateXAnim, {
                            toValue: 1,
                            duration: 3000,
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        }),
                        Animated.timing(translateYAnim, {
                            toValue: 1,
                            duration: 3000,
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        }),
                    ]),
                    Animated.parallel([
                        Animated.timing(translateXAnim, {
                            toValue: 0,
                            duration: 3000,
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        }),
                        Animated.timing(translateYAnim, {
                            toValue: 0,
                            duration: 3000,
                            easing: Easing.inOut(Easing.ease),
                            useNativeDriver: true,
                        }),
                    ]),
                ])
            ).start();

            Animated.loop(
                Animated.sequence([
                    Animated.timing(scaleAnim, {
                        toValue: 1.2,
                        duration: 2000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(scaleAnim, {
                        toValue: 1,
                        duration: 2000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            Animated.loop(
                Animated.sequence([
                    Animated.timing(opacityAnim, {
                        toValue: 0.3,
                        duration: 1500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacityAnim, {
                        toValue: 0.8,
                        duration: 1500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }, []);

        const rotateInterpolate = rotateAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['-5deg', '5deg'],
        });

        const translateXInterpolate = translateXAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, moderateScale(5)],
        });

        const translateYInterpolate = translateYAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, moderateScale(5)],
        });

        return (
            <View style={styles.emptyIllustrationContainer}>
                <View style={{ width: moderateScale(200), height: moderateScale(200), position: 'relative' }}>
                    <Svg
                        width={moderateScale(200)}
                        height={moderateScale(200)}
                        viewBox="0 0 200 200"
                        style={{ position: 'absolute' }}
                    >
                        <Circle
                            cx="100"
                            cy="100"
                            r="80"
                            fill="#F5F5F5"
                            opacity="0.5"
                        />
                        
                        <G transform="translate(60, 50)">
                            <Rect
                                x="20"
                                y="20"
                                width="40"
                                height="60"
                                fill="#E0E0E0"
                                rx="2"
                            />
                            <Rect x="25" y="30" width="30" height="2" fill="#BDBDBD" />
                            <Rect x="25" y="35" width="30" height="2" fill="#BDBDBD" />
                            <Rect x="25" y="40" width="25" height="2" fill="#BDBDBD" />
                            <Rect x="25" y="45" width="30" height="2" fill="#BDBDBD" />
                            <Rect x="25" y="50" width="20" height="2" fill="#BDBDBD" />
                        </G>
                        
                        <Path
                            d="M 30 40 Q 35 35, 40 40 T 50 40"
                            fill="none"
                            stroke="#424242"
                            strokeWidth="1"
                            opacity="0.6"
                        />
                    </Svg>
                    
                    <Animated.View
                        style={{
                            position: 'absolute',
                            left: moderateScale(95),
                            top: moderateScale(95),
                            transform: [{ rotate: rotateInterpolate }],
                        }}
                    >
                        <Svg width={moderateScale(10)} height={moderateScale(10)}>
                            <Path
                                d="M 0 0 L 10 10 M 10 0 L 0 10"
                                stroke="#EF4444"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                        </Svg>
                    </Animated.View>
                    
                    <Animated.View
                        style={{
                            position: 'absolute',
                            left: moderateScale(100),
                            top: moderateScale(60),
                            transform: [
                                { translateX: translateXInterpolate },
                                { translateY: translateYInterpolate },
                            ],
                        }}
                    >
                        <Svg width={moderateScale(35)} height={moderateScale(35)}>
                            <Circle
                                cx={moderateScale(20)}
                                cy={moderateScale(20)}
                                r={moderateScale(12)}
                                fill="none"
                                stroke="#9C27B0"
                                strokeWidth="2.5"
                            />
                            <Path
                                d={`M ${moderateScale(28)} ${moderateScale(28)} L ${moderateScale(35)} ${moderateScale(35)}`}
                                stroke="#9C27B0"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                            />
                        </Svg>
                    </Animated.View>
                    
                    <Animated.View
                        style={{
                            position: 'absolute',
                            left: moderateScale(45),
                            top: moderateScale(120),
                            transform: [{ scale: scaleAnim }],
                        }}
                    >
                        <Svg width={moderateScale(16)} height={moderateScale(16)}>
                            <Path
                                d="M 0 -8 L 2 0 L 0 8 L -2 0 Z M -8 0 L 0 2 L 8 0 L 0 -2 Z"
                                fill="#FFD700"
                                opacity="0.7"
                            />
                        </Svg>
                    </Animated.View>
                    
                    <Animated.View
                        style={{
                            position: 'absolute',
                            left: moderateScale(150),
                            top: moderateScale(130),
                            opacity: opacityAnim,
                        }}
                    >
                        <Svg width={moderateScale(6)} height={moderateScale(6)}>
                            <Circle
                                cx={moderateScale(3)}
                                cy={moderateScale(3)}
                                r={moderateScale(3)}
                                fill="#2196F3"
                            />
                        </Svg>
                    </Animated.View>
                </View>
            </View>
        );
    };

    return (
        <GradientBackground>
            <StatusBar
                backgroundColor={colors.yellow}
                barStyle={isDark ? 'light-content' : 'dark-content'}
                translucent={false}
            />
            <View style={[styles.container, { backgroundColor: 'transparent' }]}>
                <ScreenHeader showSearch={false} title="My Downloads" />

                <FilterTabs
                    tabs={filterTabs}
                    activeTab={activeTab}
                    onTabChange={(tabId: string) => setActiveTab(tabId as DownloadTabType)}
                />

                {isLoading ? (
                    <View style={styles.centerContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                            Loading downloads...
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={filteredDownloads}
                        renderItem={renderDownloadItem}
                        keyExtractor={(item) => item._id}
                        contentContainerStyle={[
                            styles.listContent,
                            filteredDownloads.length === 0 && styles.emptyListContent
                        ]}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={colors.primary}
                                colors={[colors.primary]}
                            />
                        }
                        ListEmptyComponent={
                            <View style={styles.emptyCardContainer}>
                                <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                                    <View style={styles.emptyCardContent}>
                                        <EmptyStateIllustration />
                                        <Text style={[styles.emptyCardTitle, { color: colors.text }]}>
                                            No {activeTab === 'video' ? 'Videos' : 'PDFs'} Found!
                                        </Text>
                                        <Text style={[styles.emptyCardSubtitle, { color: colors.textSecondary }]}>
                                            {activeTab === 'video' 
                                                ? 'Download videos from courses to view them here'
                                                : 'Download PDFs from courses to view them here'}
                                        </Text>
                                    </View>
                                </View>
                            </View>
                        }
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </GradientBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    listContent: {
        padding: getSpacing(2),
    },
    emptyListContent: {
        flexGrow: 1,
    },
    downloadItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: getSpacing(2),
        marginBottom: getSpacing(1.5),
        borderRadius: moderateScale(12),
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    downloadItemIcon: {
        width: moderateScale(48),
        height: moderateScale(48),
        borderRadius: moderateScale(24),
        backgroundColor: 'rgba(0, 31, 63, 0.1)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: getSpacing(2),
    },
    downloadItemContent: {
        flex: 1,
        marginRight: getSpacing(1),
    },
    downloadItemTitle: {
        fontSize: moderateScale(16),
        fontWeight: '600',
        marginBottom: getSpacing(0.5),
    },
    downloadItemSubtitle: {
        fontSize: moderateScale(12),
        marginTop: getSpacing(0.25),
    },
    downloadItemAction: {
        padding: getSpacing(1),
    },
    emptyCardContainer: {
        padding: getSpacing(2),
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: moderateScale(400),
    },
    emptyCard: {
        borderRadius: moderateScale(16),
        borderWidth: 1,
        padding: getSpacing(4),
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: moderateScale(300),
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        width: '100%',
    },
    emptyCardContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyIllustrationContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: getSpacing(2),
    },
    emptyCardTitle: {
        fontSize: moderateScale(18),
        fontWeight: '600',
        marginTop: getSpacing(2),
        textAlign: 'center',
    },
    emptyCardSubtitle: {
        fontSize: moderateScale(14),
        marginTop: getSpacing(1),
        textAlign: 'center',
        paddingHorizontal: getSpacing(4),
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: getSpacing(4),
    },
    loadingText: {
        marginTop: getSpacing(2),
        fontSize: moderateScale(14),
    },
});

export default DownloadsScreen;

