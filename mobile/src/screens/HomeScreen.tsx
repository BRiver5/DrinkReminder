import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../components/Card';
import { GradientHeader } from '../components/GradientHeader';
import { ProgressRing } from '../components/ProgressRing';
import { QuickAddRow } from '../components/QuickAddRow';
import { EntryRow } from '../components/EntryRow';
import { AmountModal } from '../components/AmountModal';
import { useData } from '../state/DataContext';
import { useTheme } from '../theme/useTheme';
import { BASE_COLORS } from '../theme/theme';
import { formatHeaderDate } from '../utils/dates';
import { displayAmount, formatVolume, ozToMl, unitLabel } from '../utils/units';
import { getMeta, setMeta } from '../db/database';

const GOAL_CARD_META_KEY = 'goal_card_dismissed';

/** Simple informational estimate: ~33 ml per kg of body weight, rounded to 50 ml. */
function idealIntakeMl(weightKg: number): number {
  return Math.round((weightKg * 33) / 50) * 50;
}

export function HomeScreen() {
  const { settings, updateSettings, todayEntries, todayTotalMl, addWater, removeEntry } =
    useData();
  const theme = useTheme();

  const [customVisible, setCustomVisible] = useState(false);
  const [goalVisible, setGoalVisible] = useState(false);
  const [goalCardDismissed, setGoalCardDismissed] = useState(
    () => getMeta(GOAL_CARD_META_KEY) === '1'
  );

  const progress = settings.dailyGoalMl > 0 ? todayTotalMl / settings.dailyGoalMl : 0;
  const percent = Math.min(Math.round(progress * 100), 999);
  const ideal = useMemo(
    () => (settings.weightKg ? idealIntakeMl(settings.weightKg) : null),
    [settings.weightKg]
  );

  const dismissGoalCard = () => {
    setMeta(GOAL_CARD_META_KEY, '1');
    setGoalCardDismissed(true);
  };

  const goalInDisplayUnit =
    settings.unit === 'ml'
      ? String(settings.dailyGoalMl)
      : displayAmount(settings.dailyGoalMl, 'oz');

  return (
    <View style={styles.screen}>
      <GradientHeader>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.wordmark}>DrinkReminder</Text>
            <Text style={styles.headerDate}>{formatHeaderDate()}</Text>
          </View>
          <Ionicons name="water" size={30} color="rgba(255,255,255,0.9)" />
        </View>
      </GradientHeader>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {!goalCardDismissed && (
          <Card style={styles.goalCard}>
            <View style={styles.goalCardText}>
              <Text style={styles.goalCardTitle}>Welcome! 💧</Text>
              <Text style={styles.goalCardBody}>
                Your daily goal is {formatVolume(settings.dailyGoalMl, settings.unit)}. You can
                adjust it any time.
              </Text>
              <Pressable
                onPress={() => setGoalVisible(true)}
                style={[styles.goalCardButton, { backgroundColor: theme.primary }]}
              >
                <Text style={styles.goalCardButtonLabel}>Adjust goal</Text>
              </Pressable>
            </View>
            <Pressable onPress={dismissGoalCard} hitSlop={10} accessibilityLabel="Dismiss">
              <Ionicons name="close" size={20} color={BASE_COLORS.textSecondary} />
            </Pressable>
          </Card>
        )}

        <Card style={styles.progressCard}>
          <ProgressRing progress={progress} colors={theme.ring}>
            <Text style={[styles.percent, { color: theme.primary }]}>{percent}%</Text>
            <Text style={styles.amounts}>
              {displayAmount(todayTotalMl, settings.unit)} /{' '}
              {displayAmount(settings.dailyGoalMl, settings.unit)} {unitLabel(settings.unit)}
            </Text>
          </ProgressRing>
          <View style={styles.goalRow}>
            <Text style={styles.goalLabel}>
              Daily goal: {formatVolume(settings.dailyGoalMl, settings.unit)}
            </Text>
            <Pressable onPress={() => setGoalVisible(true)} hitSlop={10} accessibilityLabel="Edit goal">
              <Ionicons name="pencil" size={16} color={theme.primary} />
            </Pressable>
          </View>
          {ideal !== null && (
            <Text style={styles.idealLine}>
              Ideal water intake: ~{formatVolume(ideal, settings.unit)}
            </Text>
          )}
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Quick add</Text>
          <QuickAddRow
            unit={settings.unit}
            containerIcon={settings.containerIcon}
            onAdd={addWater}
            onCustom={() => setCustomVisible(true)}
          />
        </Card>

        <Card>
          <View style={styles.recordsHeader}>
            <Text style={styles.sectionTitle}>Today's records</Text>
            <Text style={[styles.recordsCount, { color: theme.primary }]}>
              {todayEntries.length} {todayEntries.length === 1 ? 'record' : 'records'}
            </Text>
          </View>
          {todayEntries.length === 0 ? (
            <View style={styles.empty}>
              <Ionicons name="water-outline" size={30} color={BASE_COLORS.textSecondary} />
              <Text style={styles.emptyText}>
                Nothing logged yet today.{'\n'}Tap a button above to add your first drink.
              </Text>
            </View>
          ) : (
            todayEntries.map((entry) => (
              <EntryRow key={entry.id} entry={entry} unit={settings.unit} onDelete={removeEntry} />
            ))
          )}
        </Card>
      </ScrollView>

      <AmountModal
        visible={customVisible}
        title="Add custom amount"
        placeholder={settings.unit === 'ml' ? '250' : '8'}
        suffix={unitLabel(settings.unit)}
        initialValue=""
        submitLabel="Add"
        validate={(v) => {
          const ml = settings.unit === 'ml' ? Math.round(v) : ozToMl(v);
          if (ml < 1) return 'Amount must be positive';
          if (ml > 5000) return 'That is too much for one record';
          return null;
        }}
        onSubmit={(v) => {
          const ml = settings.unit === 'ml' ? Math.round(v) : ozToMl(v);
          addWater(ml);
          setCustomVisible(false);
        }}
        onCancel={() => setCustomVisible(false)}
      />

      <AmountModal
        visible={goalVisible}
        title="Daily goal"
        subtitle="How much water do you want to drink per day?"
        placeholder={settings.unit === 'ml' ? '2000' : '68'}
        suffix={unitLabel(settings.unit)}
        initialValue={goalInDisplayUnit}
        validate={(v) => {
          const ml = settings.unit === 'ml' ? Math.round(v) : ozToMl(v);
          if (ml < 250) return 'Goal is too small';
          if (ml > 10000) return 'Goal is too large';
          return null;
        }}
        onSubmit={(v) => {
          const ml = settings.unit === 'ml' ? Math.round(v) : ozToMl(v);
          updateSettings({ dailyGoalMl: ml });
          setGoalVisible(false);
        }}
        onCancel={() => setGoalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BASE_COLORS.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wordmark: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  headerDate: {
    color: BASE_COLORS.white,
    fontSize: 23,
    fontWeight: '700',
    marginTop: 2,
  },
  content: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  goalCardText: {
    flex: 1,
    marginRight: 8,
  },
  goalCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BASE_COLORS.textPrimary,
  },
  goalCardBody: {
    fontSize: 13,
    color: BASE_COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  goalCardButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    marginTop: 10,
  },
  goalCardButtonLabel: {
    color: BASE_COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  progressCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  percent: {
    fontSize: 40,
    fontWeight: '800',
  },
  amounts: {
    fontSize: 15,
    color: BASE_COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 4,
  },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  goalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: BASE_COLORS.textPrimary,
  },
  idealLine: {
    fontSize: 12,
    color: BASE_COLORS.textSecondary,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BASE_COLORS.textPrimary,
    marginBottom: 10,
  },
  recordsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recordsCount: {
    fontSize: 13,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 22,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: BASE_COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 19,
  },
});
