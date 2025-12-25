import React from 'react';
import { View, StyleSheet, Text, Dimensions } from 'react-native';
import RenderHtml from 'react-native-render-html';
import { Hand } from 'lucide-react-native';
import { useTheme } from '../../theme/theme';

interface CourseDescriptionProps {
  description?: string;
  originalPrice: number;
  currentPrice: number;
  className?: string;
}

const CourseDescription: React.FC<CourseDescriptionProps> = React.memo(({
  description,
  originalPrice,
  currentPrice,
  className,
}) => {
  const theme = useTheme();

  if (!description) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Hand size={24} color="#FFC107" style={{ transform: [{ rotate: '90deg' }] }} />
        <Text style={[styles.headerText, { color: theme.colors.text }]}>
          {className || 'Class'} Fee - <Text style={[styles.strikeThrough, { color: theme.colors.textSecondary }]}>₹{originalPrice}</Text> ₹{currentPrice}
        </Text>
      </View>

      <View style={[styles.divider, { borderColor: theme.colors.border }]} />
      <View style={[styles.divider, { marginTop: 2, borderColor: theme.colors.border }]} />

      <View style={styles.details}>
        <RenderHtml
          contentWidth={Dimensions.get('window').width - 32}
          source={{ html: description }}
          tagsStyles={{
            body: {
              color: theme.colors.text,
              fontSize: 14,
              lineHeight: 22,
            },
            p: {
              color: theme.colors.text,
              marginBottom: 8,
            },
            li: {
              color: theme.colors.text,
              marginBottom: 4,
            },
            a: {
              color: theme.colors.accent,
            },
          }}
        />
      </View>
    </View>
  );
});

CourseDescription.displayName = 'CourseDescription';

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  strikeThrough: {
    textDecorationLine: 'line-through',
    fontWeight: '400',
  },
  divider: {
    height: 1,
    width: '100%',
    backgroundColor: '#E0E0E0',
    borderStyle: 'dashed',
    borderWidth: 1,
  },
  details: {
    marginTop: 12,
  },
});

export default CourseDescription;

