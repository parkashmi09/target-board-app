import React from 'react';
import { View, StyleSheet, StatusBar, ViewStyle } from 'react-native';
import { Svg, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { useTheme } from '../../theme/theme';

interface GradientBackgroundProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

const GradientBackground: React.FC<GradientBackgroundProps> = ({ children, style }) => {
    const theme = useTheme();

    return (
        <View style={[styles.container, style]}>
            <StatusBar
                translucent
                backgroundColor="transparent"
                barStyle={theme.isDark ? 'light-content' : 'dark-content'}
            />
            {!theme.isDark && (
                <View style={StyleSheet.absoluteFill}>
                    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
                        <Defs>
                            <LinearGradient id="appBackgroundGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <Stop offset="0%" stopColor="#FFF176" stopOpacity="1" />
                                <Stop offset="30%" stopColor="#FFF9C4" stopOpacity="1" />
                                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="1" />
                            </LinearGradient>
                        </Defs>
                        <Rect width="100%" height="100%" fill="url(#appBackgroundGradient)" />
                    </Svg>
                </View>
            )}
            <View style={[styles.content, { backgroundColor: theme.isDark ? theme.colors.background : 'transparent' }]}>
                {children}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
});

export default GradientBackground;
