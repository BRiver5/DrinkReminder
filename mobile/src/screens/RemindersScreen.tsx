import React, { useCallback, useState } from 'react';
import {
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInDown, FadeOutUp, LinearTransition } from 'react-native-reanimated';
import { Card } from '../components/Card';
import { GradientHeader } from '../components/GradientHeader';
import { ScalePressable } from '../components/ScalePressable';
import { useTheme } from '../theme/useTheme';
import { BASE_COLORS } from '../theme/theme';
import {
  addReminder,
  deleteReminder,
  getReminders,
  getRemindersMasterEnabled,
  setReminderEnabled,
  setRemindersMasterEnabled,
  updateReminderTime,
} from '../db/reminders';
import {
  isPermissionGranted,
  requestPermission,
  rescheduleAllReminders,
} from '../notifications/notifications';
import { dateFromHHMM, hhmmFromDate } from '../utils/dates';
import type { Reminder } from '../types';

type PickerTarget = { kind: 'edit'; id: number; time: string } | { kind: 'new' } | null;

export function RemindersScreen() {
  const theme = useTheme();
  const [reminders, setReminders] = useState<Reminder[]>(() => getReminders());
  const [masterEnabled, setMasterEnabled] = useState<boolean>(() => getRemindersMasterEnabled());
  const [permissionGranted, setPermissionGranted] = useState(true);
  const [picker, setPicker] = useState<PickerTarget>(null);

  const refresh = useCallback(() => {
    setReminders(getReminders());
    setMasterEnabled(getRemindersMasterEnabled());
    void isPermissionGranted().then(setPermissionGranted);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const applySchedules = useCallback(async () => {
    await rescheduleAllReminders();
    setReminders(getReminders());
  }, []);

  const handleMasterToggle = async (value: boolean) => {
    if (value) {
      const granted = await requestPermission();
      setPermissionGranted(granted);
      if (!granted) {
        // The app stays fully usable; we only surface the permission card below.
        setMasterEnabled(false);
        setRemindersMasterEnabled(false);
        return;
      }
    }
    setRemindersMasterEnabled(value);
    setMasterEnabled(value);
    await applySchedules();
  };

  const handleRowToggle = async (id: number, value: boolean) => {
    setReminderEnabled(id, value);
    await applySchedules();
  };

  const handleDelete = async (id: number) => {
    deleteReminder(id);
    await applySchedules();
  };

  const handlePicked = async (event: DateTimePickerEvent, date?: Date) => {
    const target = picker;
    setPicker(null);
    if (event.type !== 'set' || !date || !target) return;
    const time = hhmmFromDate(date);
    if (target.kind === 'new') {
      addReminder(time);
    } else {
      updateReminderTime(target.id, time);
    }
    await applySchedules();
  };

  const showPermissionCard = masterEnabled && !permissionGranted;

  return (
    <View style={styles.screen}>
      <GradientHeader title="Reminders" subtitle="Gentle nudges to keep you hydrated" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card style={styles.masterRow}>
          <View style={styles.masterText}>
            <Text style={styles.masterTitle}>Enable reminders</Text>
            <Text style={styles.masterSubtitle}>
              Daily notifications at the times listed below
            </Text>
          </View>
          <Switch
            value={masterEnabled}
            onValueChange={(v) => void handleMasterToggle(v)}
            trackColor={{ false: BASE_COLORS.track, true: theme.ring[0] }}
            thumbColor={BASE_COLORS.white}
          />
        </Card>

        {showPermissionCard && (
          <Card style={styles.permissionCard}>
            <Ionicons name="notifications-off-outline" size={22} color={BASE_COLORS.danger} />
            <View style={styles.permissionText}>
              <Text style={styles.permissionTitle}>Notification permission needed</Text>
              <Text style={styles.permissionBody}>
                Allow notifications in system settings so reminders can reach you. The rest of the
                app works without it.
              </Text>
            </View>
            <Pressable
              onPress={() => void Linking.openSettings()}
              style={[styles.permissionButton, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.permissionButtonLabel}>Open settings</Text>
            </Pressable>
          </Card>
        )}

        <Card>
          <Text style={styles.sectionTitle}>Schedule</Text>
          {reminders.length === 0 ? (
            <Text style={styles.emptyText}>
              No reminder times yet — add one with the button below.
            </Text>
          ) : (
            reminders.map((reminder) => (
              <Animated.View
                key={reminder.id}
                entering={FadeInDown.duration(200)}
                exiting={FadeOutUp.duration(160)}
                layout={LinearTransition.duration(180)}
                style={[styles.reminderRow, !masterEnabled && styles.reminderRowDisabled]}
              >
                <Ionicons name="time-outline" size={20} color={theme.primary} />
                <Pressable
                  onPress={() => setPicker({ kind: 'edit', id: reminder.id, time: reminder.time })}
                  style={styles.timeButton}
                >
                  <Text style={styles.timeText}>{reminder.time}</Text>
                  <Ionicons name="pencil" size={13} color={BASE_COLORS.textSecondary} />
                </Pressable>
                <Switch
                  value={reminder.enabled}
                  onValueChange={(v) => void handleRowToggle(reminder.id, v)}
                  trackColor={{ false: BASE_COLORS.track, true: theme.ring[0] }}
                  thumbColor={BASE_COLORS.white}
                />
                <Pressable
                  onPress={() => void handleDelete(reminder.id)}
                  hitSlop={10}
                  style={styles.deleteButton}
                  accessibilityLabel="Delete reminder"
                >
                  <Ionicons name="trash-outline" size={19} color={BASE_COLORS.textSecondary} />
                </Pressable>
              </Animated.View>
            ))
          )}
          <ScalePressable
            onPress={() => setPicker({ kind: 'new' })}
            style={[styles.addButton, { backgroundColor: theme.primary }]}
          >
            <Ionicons name="add" size={20} color={BASE_COLORS.white} />
            <Text style={styles.addButtonLabel}>Add reminder</Text>
          </ScalePressable>
        </Card>
      </ScrollView>

      {picker !== null && (
        <DateTimePicker
          value={picker.kind === 'edit' ? dateFromHHMM(picker.time) : dateFromHHMM('12:00')}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => void handlePicked(event, date)}
        />
      )}
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
  masterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  masterText: {
    flex: 1,
    marginRight: 10,
  },
  masterTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BASE_COLORS.textPrimary,
  },
  masterSubtitle: {
    fontSize: 12,
    color: BASE_COLORS.textSecondary,
    marginTop: 2,
  },
  permissionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  permissionText: {
    flex: 1,
  },
  permissionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: BASE_COLORS.textPrimary,
  },
  permissionBody: {
    fontSize: 12,
    color: BASE_COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  permissionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  permissionButtonLabel: {
    color: BASE_COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BASE_COLORS.textPrimary,
    marginBottom: 6,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  reminderRowDisabled: {
    opacity: 0.55,
  },
  timeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeText: {
    fontSize: 20,
    fontWeight: '700',
    color: BASE_COLORS.textPrimary,
    fontVariant: ['tabular-nums'],
  },
  deleteButton: {
    padding: 4,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 12,
  },
  addButtonLabel: {
    color: BASE_COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 13,
    color: BASE_COLORS.textSecondary,
    paddingVertical: 8,
    lineHeight: 19,
  },
});
