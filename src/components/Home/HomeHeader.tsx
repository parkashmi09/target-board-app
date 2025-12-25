import React, { memo, useRef } from 'react';
import { View, TouchableOpacity, StyleSheet, Text, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight } from 'lucide-react-native';
import LottieView from 'lottie-react-native';
import notificationAnimation from '../../assets/lotties/notification.json';
import downloadAnimation from '../../assets/lotties/download.json';
import SVGIcon from '../SVGIcon';
import { moderateScale, getSpacing } from '../../utils/responsive';
import { Theme } from '../../theme/theme';
import { Images } from '../../assets/images';
import { useToast } from '../Toast';

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

    const handleNotificationPress = () => {
        lottieRef.current?.play();
        toast.show({ text: 'Notification feature coming soon', type: 'info' });
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
        fontWeight: '600',
        lineHeight: moderateScale(18),
    },
    boardText: {
        fontSize: moderateScale(11),
        fontWeight: '400',
        lineHeight: moderateScale(14),
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
});

export default HomeHeader;

