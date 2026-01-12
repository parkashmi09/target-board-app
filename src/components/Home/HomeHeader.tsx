import React, { memo, useRef, useState, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import notificationAnimation from '../../assets/lotties/notification.json';
import downloadAnimation from '../../assets/lotties/download.json';
import SVGIcon from '../SVGIcon';
import { moderateScale, getSpacing } from '../../utils/responsive';
import { getFontFamily } from '../../utils/fonts';
import { Theme } from '../../theme/theme';
import { Images } from '../../assets/images';
import { useToast } from '../Toast';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface HomeHeaderProps {
    theme: Theme;
    setDrawerOpen: (open: boolean) => void;
    classes: Array<{ label: string; value: string | number }>;
    categoryId: string | number | null;
    boardName?: string;
    className?: string;
    logo?: string;
}

const HomeHeader = memo(({
    theme,
    setDrawerOpen,
    classes,
    categoryId,
    boardName,
    className,
    logo,
}: HomeHeaderProps) => {
    const { top } = useSafeAreaInsets();
    const navigation = useNavigation<any>();
    const toast = useToast();
    const lottieRef = useRef<LottieView>(null);
    const iconColor = theme.isDark ? theme.colors.accent : theme.colors.text;
    const [unreadCount, setUnreadCount] = useState(0);

    // Load unread count
    const loadUnreadCount = useCallback(async () => {
        try {
            const stored = await AsyncStorage.getItem('@notifications');
            const readIds = await AsyncStorage.getItem('@read_notifications');
            const readSet = readIds ? new Set(JSON.parse(readIds)) : new Set();

            if (stored) {
                const notifications = JSON.parse(stored);
                const unread = notifications.filter((n: any) => !readSet.has(n.id));
                setUnreadCount(unread.length);
            }
        } catch (error) {
            if (__DEV__) {
                console.error('Error loading unread count:', error);
            }
        }
    }, []);

    // Update unread count when screen is focused
    useFocusEffect(
        useCallback(() => {
            loadUnreadCount();
        }, [loadUnreadCount])
    );

    useEffect(() => {
        loadUnreadCount();
        // Listen for notification updates
        const interval = setInterval(loadUnreadCount, 5000);
        return () => clearInterval(interval);
    }, [loadUnreadCount]);

    const handleNotificationPress = () => {
        lottieRef.current?.play();
        navigation.navigate('Notifications');
    };

    const selectedClass = classes.find(c => String(c.value) === String(categoryId));
    const displayClass = className || (selectedClass ? selectedClass.label : 'Select Class');
    const displayBoard = boardName || '';

    return (
        <View
            style={[
                styles.customHeader,
                {
                    backgroundColor: theme.isDark ? theme.colors.background : 'transparent',
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                    paddingTop: top + getSpacing(1.5),
                },
            ]}
        >
            <View style={styles.headerContent}>
                <View style={styles.leftContent}>
                    <TouchableOpacity
                        onPress={() => setDrawerOpen(true)}
                        style={styles.menuButton}
                        activeOpacity={0.7}
                    >
                        <SVGIcon
                            name="menu"
                            size={moderateScale(24)}
                            color={theme.colors.text}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => navigation.navigate('ChooseBoardClass')}
                        style={[
                            styles.selectionButton,
                            {
                                backgroundColor: theme.isDark ? theme.colors.cardBackground : theme.colors.background,
                                borderColor: theme.colors.border,
                            }
                        ]}
                        activeOpacity={0.7}
                    >
                        <View style={styles.selectionContent}>
                            {logo ? (
                                <Image
                                    source={{ uri: logo }}
                                    style={styles.boardLogo}
                                    resizeMode="contain"
                                />
                            ) : (
                                <Image
                                    source={Images.TB_LOGO}
                                    style={styles.boardLogo}
                                    resizeMode="contain"
                                />
                            )}
                            <View style={styles.textContainer}>
                                <Text style={[styles.classText, { color: theme.colors.text }]} numberOfLines={1}>
                                    {displayClass}
                                </Text>
                                {displayBoard ? (
                                    <Text style={[styles.boardText, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                                        {displayBoard}
                                    </Text>
                                ) : null}
                            </View>
                            <ChevronRight size={16} color={theme.colors.textSecondary} />
                        </View>
                    </TouchableOpacity>
                </View>

                {/* Right Side - Icons */}
                <View style={styles.rightIconsContainer}>
                    {/* <TouchableOpacity
                        style={styles.iconButton}
                        activeOpacity={0.7}
                        onPress={() => {
                            // Navigate to Downloads screen
                            (navigation as any).navigate('Downloads');
                        }}
                    >
                        <LottieView
                            source={downloadAnimation}
                            style={{ width: moderateScale(28), height: moderateScale(28) }}
                            loop={true}
                            autoPlay={true}
                            colorFilters={[
                                {
                                    keypath: "**",
                                    color: iconColor,
                                },
                            ]}
                        />
                    </TouchableOpacity> */}

                    <TouchableOpacity
                        style={styles.iconButton}
                        activeOpacity={0.7}
                        onPress={handleNotificationPress}
                    >
                        <View>
                            {theme.isDark ? (
                                <Image
                                    source={Images.DARK_BELL}
                                    style={styles.bellIcon}
                                    resizeMode="contain"
                                />
                            ) : (
                                <LottieView
                                    ref={lottieRef}
                                    source={notificationAnimation}
                                    style={{ width: moderateScale(28), height: moderateScale(28) }}
                                    loop={false}
                                    autoPlay={false}
                                    colorFilters={[
                                        {
                                            keypath: "**",
                                            color: theme.colors.text,
                                        },
                                    ]}
                                />
                            )}
                            {unreadCount > 0 && (
                                <View style={[styles.badge, { backgroundColor: '#FF4444' }]}>
                                    <Text style={styles.badgeText}>
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
});

const styles = StyleSheet.create({
    customHeader: {
        paddingBottom: getSpacing(1.5),
        paddingHorizontal: getSpacing(2),
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 2,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: moderateScale(20),
    },
    leftContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    menuButton: {
        width: moderateScale(40),
        height: moderateScale(40),
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectionButton: {
        flex: 0.8,
        marginHorizontal: getSpacing(2),
        height: moderateScale(42),
        borderRadius: moderateScale(8),
        borderWidth: 1,
        justifyContent: 'center',
        paddingHorizontal: getSpacing(1.5),
    },
    selectionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    boardLogo: {
        width: moderateScale(28),
        height: moderateScale(28),
        marginRight: getSpacing(1),
    },
    textContainer: {
        flex: 1,
        justifyContent: 'center',
    },
    classText: {
        fontSize: moderateScale(14),
        lineHeight: moderateScale(18),
        fontFamily: getFontFamily('600'),
    },
    boardText: {
        fontSize: moderateScale(11),
        lineHeight: moderateScale(14),
        fontFamily: getFontFamily('400'),
    },
    rightIconsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: getSpacing(1),
    },
    iconButton: {
        width: moderateScale(40),
        height: moderateScale(40),
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        position: 'absolute',
        top: -moderateScale(4),
        right: -moderateScale(4),
        minWidth: moderateScale(16),
        height: moderateScale(16),
        borderRadius: moderateScale(9),
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: moderateScale(4),
        borderWidth: 2,
        borderColor: '#FFFFFF',
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: moderateScale(10),
        fontFamily: getFontFamily('700'),
        lineHeight: moderateScale(12),
    },
    bellIcon: {
        width: moderateScale(20),
        height: moderateScale(28),
    },
});

export default HomeHeader;

