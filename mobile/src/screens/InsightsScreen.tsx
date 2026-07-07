import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { Card } from '../components/Card';
import { GradientHeader } from '../components/GradientHeader';
import { SegmentedToggle } from '../components/SegmentedToggle';
import { StatCard } from '../components/StatCard';
import { EntryRow } from '../components/EntryRow';
import { useData } from '../state/DataContext';
import { useTheme } from '../theme/useTheme';
import { BASE_COLORS } from '../theme/theme';
import {
  addDaysToKey,
  dayOfMonth,
  formatDayLabel,
  lastNDayKeys,
  weekdayShort,
} from '../utils/dates';
import { getAllDailyTotals, getDailyTotals, getEntriesForDay } from '../db/entries';
import { formatVolume, mlToOz, unitLabel } from '../utils/units';
import type { DayTotal, Unit } from '../types';

type Range = 'week' | 'month';

function toDisplayValue(ml: number, unit: Unit): number {
  return unit === 'ml' ? ml : Math.round(mlToOz(ml) * 10) / 10;
}

/** Longest run of consecutive days whose total met the goal. */
function bestStreak(allTotals: DayTotal[], goalMl: number): number {
  const met = new Set(allTotals.filter((t) => t.totalMl >= goalMl).map((t) => t.day));
  let best = 0;
  for (const day of met) {
    if (met.has(addDaysToKey(day, -1))) continue; // only start counting at streak starts
    let length = 1;
    let next = addDaysToKey(day, 1);
    while (met.has(next)) {
      length++;
      next = addDaysToKey(next, 1);
    }
    if (length > best) best = length;
  }
  return best;
}

function niceCeil(value: number, step: number): number {
  return Math.max(Math.ceil(value / step) * step, step);
}

export function InsightsScreen() {
  const { settings, dataVersion, todayKey } = useData();
  const theme = useTheme();
  const { width } = useWindowDimensions();

  const [range, setRange] = useState<Range>('week');
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const dayCount = range === 'week' ? 7 : 30;
  const { unit, dailyGoalMl } = settings;

  const days = useMemo(() => lastNDayKeys(dayCount), [dayCount, todayKey]);

  const totalsByDay = useMemo(() => {
    const rows = getDailyTotals(days[0], days[days.length - 1]);
    const map = new Map<string, number>();
    for (const row of rows) map.set(row.day, row.totalMl);
    return map;
  }, [days, dataVersion]);

  const allTotals = useMemo(() => getAllDailyTotals(), [dataVersion]);

  const stats = useMemo(() => {
    let periodTotal = 0;
    let activeDays = 0;
    for (const day of days) {
      const total = totalsByDay.get(day) ?? 0;
      periodTotal += total;
      if (total > 0) activeDays++;
    }
    return {
      periodTotal,
      average: activeDays > 0 ? Math.round(periodTotal / activeDays) : 0,
      streak: bestStreak(allTotals, dailyGoalMl),
    };
  }, [days, totalsByDay, allTotals, dailyGoalMl]);

  const goalDisplay = toDisplayValue(dailyGoalMl, unit);
  const maxData = Math.max(0, ...days.map((d) => toDisplayValue(totalsByDay.get(d) ?? 0, unit)));
  const step = unit === 'ml' ? 250 : 10;
  const maxValue = niceCeil(Math.max(goalDisplay * 1.25, maxData * 1.1), step);

  const chartWidth = width - 16 * 2 - 16 * 2; // screen padding + card padding
  const yAxisWidth = 42;
  const plotWidth = chartWidth - yAxisWidth;

  const referenceLineConfig = {
    color: BASE_COLORS.textPrimary,
    thickness: 1,
    type: 'dashed',
    dashWidth: 5,
    dashGap: 5,
    labelText: 'Goal',
    labelTextStyle: { color: BASE_COLORS.textSecondary, fontSize: 10, marginLeft: 4 },
  };

  const axisProps = {
    yAxisThickness: 0,
    xAxisThickness: 1,
    xAxisColor: BASE_COLORS.border,
    rulesType: 'dashed' as const,
    rulesColor: BASE_COLORS.border,
    noOfSections: 4,
    maxValue,
    yAxisLabelWidth: yAxisWidth,
    yAxisTextStyle: { color: BASE_COLORS.textSecondary, fontSize: 10 },
    showReferenceLine1: true,
    referenceLine1Position: goalDisplay,
    referenceLine1Config: referenceLineConfig,
  };

  const weekSpacing = 14;
  const weekBarWidth = Math.max(Math.floor((plotWidth - weekSpacing * 7 - 10) / 7), 16);

  const weekData = days.map((day) => ({
    value: toDisplayValue(totalsByDay.get(day) ?? 0, unit),
    label: weekdayShort(day),
    labelTextStyle: { color: BASE_COLORS.textSecondary, fontSize: 10 },
    frontColor: (totalsByDay.get(day) ?? 0) >= dailyGoalMl ? theme.primary : theme.ring[0],
  }));

  const monthData = days.map((day, index) => ({
    value: toDisplayValue(totalsByDay.get(day) ?? 0, unit),
    label: index % 5 === 0 || index === days.length - 1 ? dayOfMonth(day) : '',
    labelTextStyle: { color: BASE_COLORS.textSecondary, fontSize: 9 },
  }));

  const historyDays = useMemo(() => allTotals.filter((t) => t.day !== todayKey), [allTotals, todayKey]);

  const hasAnyData = allTotals.length > 0;

  return (
    <View style={styles.screen}>
      <GradientHeader title="Insights" subtitle="Your hydration at a glance" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsRow}>
          <StatCard
            icon="water"
            label="Daily average"
            value={hasAnyData ? formatVolume(stats.average, unit) : '—'}
          />
          <StatCard
            icon="flame"
            label="Best streak"
            value={stats.streak > 0 ? `${stats.streak} ${stats.streak === 1 ? 'day' : 'days'}` : '—'}
          />
          <StatCard
            icon="calendar"
            label={range === 'week' ? 'Total this week' : 'Total this month'}
            value={hasAnyData ? formatVolume(stats.periodTotal, unit) : '—'}
          />
        </View>

        <Card>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>Intake, {unitLabel(unit)}</Text>
            <View style={styles.toggleWrap}>
              <SegmentedToggle<Range>
                options={[
                  { key: 'week', label: 'Week' },
                  { key: 'month', label: 'Month' },
                ]}
                value={range}
                onChange={(r) => setRange(r)}
              />
            </View>
          </View>
          {range === 'week' ? (
            <BarChart
              data={weekData}
              width={plotWidth}
              height={190}
              barWidth={weekBarWidth}
              spacing={weekSpacing}
              barBorderTopLeftRadius={6}
              barBorderTopRightRadius={6}
              initialSpacing={8}
              disableScroll
              {...axisProps}
            />
          ) : (
            <LineChart
              data={monthData}
              width={plotWidth}
              height={190}
              adjustToWidth
              disableScroll
              thickness={2.5}
              color={theme.primary}
              hideDataPoints
              curved
              areaChart
              startFillColor={theme.ring[0]}
              endFillColor={theme.ring[1]}
              startOpacity={0.35}
              endOpacity={0.04}
              {...axisProps}
            />
          )}
          {!hasAnyData && (
            <Text style={styles.emptyChartNote}>
              No records yet — add your first drink on the Home tab and the chart will fill up.
            </Text>
          )}
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>History</Text>
          {historyDays.length === 0 ? (
            <Text style={styles.emptyChartNote}>
              Past days will appear here after your first full day of tracking.
            </Text>
          ) : (
            historyDays.map((dayTotal) => {
              const expanded = expandedDay === dayTotal.day;
              const goalMet = dayTotal.totalMl >= dailyGoalMl;
              return (
                <View key={dayTotal.day} style={styles.historyItem}>
                  <Pressable
                    style={styles.historyRow}
                    onPress={() => setExpandedDay(expanded ? null : dayTotal.day)}
                  >
                    <View
                      style={[
                        styles.historyDot,
                        { backgroundColor: goalMet ? BASE_COLORS.success : BASE_COLORS.track },
                      ]}
                    />
                    <Text style={styles.historyDay}>{formatDayLabel(dayTotal.day)}</Text>
                    <Text style={styles.historyTotal}>{formatVolume(dayTotal.totalMl, unit)}</Text>
                    <Ionicons
                      name={expanded ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={BASE_COLORS.textSecondary}
                    />
                  </Pressable>
                  {expanded &&
                    getEntriesForDay(dayTotal.day).map((entry) => (
                      <EntryRow key={entry.id} entry={entry} unit={unit} />
                    ))}
                </View>
              );
            })
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BASE_COLORS.background,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  chartHeader: {
    marginBottom: 14,
    gap: 10,
  },
  toggleWrap: {
    width: 200,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BASE_COLORS.textPrimary,
  },
  emptyChartNote: {
    fontSize: 13,
    color: BASE_COLORS.textSecondary,
    marginTop: 10,
    lineHeight: 19,
  },
  historyItem: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BASE_COLORS.border,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 10,
  },
  historyDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  historyDay: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: BASE_COLORS.textPrimary,
  },
  historyTotal: {
    fontSize: 14,
    fontWeight: '600',
    color: BASE_COLORS.textSecondary,
  },
});
