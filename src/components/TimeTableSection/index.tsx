import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { CalendarDays } from 'lucide-react-native';
import { useTheme } from '../../theme/theme';

interface TimeTableSectionProps {
  timetableUrl?: string;
}

const TimeTableSection: React.FC<TimeTableSectionProps> = React.memo(({ timetableUrl }) => {
  const theme = useTheme();

  if (!timetableUrl) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <CalendarDays size={20} color={theme.colors.text} />
        <Text style={[styles.headerText, { color: theme.colors.text }]}>Time Table</Text>
      </View>
      <Image
        source={{ uri: timetableUrl }}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
});

TimeTableSection.displayName = 'TimeTableSection';

const styles = StyleSheet.create({
  container: {
    marginBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerText: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
});

export default TimeTableSection;

