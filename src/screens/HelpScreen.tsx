import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Linking,
    ScrollView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import LottieView from 'lottie-react-native';
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

    const handleCall = () => {
        const phoneNumber = '1234567890'; // Replace with actual number
        Linking.openURL(`tel:${phoneNumber}`);
    };

    const handleWhatsApp = () => {
        const phoneNumber = '1234567890'; // Replace with actual number
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

    return (
        <GradientBackground>
            <View style={styles.container}>
                <ScreenHeader showSearch={false} title={t('drawer.help') || 'Help & Support'} />

                <ScrollView contentContainerStyle={styles.content}>
                    <View style={styles.illustrationContainer}>
                        <LottieView
                            source={supportAnimation}
                            style={styles.lottie}
                            autoPlay
                            loop
                        />
                        <Text style={[styles.mainTitle, { color: theme.colors.text }]}>
                            {t('help.howCanWeHelp') || 'How can we help you?'}
                        </Text>
                        <Text style={[styles.subTitle, { color: theme.colors.textSecondary }]}>
                            {t('help.subtitle') || 'Our team is available to assist you with any questions or issues.'}
                        </Text>
                    </View>

                    <View style={styles.contactSection}>
                        <TouchableOpacity
                            style={[styles.contactCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}
                            onPress={handleCall}
                            activeOpacity={0.9}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
                                <SVGIcon name="phone" size={moderateScale(28)} color="#2196F3" />
                            </View>
                            <View style={styles.cardContent}>
                                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                                    {t('help.callUs') || 'Call Us'}
                                </Text>
                                <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                                    +91 1234567890
                                </Text>
                            </View>
                            <SVGIcon name="chevron-right" size={moderateScale(20)} color={theme.colors.textSecondary} />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.contactCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}
                            onPress={handleWhatsApp}
                            activeOpacity={0.9}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
                                <SVGIcon name="whatsapp" size={moderateScale(28)} color="#4CAF50" />
                            </View>
                            <View style={styles.cardContent}>
                                <Text style={[styles.cardTitle, { color: theme.colors.text }]}>
                                    {t('help.whatsapp') || 'WhatsApp'}
                                </Text>
                                <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
                                    {t('help.chatWithUs') || 'Chat with us'}
                                </Text>
                            </View>
                            <SVGIcon name="chevron-right" size={moderateScale(20)} color={theme.colors.textSecondary} />
                        </TouchableOpacity>
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
    },
    illustrationContainer: {
        alignItems: 'center',
        marginBottom: getSpacing(4),
    },
    mainTitle: {
        fontSize: moderateScale(22),
        fontWeight: 'bold',
        marginTop: getSpacing(2),
        textAlign: 'center',
    },
    subTitle: {
        fontSize: moderateScale(14),
        marginTop: getSpacing(1),
        textAlign: 'center',
        paddingHorizontal: getSpacing(2),
        lineHeight: moderateScale(20),
    },
    contactSection: {
        gap: getSpacing(2),
    },
    contactCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: getSpacing(2),
        borderRadius: moderateScale(16),
        borderWidth: 1,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    iconCircle: {
        width: moderateScale(56),
        height: moderateScale(56),
        borderRadius: moderateScale(28),
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: getSpacing(2),
    },
    cardContent: {
        flex: 1,
    },
    cardTitle: {
        fontSize: moderateScale(16),
        fontWeight: '700',
        marginBottom: moderateScale(4),
    },
    cardSubtitle: {
        fontSize: moderateScale(14),
    },
    lottie: {
        width: moderateScale(280),
        height: moderateScale(280),
    },
});

export default HelpScreen;

