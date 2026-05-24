import { StyleSheet, View } from 'react-native';

import { CalendarToolbar } from '@/components/calendar/calendar-toolbar';
import { MoonMark } from '@/components/calendar/moon-mark';
import { AppText } from '@/components/ui/app-text';
import { spacing } from '@/constants/theme';

type CalendarHeaderProps = {
  dateLabel: string;
};

export function CalendarHeader({ dateLabel }: CalendarHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.left}>
        <MoonMark />
        <AppText style={styles.date}>{dateLabel}</AppText>
      </View>
      <CalendarToolbar />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minHeight: 58,
    paddingBottom: spacing[1],
  },
  left: {
    gap: spacing[1],
  },
  date: {
    marginLeft: spacing[7],
    fontSize: 16,
    lineHeight: 29,
    fontWeight: '400',
  },
});
