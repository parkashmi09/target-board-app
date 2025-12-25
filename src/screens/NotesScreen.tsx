import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../theme/theme';
import { moderateScale, getSpacing } from '../utils/responsive';
import ResponsiveView from '../components/ResponsiveView';
import GradientBackground from '../components/GradientBackground';

const NotesScreen: React.FC = () => {
  const theme = useTheme();

  return (
    <GradientBackground>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ResponsiveView padding={2}>
          <Text
            style={[
              styles.title,
              {
                color: theme.colors.text,
                fontSize: moderateScale(24),
                fontFamily: theme.typography.h1.fontFamily,
              },
            ]}
          >
            Notes
          </Text>
          <Text
            style={[
              styles.subtitle,
              {
                color: theme.colors.textSecondary,
                fontSize: moderateScale(16),
                fontFamily: theme.typography.body.fontFamily,
              },
            ]}
          >
            Your notes and study materials will appear here
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
  scrollContent: {
    flexGrow: 1,
  },
  title: {
    fontWeight: '800',
    marginTop: getSpacing(2),
    marginBottom: getSpacing(1),
  },
  subtitle: {
    marginTop: getSpacing(1),
  },
});

export default NotesScreen;

