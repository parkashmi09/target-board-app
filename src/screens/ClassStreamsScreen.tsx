import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, StatusBar, Animated, Easing, BackHandler, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../theme/theme';
import { getFontFamily } from '../utils/fonts';
import { getCourseStreams, getUserStreams, getStreamById, fetchCourseDetails, Stream } from '../services/api';
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
import { Svg, Circle, Rect, Path, G, Text as SvgText, TSpan } from 'react-native-svg';
import { useLoaderStore } from '../store/loaderStore';
import { useToast } from '../components/Toast';

type ClassStreamsScreenNavigationProp = NativeStackNavigationProp<MainStackParamList, 'ClassStreams'>;
type ClassStreamsScreenRouteProp = RouteProp<MainStackParamList, 'ClassStreams'>;

type StreamTabType = 'live' | 'upcoming';

const ClassStreamsScreen: React.FC = () => {
    const theme = useTheme();
    const { colors, isDark } = theme;
    const navigation = useNavigation<ClassStreamsScreenNavigationProp>();
    const route = useRoute<ClassStreamsScreenRouteProp>();
    const { courseId } = route.params || {};
    const { show: showLoader, hide: hideLoader } = useLoaderStore();
    const toast = useToast();

    const [streams, setStreams] = useState<Stream[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedStream, setSelectedStream] = useState<Stream | null>(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
    const [activeTab, setActiveTab] = useState<StreamTabType>('live');
    const [isCheckingStream, setIsCheckingStream] = useState(false);
    const [courseDetails, setCourseDetails] = useState<any>(null);
    const [coursePricing, setCoursePricing] = useState<{ originalPrice: number; currentPrice: number } | null>(null);
    
    // CRITICAL: Prevent state updates after component unmount
    const mounted = useRef(true);

    // Handle back button press - works with both header button and Android hardware back button
    const handleBackPress = useCallback(() => {
        try {
            // Check if we can go back in navigation stack
            if (navigation.canGoBack && navigation.canGoBack()) {
                navigation.goBack();
            } else {
                // Fallback: Try parent navigator
                const parent = navigation.getParent();
                if (parent && parent.canGoBack && parent.canGoBack()) {
                    parent.goBack();
                }
            }
        } catch (error) {
            // If navigation fails, try basic goBack
            try {
                navigation.goBack();
            } catch (e) {
                console.warn('[ClassStreamsScreen] Navigation back failed:', e);
            }
        }
    }, [navigation]);

    // Handle Android hardware back button separately - ensures it works independently
    useEffect(() => {
        const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
            handleBackPress();
            return true; // Prevent default back behavior
        });

        return () => backHandler.remove();
    }, [handleBackPress]);

    // Cleanup: Hide loader and mark as unmounted when component unmounts
    useEffect(() => {
        mounted.current = true;
        return () => {
            mounted.current = false;
            const { hide: hideLoader } = useLoaderStore.getState();
            hideLoader();
            // Reset checking state
            setIsCheckingStream(false);
        };
    }, []);

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

                        // Extract stateBoardId from userData (similar to HomeScreen)
                        let stateBoardId: string | undefined;
                        if (parsedUser.stateBoardId) {
                            stateBoardId = parsedUser.stateBoardId;
                        } else if (parsedUser.stateBoard) {
                            stateBoardId = typeof parsedUser.stateBoard === 'object'
                                ? parsedUser.stateBoard._id
                                : parsedUser.stateBoard;
                        }

                        if (classId) {
                            const data = await getUserStreams(classId, typeParam, stateBoardId);
                            setStreams(Array.isArray(data) ? data : []);
                            setError(null); // Clear error if data is fetched successfully
                        } else {
                            // No class info - show empty state instead of error
                            setStreams([]);
                            setError(null);
                        }
                    } else {
                        // No user info - show empty state instead of error
                        setStreams([]);
                        setError(null);
                    }
                } catch (storageError) {
                    if (__DEV__) {
                        console.error('[ClassStreamsScreen] Storage error:', storageError);
                    }
                    // Show empty state instead of error for storage issues
                    setStreams([]);
                    setError(null);
                }
            }
        } catch (err: any) {
            if (__DEV__) {
                console.error('[ClassStreamsScreen] Error fetching streams:', err);
            }
            // Only set error for actual network/API errors, otherwise show empty state
            if (err?.message?.includes('network') || err?.message?.includes('Network')) {
                setError('Network error. Please check your connection.');
            } else {
                setError(null); // Show empty state for other errors
            }
            setStreams([]);
        } finally {
            // Only update state if component is still mounted
            if (mounted.current) {
                setLoading(false);
                setRefreshing(false);
            }
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

        // Prevent multiple simultaneous checks
        if (isCheckingStream) {
            if (__DEV__) {
                console.log('[ClassStreamsScreen] Stream check already in progress, ignoring duplicate press');
            }
            return;
        }

        // Check stream status first (from initial stream data)
        const initialStatusInfo = getStreamStatus(stream);
        const initialIsLive = initialStatusInfo.label === 'LIVE';
        const initialIsUpcoming = initialStatusInfo.label === 'UPCOMING';
        const hasVideoData = !!(stream.tpAssetId || stream.hlsUrl);

        // CRITICAL: For LIVE streams - ALWAYS check purchase status via API before navigating
        if (initialIsLive && hasVideoData) {
            setIsCheckingStream(true);
            showLoader('Checking stream access...');
            
            try {
                // ALWAYS call API to check purchase status for live streams
                const response = await getStreamById(streamId);
                const streamData = response.stream || stream;
                const isPurchased = response.isUserPurchased === true;
                
                // Double-check status with latest data
                const latestStatusInfo = getStreamStatus(streamData);
                const latestIsLive = latestStatusInfo.label === 'LIVE';
                const latestHasVideoData = !!(streamData.tpAssetId || streamData.hlsUrl);
                
                hideLoader();
                if (mounted.current) {
                    setIsCheckingStream(false);
                }
                
                // If user has NOT purchased, fetch course details and show purchase modal
                if (!isPurchased) {
                    if (__DEV__) {
                        console.log('[ClassStreamsScreen] User has not purchased stream, fetching course details');
                    }
                    setSelectedStream(streamData);
                    
                    // Fetch course details to get pricing
                    const streamWithSelections = streamData as any;
                    const courseIdFromStream = streamWithSelections.courseSelections?.[0]?.course?._id ||
                        (typeof streamData.courseId === 'string' ? streamData.courseId : (streamData.courseId as any)?._id) ||
                        courseId;
                    
                    if (courseIdFromStream) {
                        try {
                            const courseData = await fetchCourseDetails(courseIdFromStream);
                            if (mounted.current && courseData) {
                                setCourseDetails(courseData);
                                
                                // Extract pricing from course details (same logic as PaymentCheckoutScreen)
                                const selectedPackage = courseData?.packages?.find((pkg: any) => pkg.isDefault === true) ||
                                    courseData?.packages?.[0] || null;
                                const packagePrice = selectedPackage?.price || 0;
                                const originalPrice = courseData?.strikeoutPrice || courseData?.coursePrice || 0;
                                const currentPrice = packagePrice > 0 ? packagePrice : (courseData?.coursePrice || 0);
                                
                                setCoursePricing({ originalPrice, currentPrice });
                            }
                        } catch (courseError) {
                            if (__DEV__) {
                                console.error('[ClassStreamsScreen] Error fetching course details:', courseError);
                            }
                            // Set default pricing if fetch fails
                            setCoursePricing({ originalPrice: 0, currentPrice: 0 });
                        }
                    } else {
                        setCoursePricing({ originalPrice: 0, currentPrice: 0 });
                    }
                    
                    setTimeout(() => {
                        setPurchaseModalVisible(true);
                    }, 100);
                    return;
                }
                
                // If purchased and still live with video data, navigate directly
                if (isPurchased && latestIsLive && latestHasVideoData) {
                    setTimeout(() => {
                        if (mounted.current) {
                            try {
                                navigation.navigate('StreamPlayer', {
                                    streamId: streamData._id || streamData.id || streamId,
                                    tpAssetId: streamData.tpAssetId || stream.tpAssetId,
                                    hlsUrl: streamData.hlsUrl || stream.hlsUrl,
                                });
                            } catch (navError) {
                                if (__DEV__) {
                                    console.error('[ClassStreamsScreen] Navigation error:', navError);
                                }
                                // Fallback: show modal
                                setSelectedStream(streamData);
                                setPurchaseModalVisible(true);
                            }
                        }
                    }, 0);
                    return;
                } else {
                    // Status changed to not live - show modal
                    setSelectedStream(streamData);
                    setTimeout(() => {
                        setPurchaseModalVisible(true);
                    }, 100);
                    return;
                }
            } catch (error: any) {
                if (__DEV__) {
                    console.error('[ClassStreamsScreen] Error fetching stream details:', error);
                }
                hideLoader();
                if (mounted.current) {
                    setIsCheckingStream(false);
                }
                
                // Check if error response contains isUserPurchased: false
                // API might return error with data: { isUserPurchased: false, message: "..." }
                const errorData = error?.data || error;
                const isUserPurchasedFromError = errorData?.isUserPurchased;
                
                // On API error, check if it's an access denied error or isUserPurchased is false
                if (error?.status === 403 || 
                    error?.message?.includes('access_denied') || 
                    error?.message?.includes('purchase') ||
                    error?.message?.includes('must purchase') ||
                    isUserPurchasedFromError === false) {
                    // Access denied or not purchased - fetch course details and show purchase modal
                    if (__DEV__) {
                        console.log('[ClassStreamsScreen] Access denied or not purchased, fetching course details');
                    }
                    setSelectedStream(stream);
                    
                    // Fetch course details to get pricing
                    const streamWithSelections = stream as any;
                    const courseIdFromStream = streamWithSelections.courseSelections?.[0]?.course?._id ||
                        (typeof stream.courseId === 'string' ? stream.courseId : (stream.courseId as any)?._id) ||
                        courseId;
                    
                    if (courseIdFromStream) {
                        try {
                            const courseData = await fetchCourseDetails(courseIdFromStream);
                            if (mounted.current && courseData) {
                                setCourseDetails(courseData);
                                
                                // Extract pricing from course details
                                const selectedPackage = courseData?.packages?.find((pkg: any) => pkg.isDefault === true) ||
                                    courseData?.packages?.[0] || null;
                                const packagePrice = selectedPackage?.price || 0;
                                const originalPrice = courseData?.strikeoutPrice || courseData?.coursePrice || 0;
                                const currentPrice = packagePrice > 0 ? packagePrice : (courseData?.coursePrice || 0);
                                
                                setCoursePricing({ originalPrice, currentPrice });
                            }
                        } catch (courseError) {
                            if (__DEV__) {
                                console.error('[ClassStreamsScreen] Error fetching course details:', courseError);
                            }
                            setCoursePricing({ originalPrice: 0, currentPrice: 0 });
                        }
                    } else {
                        setCoursePricing({ originalPrice: 0, currentPrice: 0 });
                    }
                    
                    setTimeout(() => {
                        setPurchaseModalVisible(true);
                    }, 100);
                    return;
                }
                
                // For other errors, fetch course details and show modal
                setSelectedStream(stream);
                
                // Fetch course details to get pricing
                const streamWithSelections = stream as any;
                const courseIdFromStream = streamWithSelections.courseSelections?.[0]?.course?._id ||
                    (typeof stream.courseId === 'string' ? stream.courseId : (stream.courseId as any)?._id) ||
                    courseId;
                
                if (courseIdFromStream) {
                    try {
                        const courseData = await fetchCourseDetails(courseIdFromStream);
                        if (mounted.current && courseData) {
                            setCourseDetails(courseData);
                            
                            // Extract pricing from course details
                            const selectedPackage = courseData?.packages?.find((pkg: any) => pkg.isDefault === true) ||
                                courseData?.packages?.[0] || null;
                            const packagePrice = selectedPackage?.price || 0;
                            const originalPrice = courseData?.strikeoutPrice || courseData?.coursePrice || 0;
                            const currentPrice = packagePrice > 0 ? packagePrice : (courseData?.coursePrice || 0);
                            
                            setCoursePricing({ originalPrice, currentPrice });
                        }
                    } catch (courseError) {
                        if (__DEV__) {
                            console.error('[ClassStreamsScreen] Error fetching course details:', courseError);
                        }
                        setCoursePricing({ originalPrice: 0, currentPrice: 0 });
                    }
                } else {
                    setCoursePricing({ originalPrice: 0, currentPrice: 0 });
                }
                
                setTimeout(() => {
                    setPurchaseModalVisible(true);
                }, 100);
                return;
            }
        }

        // For UPCOMING streams - Show toast notification only (no purchase modal)
        if (activeTab === 'upcoming' || initialIsUpcoming) {
            // If activeTab is 'upcoming', just show toast and return (no purchase modal)
            if (activeTab === 'upcoming') {
                setIsCheckingStream(true);
                try {
                    showLoader('Loading stream details...');
                    const response = await getStreamById(streamId);
                    const streamData = response.stream || stream;
                    const isPurchased = response.isUserPurchased === true;
                    
                    hideLoader();
                    setIsCheckingStream(false);
                    
                    // Check if stream became live
                    const latestStatusInfo = getStreamStatus(streamData);
                    const latestIsLive = latestStatusInfo.label === 'LIVE';
                    const latestHasVideoData = !!(streamData.tpAssetId || streamData.hlsUrl);
                    
                    // If purchased and stream has started (became live), navigate to player
                    if (isPurchased && latestIsLive && latestHasVideoData) {
                        // Stream became live and user has purchased - navigate directly
                        setTimeout(() => {
                            if (mounted.current) {
                                try {
                                    navigation.navigate('StreamPlayer', {
                                        streamId: streamData._id || streamData.id || streamId,
                                        tpAssetId: streamData.tpAssetId,
                                        hlsUrl: streamData.hlsUrl,
                                    });
                                } catch (navError) {
                                    if (__DEV__) {
                                        console.error('[ClassStreamsScreen] Navigation error:', navError);
                                    }
                                    // If navigation fails, show toast
                                    toast.show({
                                        text: 'Stream will start soon',
                                        type: 'info',
                                        durationMs: 3000,
                                    });
                                }
                            }
                        }, 0);
                        return;
                    }
                    
                    // For upcoming streams in 'upcoming' tab - only show toast, no purchase modal
                    toast.show({
                        text: 'Stream will start soon',
                        type: 'info',
                        durationMs: 3000,
                    });
                    return;
                } catch (error: any) {
                    if (__DEV__) {
                        console.error('[ClassStreamsScreen] Error fetching stream details:', error);
                    }
                    hideLoader();
                    setIsCheckingStream(false);
                    
                    // Show toast even on error for upcoming streams
                    toast.show({
                        text: 'Stream will start soon',
                        type: 'info',
                        durationMs: 3000,
                    });
                    return;
                }
            }
            
            // If not in 'upcoming' tab but stream is upcoming, check purchase status
            setIsCheckingStream(true);
            try {
                showLoader('Loading stream details...');
                const response = await getStreamById(streamId);
                const streamData = response.stream || stream;
                const isPurchased = response.isUserPurchased === true;
                
                hideLoader();
                setIsCheckingStream(false);
                
                // If purchased and stream has started (became live), navigate to player
                const latestStatusInfo = getStreamStatus(streamData);
                const latestIsLive = latestStatusInfo.label === 'LIVE';
                const latestHasVideoData = !!(streamData.tpAssetId || streamData.hlsUrl);
                
                if (isPurchased && latestIsLive && latestHasVideoData) {
                    // Stream became live and user has purchased - navigate directly
                    setTimeout(() => {
                        if (mounted.current) {
                            try {
                                navigation.navigate('StreamPlayer', {
                                    streamId: streamData._id || streamData.id || streamId,
                                    tpAssetId: streamData.tpAssetId,
                                    hlsUrl: streamData.hlsUrl,
                                });
                            } catch (navError) {
                                if (__DEV__) {
                                    console.error('[ClassStreamsScreen] Navigation error:', navError);
                                }
                                setSelectedStream(streamData);
                                setPurchaseModalVisible(true);
                            }
                        }
                    }, 0);
                    return;
                }
                
                // Show modal for purchase or stream info (only if not in upcoming tab)
                setSelectedStream(streamData);
                
                // Fetch course details to get pricing
                const streamWithSelections = streamData as any;
                const courseIdFromStream = streamWithSelections.courseSelections?.[0]?.course?._id ||
                    (typeof streamData.courseId === 'string' ? streamData.courseId : (streamData.courseId as any)?._id) ||
                    courseId;
                
                if (courseIdFromStream) {
                    try {
                        const courseData = await fetchCourseDetails(courseIdFromStream);
                        if (mounted.current && courseData) {
                            setCourseDetails(courseData);
                            
                            // Extract pricing from course details
                            const selectedPackage = courseData?.packages?.find((pkg: any) => pkg.isDefault === true) ||
                                courseData?.packages?.[0] || null;
                            const packagePrice = selectedPackage?.price || 0;
                            const originalPrice = courseData?.strikeoutPrice || courseData?.coursePrice || 0;
                            const currentPrice = packagePrice > 0 ? packagePrice : (courseData?.coursePrice || 0);
                            
                            setCoursePricing({ originalPrice, currentPrice });
                        }
                    } catch (courseError) {
                        if (__DEV__) {
                            console.error('[ClassStreamsScreen] Error fetching course details:', courseError);
                        }
                        setCoursePricing({ originalPrice: 0, currentPrice: 0 });
                    }
                } else {
                    setCoursePricing({ originalPrice: 0, currentPrice: 0 });
                }
                
                setTimeout(() => {
                    setPurchaseModalVisible(true);
                }, 100);
            } catch (error: any) {
                if (__DEV__) {
                    console.error('[ClassStreamsScreen] Error fetching stream details:', error);
                }
                hideLoader();
                setIsCheckingStream(false);
                setSelectedStream(stream);
                
                // Fetch course details to get pricing
                const streamWithSelections = stream as any;
                const courseIdFromStream = streamWithSelections.courseSelections?.[0]?.course?._id ||
                    (typeof stream.courseId === 'string' ? stream.courseId : (stream.courseId as any)?._id) ||
                    courseId;
                
                if (courseIdFromStream) {
                    try {
                        const courseData = await fetchCourseDetails(courseIdFromStream);
                        if (mounted.current && courseData) {
                            setCourseDetails(courseData);
                            
                            // Extract pricing from course details
                            const selectedPackage = courseData?.packages?.find((pkg: any) => pkg.isDefault === true) ||
                                courseData?.packages?.[0] || null;
                            const packagePrice = selectedPackage?.price || 0;
                            const originalPrice = courseData?.strikeoutPrice || courseData?.coursePrice || 0;
                            const currentPrice = packagePrice > 0 ? packagePrice : (courseData?.coursePrice || 0);
                            
                            setCoursePricing({ originalPrice, currentPrice });
                        }
                    } catch (courseError) {
                        if (__DEV__) {
                            console.error('[ClassStreamsScreen] Error fetching course details:', courseError);
                        }
                        setCoursePricing({ originalPrice: 0, currentPrice: 0 });
                    }
                } else {
                    setCoursePricing({ originalPrice: 0, currentPrice: 0 });
                }
                
                setTimeout(() => {
                    setPurchaseModalVisible(true);
                }, 100);
            }
            return;
        }

        // For any other status (RECORDED, SCHEDULED, etc.) - show modal
        setIsCheckingStream(true);
        showLoader('Loading stream details...');
        
        try {
            const response = await getStreamById(streamId);
            const streamData = response.stream || stream;
            hideLoader();
            setIsCheckingStream(false);
            setSelectedStream(streamData);
            
            // Fetch course details to get pricing
            const streamWithSelections = streamData as any;
            const courseIdFromStream = streamWithSelections.courseSelections?.[0]?.course?._id ||
                (typeof streamData.courseId === 'string' ? streamData.courseId : (streamData.courseId as any)?._id) ||
                courseId;
            
            if (courseIdFromStream) {
                try {
                    const courseData = await fetchCourseDetails(courseIdFromStream);
                    if (mounted.current && courseData) {
                        setCourseDetails(courseData);
                        
                        // Extract pricing from course details
                        const selectedPackage = courseData?.packages?.find((pkg: any) => pkg.isDefault === true) ||
                            courseData?.packages?.[0] || null;
                        const packagePrice = selectedPackage?.price || 0;
                        const originalPrice = courseData?.strikeoutPrice || courseData?.coursePrice || 0;
                        const currentPrice = packagePrice > 0 ? packagePrice : (courseData?.coursePrice || 0);
                        
                        setCoursePricing({ originalPrice, currentPrice });
                    }
                } catch (courseError) {
                    if (__DEV__) {
                        console.error('[ClassStreamsScreen] Error fetching course details:', courseError);
                    }
                    setCoursePricing({ originalPrice: 0, currentPrice: 0 });
                }
            } else {
                setCoursePricing({ originalPrice: 0, currentPrice: 0 });
            }
            
            setTimeout(() => {
                setPurchaseModalVisible(true);
            }, 100);
        } catch (error: any) {
            if (__DEV__) {
                console.error('[ClassStreamsScreen] Error fetching stream details:', error);
            }
            
            // On error, check status from original stream data
            const statusInfo = getStreamStatus(stream);
            const isLive = statusInfo.label === 'LIVE';
            const isUpcoming = statusInfo.label === 'UPCOMING';
            
            hideLoader();
            setIsCheckingStream(false);
            
            // Only show modal - never navigate directly on error
            // This ensures user sees purchase option or stream info
            setSelectedStream(stream);
            // Small delay to ensure loader is hidden before showing modal
            setTimeout(() => {
                setPurchaseModalVisible(true);
            }, 100);
        }
    }, [navigation, isCheckingStream, showLoader, hideLoader, activeTab]);

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
        // Reset checking state when modal closes
        setIsCheckingStream(false);
        setPurchaseModalVisible(false);
        setSelectedStream(null);
        setCourseDetails(null);
        setCoursePricing(null);
    }, []);

    const handleBuyNow = useCallback(() => {
        if (!selectedStream) {
            if (__DEV__) {
                console.warn('[ClassStreamsScreen] No stream selected for purchase');
            }
            return;
        }

        try {
            // Extract courseId from stream - try multiple possible locations
            const streamWithSelections = selectedStream as any;
            let courseIdFromStream: string | undefined;
            
            // Try courseSelections first (most common structure)
            if (streamWithSelections.courseSelections?.[0]?.course?._id) {
                courseIdFromStream = streamWithSelections.courseSelections[0].course._id;
            }
            // Try direct courseId (string)
            else if (typeof selectedStream.courseId === 'string' && selectedStream.courseId) {
                courseIdFromStream = selectedStream.courseId;
            }
            // Try courseId as object with _id
            else if (selectedStream.courseId && typeof selectedStream.courseId === 'object' && (selectedStream.courseId as any)?._id) {
                courseIdFromStream = (selectedStream.courseId as any)._id;
            }
            // Fallback to route params courseId
            else if (courseId) {
                courseIdFromStream = courseId;
            }

            if (!courseIdFromStream) {
                if (__DEV__) {
                    console.error('[ClassStreamsScreen] Could not extract courseId from stream:', selectedStream);
                }
                // Show error or fallback behavior
                return;
            }

            // Close modal first for smooth transition
            setPurchaseModalVisible(false);
            
            // Get pricing from course details or use defaults
            const pricing = coursePricing || { originalPrice: 0, currentPrice: 0 };
            
            // Add small delay to ensure modal closes smoothly before navigation
            setTimeout(() => {
                try {
                    // Navigate to PaymentCheckout with pricing from course details
                    navigation.navigate('PaymentCheckout', {
                        courseId: courseIdFromStream,
                        originalPrice: pricing.originalPrice,
                        currentPrice: pricing.currentPrice,
                        // packageId is optional, can be added if needed
                    });
                } catch (navError) {
                    if (__DEV__) {
                        console.error('[ClassStreamsScreen] Navigation error:', navError);
                    }
                    // Fallback: try navigating to CourseDetails if PaymentCheckout fails
                    try {
                        navigation.navigate('CourseDetails', { courseId: courseIdFromStream });
                    } catch (fallbackError) {
                        if (__DEV__) {
                            console.error('[ClassStreamsScreen] Fallback navigation also failed:', fallbackError);
                        }
                    }
                }
            }, 100); // Small delay for smooth modal close animation
        } catch (error) {
            if (__DEV__) {
                console.error('[ClassStreamsScreen] Error in handleBuyNow:', error);
            }
            // Ensure modal is closed even on error
            setPurchaseModalVisible(false);
        }
    }, [selectedStream, navigation, courseId, coursePricing]);

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

    // Animated Empty State SVG Component
    const EmptyStateIllustration = () => {
        const rotateAnim = useRef(new Animated.Value(0)).current;
        const scaleAnim = useRef(new Animated.Value(1)).current;
        const opacityAnim = useRef(new Animated.Value(0.8)).current;
        const translateYAnim = useRef(new Animated.Value(0)).current;
        const pulseAnim = useRef(new Animated.Value(0)).current;

        useEffect(() => {
            // Radio wave rotation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(rotateAnim, {
                        toValue: 1,
                        duration: 3000,
                        easing: Easing.linear,
                        useNativeDriver: true,
                    }),
                    Animated.timing(rotateAnim, {
                        toValue: 0,
                        duration: 0,
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            // Pulsing effect
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 2000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 0,
                        duration: 2000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            // Scale animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scaleAnim, {
                        toValue: 1.15,
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

            // Opacity animation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(opacityAnim, {
                        toValue: 0.3,
                        duration: 2000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(opacityAnim, {
                        toValue: 0.9,
                        duration: 2000,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();

            // Vertical translation
            Animated.loop(
                Animated.sequence([
                    Animated.timing(translateYAnim, {
                        toValue: 1,
                        duration: 2500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(translateYAnim, {
                        toValue: 0,
                        duration: 2500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }, []);

        const rotateInterpolate = rotateAnim.interpolate({
            inputRange: [0, 1],
            outputRange: ['0deg', '360deg'],
        });

        const pulseScale = pulseAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [1, 1.3],
        });

        const pulseOpacity = pulseAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0.4, 1],
        });

        const translateYInterpolate = translateYAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, moderateScale(10)],
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
                        {/* Background circle */}
                        <Circle
                            cx="100"
                            cy="100"
                            r="85"
                            fill="#E3F2FD"
                            opacity="0.3"
                        />
                        
                        {/* Radio/TV icon base */}
                        <G transform="translate(60, 60)">
                            <Rect
                                x="20"
                                y="20"
                                width="40"
                                height="50"
                                fill="#1976D2"
                                rx="3"
                            />
                            <Rect
                                x="25"
                                y="30"
                                width="30"
                                height="25"
                                fill="#0D47A1"
                                rx="2"
                            />
                            {/* Screen lines */}
                            <Rect x="27" y="32" width="26" height="2" fill="#64B5F6" />
                            <Rect x="27" y="36" width="26" height="2" fill="#64B5F6" />
                            <Rect x="27" y="40" width="20" height="2" fill="#64B5F6" />
                            <Rect x="27" y="44" width="26" height="2" fill="#64B5F6" />
                            {/* Antenna base */}
                            <Rect
                                x="38"
                                y="10"
                                width="4"
                                height="10"
                                fill="#1976D2"
                            />
                        </G>
                    </Svg>
                    
                    {/* Animated radio waves */}
                    <Animated.View
                        style={{
                            position: 'absolute',
                            left: moderateScale(100),
                            top: moderateScale(100),
                            transform: [{ rotate: rotateInterpolate }],
                            transformOrigin: '0 0',
                        }}
                    >
                        <Svg width={moderateScale(200)} height={moderateScale(200)}>
                            <G transform="translate(0, 0)">
                                <Circle
                                    cx={moderateScale(0)}
                                    cy={moderateScale(0)}
                                    r={moderateScale(30)}
                                    fill="none"
                                    stroke="#2196F3"
                                    strokeWidth={moderateScale(2)}
                                    opacity="0.6"
                                />
                                <Circle
                                    cx={moderateScale(0)}
                                    cy={moderateScale(0)}
                                    r={moderateScale(50)}
                                    fill="none"
                                    stroke="#2196F3"
                                    strokeWidth={moderateScale(2)}
                                    opacity="0.4"
                                />
                                <Circle
                                    cx={moderateScale(0)}
                                    cy={moderateScale(0)}
                                    r={moderateScale(70)}
                                    fill="none"
                                    stroke="#2196F3"
                                    strokeWidth={moderateScale(2)}
                                    opacity="0.2"
                                />
                            </G>
                        </Svg>
                    </Animated.View>
                    
                    {/* Pulsing center dot */}
                    <Animated.View
                        style={{
                            position: 'absolute',
                            left: moderateScale(95),
                            top: moderateScale(95),
                            transform: [{ scale: pulseScale }],
                            opacity: pulseOpacity,
                        }}
                    >
                        <Svg width={moderateScale(10)} height={moderateScale(10)}>
                            <Circle
                                cx={moderateScale(5)}
                                cy={moderateScale(5)}
                                r={moderateScale(5)}
                                fill="#2196F3"
                            />
                        </Svg>
                    </Animated.View>
                    
                    {/* Animated play icon */}
                    <Animated.View
                        style={{
                            position: 'absolute',
                            left: moderateScale(90),
                            top: moderateScale(90),
                            transform: [
                                { scale: scaleAnim },
                                { translateY: translateYInterpolate },
                            ],
                            opacity: opacityAnim,
                        }}
                    >
                        <Svg width={moderateScale(20)} height={moderateScale(20)}>
                            <Circle
                                cx={moderateScale(10)}
                                cy={moderateScale(10)}
                                r={moderateScale(10)}
                                fill="#FF5722"
                            />
                            <Path
                                d={`M ${moderateScale(7)} ${moderateScale(6)} L ${moderateScale(7)} ${moderateScale(14)} L ${moderateScale(14)} ${moderateScale(10)} Z`}
                                fill="#FFFFFF"
                            />
                        </Svg>
                    </Animated.View>
                    
                    {/* Floating signal bars */}
                    <Animated.View
                        style={{
                            position: 'absolute',
                            left: moderateScale(50),
                            top: moderateScale(50),
                            opacity: opacityAnim,
                            transform: [{ translateY: translateYInterpolate }],
                        }}
                    >
                        <Svg width={moderateScale(12)} height={moderateScale(12)}>
                            <Rect
                                x={moderateScale(0)}
                                y={moderateScale(8)}
                                width={moderateScale(3)}
                                height={moderateScale(4)}
                                fill="#4CAF50"
                            />
                            <Rect
                                x={moderateScale(4)}
                                y={moderateScale(5)}
                                width={moderateScale(3)}
                                height={moderateScale(7)}
                                fill="#4CAF50"
                            />
                            <Rect
                                x={moderateScale(8)}
                                y={moderateScale(2)}
                                width={moderateScale(3)}
                                height={moderateScale(10)}
                                fill="#4CAF50"
                            />
                        </Svg>
                    </Animated.View>
                </View>
            </View>
        );
    };

    // Memoize empty component
    const renderEmptyComponent = useMemo(() => (
        <View style={styles.emptyCardContainer}>
            <View style={[styles.emptyCard, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
                <View style={styles.emptyCardContent}>
                    <EmptyStateIllustration />
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
                ) : streams.length === 0 ? (
                    <View style={styles.emptyContainer}>
                        {renderEmptyComponent}
                        {error && (
                            <View style={styles.errorContainer}>
                                <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
                                <TouchableOpacity
                                    onPress={fetchStreams}
                                    style={[styles.retryButton, { backgroundColor: colors.primary }]}
                                >
                                    <Text style={styles.retryText}>Retry</Text>
                                </TouchableOpacity>
                            </View>
                        )}
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
                    originalPrice={coursePricing?.originalPrice || 0}
                    currentPrice={coursePricing?.currentPrice || 0}
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
    emptyIllustrationContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: getSpacing(2),
    },
    emptyCardTitle: {
        fontSize: moderateScale(18),
        fontFamily: getFontFamily('700'),
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: getSpacing(2),
    },
    errorContainer: {
        marginTop: getSpacing(3),
        alignItems: 'center',
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
        fontFamily: getFontFamily('600'),
    },
});

export default ClassStreamsScreen;

