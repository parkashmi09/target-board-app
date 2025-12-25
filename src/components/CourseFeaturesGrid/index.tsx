import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Play, FileText, FileDown, MonitorPlay, ClipboardList, Award } from 'lucide-react-native';
import { useTheme } from '../../theme/theme';

interface CourseFeaturesGridProps {
  features: {
    live?: boolean;
    video?: boolean;
    notes?: boolean;
    panelPdf?: boolean;
    topper?: boolean;
    test?: boolean;
  };
}

const CourseFeaturesGrid: React.FC<CourseFeaturesGridProps> = React.memo(({ features }) => {
  const theme = useTheme();

  return (
    <View style={styles.grid}>
      {features.live && (
        <View style={[styles.card, { backgroundColor: theme.isDark ? 'rgba(33, 150, 243, 0.2)' : '#E3F2FD' }]}>
          <View style={styles.content}>
            <MonitorPlay size={24} color="#D32F2F" />
            <Text style={[styles.title, { color: theme.colors.text }]}>LIVE</Text>
          </View>
        </View>
      )}

      {features.video && (
        <View style={[styles.card, { backgroundColor: theme.isDark ? 'rgba(0, 150, 136, 0.2)' : '#E0F2F1' }]}>
          <View style={styles.content}>
            <View style={styles.videoIconCircle}>
              <Play size={16} color="#FFFFFF" fill="#FFFFFF" style={{ marginLeft: 2 }} />
            </View>
            <View style={{ marginLeft: 8 }}>
              <Text style={[styles.title, { color: theme.colors.text }]}>VIDEO</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Recorded class</Text>
            </View>
          </View>
        </View>
      )}

      {features.notes && (
        <View style={[styles.card, { backgroundColor: theme.isDark ? 'rgba(3, 169, 244, 0.2)' : '#E1F5FE' }]}>
          <View style={styles.content}>
            <FileText size={24} color="#D32F2F" />
            <View style={{ marginLeft: 8 }}>
              <Text style={[styles.title, { color: theme.colors.text }]}>NOTES</Text>
            </View>
          </View>
        </View>
      )}

      {features.panelPdf && (
        <View style={[styles.card, { backgroundColor: theme.isDark ? 'rgba(3, 169, 244, 0.2)' : '#E1F5FE' }]}>
          <View style={styles.content}>
            <FileDown size={24} color="#D32F2F" />
            <View style={{ marginLeft: 8 }}>
              <Text style={[styles.title, { color: theme.colors.text }]}>PANEL</Text>
              <Text style={[styles.title, { color: theme.colors.text }]}>PDF</Text>
            </View>
          </View>
        </View>
      )}

      {features.topper && (
        <View style={[styles.card, { backgroundColor: theme.isDark ? 'rgba(255, 193, 7, 0.2)' : '#FFF8E1' }]}>
          <View style={styles.content}>
            <Award size={24} color="#FFA000" />
            <View style={{ marginLeft: 8 }}>
              <Text style={[styles.title, { color: theme.colors.text }]}>TOPPER</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Talks</Text>
            </View>
          </View>
        </View>
      )}

      {features.test && (
        <View style={[styles.card, { backgroundColor: theme.isDark ? 'rgba(33, 150, 243, 0.2)' : '#E3F2FD' }]}>
          <View style={styles.content}>
            <ClipboardList size={24} color="#FBC02D" />
            <View style={{ marginLeft: 8 }}>
              <Text style={[styles.title, { color: theme.colors.text }]}>TEST</Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>Chapter Wise</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
});

CourseFeaturesGrid.displayName = 'CourseFeaturesGrid';

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  card: {
    width: '32%',
    borderRadius: 8,
    padding: 8,
    minHeight: 60,
    justifyContent: 'center',
    elevation: 2,
    marginBottom: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  videoIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#757575',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 10,
  },
});

export default CourseFeaturesGrid;

