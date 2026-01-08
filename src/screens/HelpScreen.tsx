import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Linking,
    ScrollView,
    Animated,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import LottieView from 'lottie-react-native';
import { Svg, Defs, LinearGradient, Stop, Rect, Circle } from 'react-native-svg';
import { useTheme } from '../theme/theme';
import { moderateScale, getSpacing } from '../utils/responsive';
import SVGIcon from '../components/SVGIcon';
import GradientBackground from '../components/GradientBackground';
import ScreenHeader from '../components/ScreenHeader';
import supportAnimation from '../assets/lotties/support.json';

const HelpScreen: React.FC = () => {
    const theme = useTheme();
    const { t } = useTranslation();
    const navigation = useNavigation<any>();
    const scaleAnim = React.useRef(new Animated.Value(1)).current;

    const handleCall = () => {
        const phoneNumber = '8114532021'; // Replace with actual number
        Linking.openURL(`tel:${phoneNumber}`);
    };

    const handleWhatsApp = () => {
        const phoneNumber = '8114532021'; // Replace with actual number
        const message = 'Hello, I need help with the app.';
        const url = `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(message)}`;

        Linking.canOpenURL(url).then(supported => {
            if (supported) {
                return Linking.openURL(url);
            } else {
                return Linking.openURL(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`);
            }
        }).catch(err => {
            if (__DEV__) {
                console.error('An error occurred', err);
            }
        });
    };

    const handlePressIn = () => {
        Animated.spring(scaleAnim, {
            toValue: 0.95,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            useNativeDriver: true,
        }).start();
    };

    return (
        <GradientBackground>
            <View style={styles.container}>
                <ScreenHeader showSearch={false} title={t('drawer.help') || 'Help & Support'} />

                <ScrollView 
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Hero Section with Illustration */}
                    <View style={styles.heroSection}>
                        <View style={styles.illustrationWrapper}>
                            <View style={styles.decorativeCircle1} />
                            <View style={styles.decorativeCircle2} />
                            <LottieView
                                source={supportAnimation}
                                style={styles.lottie}
                                autoPlay
                                loop
                            />
                        </View>
                        <View style={styles.textContainer}>
                            <Text style={[styles.mainTitle, { color: theme.colors.text }]}>
                                {t('help.howCanWeHelp') || 'How can we help you?'}
                            </Text>
                            <Text style={[styles.subTitle, { color: theme.colors.textSecondary }]}>
                                {t('help.subtitle') || 'We are here to help you!'}
                            </Text>
                        </View>
                    </View>

                    {/* Contact Cards Section */}
                    <View style={styles.contactSection}>
                        {/* Call Us Card with Gradient */}
                        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                            <TouchableOpacity
                                style={styles.contactCard}
                                onPress={handleCall}
                                onPressIn={handlePressIn}
                                onPressOut={handlePressOut}
                                activeOpacity={1}
                            >
                                {/* Gradient Background */}
                                <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius: moderateScale(20) }]}>
                                    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
                                        <Defs>
                                            <LinearGradient id="callGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <Stop offset="0%" stopColor="#E3F2FD" stopOpacity="1" />
                                                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
                                            </LinearGradient>
                                        </Defs>
                                        <Rect width="100%" height="100%" fill="url(#callGradient)" rx={moderateScale(20)} />
                                    </Svg>
                                </View>

                                {/* Content */}
                                <View style={styles.cardInner}>
                                    <View style={[styles.iconCircle, styles.callIconCircle]}>
                                        <View style={styles.iconCircleInner}>
                                            <SVGIcon name="phone" size={moderateScale(32)} color="#2196F3" />
                                        </View>
                                    </View>
                                    <View style={styles.cardContent}>
                                        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                                            {t('help.callUs') || 'Call Us'}
                                        </Text>
                                        <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                                        8114532021
                                        </Text>
                                    </View>
                                    <View style={styles.chevronContainer}>
                                        <SVGIcon name="chevron-right" size={moderateScale(24)} color={theme.colors.accent} />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </Animated.View>

                        {/* WhatsApp Card with Gradient */}
                        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                            <TouchableOpacity
                                style={styles.contactCard}
                                onPress={handleWhatsApp}
                                onPressIn={handlePressIn}
                                onPressOut={handlePressOut}
                                activeOpacity={1}
                            >
                                {/* Gradient Background */}
                                <View style={[StyleSheet.absoluteFill, { overflow: 'hidden', borderRadius: moderateScale(20) }]}>
                                    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
                                        <Defs>
                                            <LinearGradient id="whatsappGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                                <Stop offset="0%" stopColor="#E8F5E9" stopOpacity="1" />
                                                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
                                            </LinearGradient>
                                        </Defs>
                                        <Rect width="100%" height="100%" fill="url(#whatsappGradient)" rx={moderateScale(20)} />
                                    </Svg>
                                </View>

                                {/* Content */}
                                <View style={styles.cardInner}>
                                    <View style={[styles.iconCircle, styles.whatsappIconCircle]}>
                                        <View style={styles.iconCircleInner}>
                                            <SVGIcon name="whatsapp" size={moderateScale(32)} color="#4CAF50" />
                                        </View>
                                    </View>
                                    <View style={styles.cardContent}>
                                        <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                                            {t('help.whatsapp') || 'WhatsApp'}
                                        </Text>
                                        <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                                            {t('help.chatWithUs') || 'Chat with us'}
                                        </Text>
                                    </View>
                                    <View style={styles.chevronContainer}>
                                        <SVGIcon name="chevron-right" size={moderateScale(24)} color={theme.colors.accent} />
                                    </View>
                                </View>
                            </TouchableOpacity>
                        </Animated.View>
                    </View>

                    {/* Additional Info Section */}
                    <View style={styles.infoSection}>
                        <View style={[styles.infoCard, { backgroundColor: theme.colors.cardBackground }]}>
                            <SVGIcon name="clock" size={moderateScale(20)} color={theme.colors.accent} />
                            <Text style={[styles.infoText, { color: theme.colors.textSecondary }]}>
                                Available 24/7 for your support
                            </Text>
                        </View>
                    </View>
                </ScrollView>
            </View>
        </GradientBackground>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flexGrow: 1,
        padding: getSpacing(3),
        paddingBottom: getSpacing(6),
    },
    heroSection: {
        alignItems: 'center',
        marginBottom: getSpacing(5),
        marginTop: getSpacing(2),
    },
    illustrationWrapper: {
        position: 'relative',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: getSpacing(3),
    },
    decorativeCircle1: {
        position: 'absolute',
        width: moderateScale(200),
        height: moderateScale(200),
        borderRadius: moderateScale(100),
        backgroundColor: 'rgba(255, 215, 0, 0.1)',
        top: moderateScale(-20),
        left: moderateScale(-20),
    },
    decorativeCircle2: {
        position: 'absolute',
        width: moderateScale(150),
        height: moderateScale(150),
        borderRadius: moderateScale(75),
        backgroundColor: 'rgba(255, 215, 0, 0.08)',
        bottom: moderateScale(-10),
        right: moderateScale(-10),
    },
    lottie: {
        width: moderateScale(280),
        height: moderateScale(280),
        zIndex: 1,
    },
    textContainer: {
        alignItems: 'center',
        paddingHorizontal: getSpacing(3),
    },
    mainTitle: {
        fontSize: moderateScale(26),
        fontWeight: '800',
        marginBottom: getSpacing(1),
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    subTitle: {
        fontSize: moderateScale(15),
        textAlign: 'center',
        lineHeight: moderateScale(22),
        paddingHorizontal: getSpacing(2),
    },
    contactSection: {
        gap: getSpacing(3),
        marginBottom: getSpacing(4),
    },
    contactCard: {
        borderRadius: moderateScale(20),
        overflow: 'hidden',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        minHeight: moderateScale(100),
    },
    cardInner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: getSpacing(3),
        position: 'relative',
        zIndex: 1,
    },
    iconCircle: {
        width: moderateScale(70),
        height: moderateScale(70),
        borderRadius: moderateScale(35),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: getSpacing(2.5),
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
    },
    callIconCircle: {
        backgroundColor: '#E3F2FD',
    },
    whatsappIconCircle: {
        backgroundColor: '#E8F5E9',
    },
    iconCircleInner: {
        width: moderateScale(60),
        height: moderateScale(60),
        borderRadius: moderateScale(30),
        backgroundColor: '#FFFFFF',
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 2,
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: moderateScale(18),
        fontWeight: '700',
        marginBottom: moderateScale(6),
        letterSpacing: -0.3,
    },
    cardSubtitle: {
        fontSize: moderateScale(14),
        lineHeight: moderateScale(20),
    },
    chevronContainer: {
        marginLeft: getSpacing(1),
    },
    infoSection: {
        marginTop: getSpacing(2),
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: getSpacing(2.5),
        borderRadius: moderateScale(16),
        gap: getSpacing(2),
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
    },
    infoText: {
        fontSize: moderateScale(13),
        flex: 1,
        lineHeight: moderateScale(18),
    },
});

export default HelpScreen;

