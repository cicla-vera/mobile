import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const days = [
  ['29', '30', '31', '1', '2', '3', '4'],
  ['5', '6', '7', '8', '9', '10', '11'],
  ['12', '13', '14', '15', '16', '17', '18'],
  ['19', '20', '21', '22', '23', '24', '25'],
  ['26', '27', '28', '29', '30', '1', '2'],
];

export default function HomePreviewRoute() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.smallMoon} />
          <Text style={styles.date}>23 de Abril</Text>
          <Link href="/" asChild>
            <Pressable style={styles.iconButton}>
              <Text style={styles.iconButtonLabel}>x</Text>
            </Pressable>
          </Link>
        </View>

        <View style={styles.calendar}>
          <View style={styles.weekRow}>
            {weekDays.map((day, index) => (
              <Text key={`${day}-${index}`} style={styles.weekDay}>
                {day}
              </Text>
            ))}
          </View>

          {days.map((row, rowIndex) => (
            <View key={`row-${rowIndex}`} style={styles.dayRow}>
              {row.map((day, dayIndex) => {
                const isFertile = rowIndex === 2 && dayIndex >= 2;
                const isToday = day === '23';
                const isMuted =
                  (rowIndex === 0 && dayIndex < 3) ||
                  (rowIndex === 4 && dayIndex > 4);

                return (
                  <View
                    key={`${rowIndex}-${day}`}
                    style={[
                      styles.dayCell,
                      isFertile && styles.fertileDay,
                      isToday && styles.today,
                    ]}
                  >
                    <Text
                      style={[
                        styles.dayLabel,
                        isFertile && styles.fertileDayLabel,
                        isToday && styles.todayLabel,
                        isMuted && styles.mutedDayLabel,
                      ]}
                    >
                      {day}
                    </Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightTitle}>
            Seus dias ferteis podem estar comecando hoje.
          </Text>
          <Text style={styles.insightText}>
            Talvez voce se sinta mais disposta e animada.
          </Text>
        </View>

        <View style={styles.periodCard}>
          <Text style={styles.periodTitle}>
            Sua proxima menstruacao sera em 20 dias.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFF5EC',
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 32,
  },
  header: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallMoon: {
    width: 18,
    height: 18,
    marginRight: 16,
    borderRadius: 9,
    backgroundColor: '#C949A8',
  },
  date: {
    flex: 1,
    color: '#141011',
    fontSize: 16,
    fontWeight: '500',
  },
  iconButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#F5E7DF',
  },
  iconButtonLabel: {
    color: '#20257B',
    fontSize: 20,
    lineHeight: 22,
  },
  calendar: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(20, 16, 17, 0.12)',
    paddingTop: 10,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  weekDay: {
    width: 28,
    color: '#141011',
    fontSize: 8,
    textAlign: 'center',
  },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  dayCell: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  dayLabel: {
    color: '#141011',
    fontSize: 8,
  },
  mutedDayLabel: {
    color: 'rgba(32, 158, 208, 0.55)',
  },
  fertileDay: {
    backgroundColor: '#F2617E',
  },
  fertileDayLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  today: {
    backgroundColor: '#D9D1CD',
  },
  todayLabel: {
    color: '#141011',
    fontWeight: '800',
  },
  insightCard: {
    marginTop: 16,
    paddingHorizontal: 30,
    paddingVertical: 22,
    backgroundColor: '#29A8D2',
    shadowColor: '#2A1E1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  insightTitle: {
    color: '#141011',
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 24,
  },
  insightText: {
    color: '#141011',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },
  periodCard: {
    marginTop: 20,
    paddingHorizontal: 30,
    paddingVertical: 18,
    backgroundColor: '#F77796',
    shadowColor: '#2A1E1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },
  periodTitle: {
    color: '#141011',
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 24,
  },
});
