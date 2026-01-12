import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FileText } from 'lucide-react-native';
import { useTheme } from '../../theme/theme';
import { moderateScale } from '../../utils/responsive';
import { getFontFamily } from '../../utils/fonts';

interface BatchInfoCardProps {
  batchInfoUrl?: string;
  onPress: () => void;
}

const BatchInfoCard: React.FC<BatchInfoCardProps> = React.memo(({ batchInfoUrl, onPress }) => {
  const theme = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.cardBackground,
          shadowColor: theme.colors.cardShadow,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <FileText size={24} color="#FFFFFF" />
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Batch Information</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Click Here to View Batch Details</Text>
      </View>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
        onPress={onPress}
      >
        <Text style={[styles.buttonText, { color: theme.colors.text }]}>Click Here</Text>
      </TouchableOpacity>

    </TouchableOpacity>
  );
});

BatchInfoCard.displayName = 'BatchInfoCard';

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: moderateScale(8),
    marginBottom: moderateScale(20),
    elevation: 2,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  iconContainer: {
    width: moderateScale(40),
    height: moderateScale(40),
    borderRadius: moderateScale(12),
    backgroundColor: '#3F51B5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: moderateScale(16),
    elevation: 2,
    shadowColor: '#3F51B5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: moderateScale(12),
    fontFamily: getFontFamily('700'),
    marginBottom: moderateScale(4),
    textAlign: 'center',
  },
  subtitle: {
    fontSize: moderateScale(10),
    fontFamily: getFontFamily('500'),
    textAlign: 'center',
  },
  button: {
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(16),
    borderRadius: moderateScale(8),
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: moderateScale(12),
    fontFamily: getFontFamily('700'),
    color: '#FFFFFF',
  },
});

export default BatchInfoCard;

