import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { FileText } from 'lucide-react-native';
import { useTheme } from '../../theme/theme';

interface BatchInfoCardProps {
  batchInfoUrl?: string;
  onPress: () => void;
}

const BatchInfoCard: React.FC<BatchInfoCardProps> = React.memo(({ batchInfoUrl, onPress }) => {
  const theme = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
      <View style={styles.iconBox}>
        <FileText size={20} color="#D32F2F" />
        <Text style={styles.iconText}>PDF</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.colors.text }]}>Batch Information</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Click button to view batch information</Text>
      </View>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}
        onPress={onPress}
      >
        <Text style={[styles.buttonText, { color: theme.colors.text }]}>Click Here</Text>
      </TouchableOpacity>
    </View>
  );
});

BatchInfoCard.displayName = 'BatchInfoCard';

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    marginBottom: 24,
    borderWidth: 1,
    elevation: 1,
  },
  iconBox: {
    alignItems: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 10,
    color: '#D32F2F',
    fontWeight: '700',
    marginTop: 2,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
  },
  buttonText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default BatchInfoCard;

