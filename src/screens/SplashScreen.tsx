import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme/theme';
import { moderateScale, getSpacing } from '../utils/responsive';

const SplashScreen: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}> 
      <View style={styles.logoWrap}>
        <Image
          source={require('../assets/images/tblogo.webp')}
          style={{ width: moderateScale(110), height: moderateScale(110) }}
          resizeMode="contain"
        />
      </View>
      <Text
        style={[
          styles.tagline,
          {
            color: theme.colors.text,
            fontSize: moderateScale(14),
            fontFamily: theme.typography.body.fontFamily,
          },
        ]}
      >
        Empowering Students for 9th–12th Board Success
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: getSpacing(2),
  },
  tagline: {
    textAlign: 'center',
  },
});

export default SplashScreen;

