import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme/theme';
import { getSpacing, moderateScale } from '../utils/responsive';
import ResponsiveView from '../components/ResponsiveView';
import GradientBackground from '../components/GradientBackground';

const TestsScreen: React.FC = () => {
  const { t } = useTranslation();
  const theme = useTheme();

  return (
    <GradientBackground>
      <ScrollView
        style={styles.container}
      >
        <ResponsiveView padding={2}>
          <Text
            style={[
              styles.title,
              {
                color: theme.colors.text,
                fontSize: moderateScale(24),
              },
            ]}
          >
            {t('features.quizTest')}
          </Text>
        </ResponsiveView>
      </ScrollView>
    </GradientBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontWeight: 'bold',
    marginTop: getSpacing(2),
  },
});

export default TestsScreen;

