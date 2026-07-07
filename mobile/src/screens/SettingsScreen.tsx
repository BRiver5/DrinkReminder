import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import { Card } from '../components/Card';
import { GradientHeader } from '../components/GradientHeader';
import { SegmentedToggle } from '../components/SegmentedToggle';
import { AmountModal } from '../components/AmountModal';
import { ContainerIcon, CONTAINERS } from '../components/ContainerIcon';
import { useData } from '../state/DataContext';
import { useTheme } from '../theme/useTheme';
import { ACCENTS, BASE_COLORS } from '../theme/theme';
import { displayAmount, formatVolume, ozToMl, unitLabel } from '../utils/units';
import type { Unit } from '../types';

export function SettingsScreen() {
  const { settings, updateSettings, clearHistory } = useData();
  const theme = useTheme();
  const [goalVisible, setGoalVisible] = useState(false);
  const [weightVisible, setWeightVisible] = useState(false);

  const appVersion =
    Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '1.0.0';

  const confirmClearHistory = () => {
    Alert.alert(
      'Clear all history',
      'This permanently deletes every water record stored on this device. Settings and reminders are kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: clearHistory },
      ]
    );
  };

  return (
    <View style={styles.screen}>
      <GradientHeader title="Settings" subtitle="Make the app yours" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Card>
          <Text style={styles.sectionTitle}>Personalization</Text>

          <Text style={styles.fieldLabel}>Accent color</Text>
          <View style={styles.swatchRow}>
            {ACCENTS.map((accent) => {
              const selected = accent.key === theme.key;
              return (
                <Pressable
                  key={accent.key}
                  onPress={() => updateSettings({ themeColor: accent.key })}
                  style={[
                    styles.swatch,
                    { backgroundColor: accent.primary },
                    selected && styles.swatchSelected,
                  ]}
                  accessibilityLabel={accent.name}
                >
                  {selected && <Ionicons name="checkmark" size={16} color={BASE_COLORS.white} />}
                </Pressable>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>Water container</Text>
          <View style={styles.containerRow}>
            {CONTAINERS.map((container) => {
              const selected = container.type === settings.containerIcon;
              return (
                <Pressable
                  key={container.type}
                  onPress={() => updateSettings({ containerIcon: container.type })}
                  style={[
                    styles.containerOption,
                    { borderColor: selected ? theme.primary : BASE_COLORS.border },
                    selected && { backgroundColor: theme.soft },
                  ]}
                >
                  <ContainerIcon
                    type={container.type}
                    size={24}
                    color={selected ? theme.primary : BASE_COLORS.textSecondary}
                  />
                  <Text
                    style={[
                      styles.containerLabel,
                      { color: selected ? theme.primary : BASE_COLORS.textSecondary },
                    ]}
                  >
                    {container.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Goal & profile</Text>

          <Pressable style={styles.row} onPress={() => setGoalVisible(true)}>
            <Text style={styles.rowLabel}>Daily goal</Text>
            <Text style={[styles.rowValue, { color: theme.primary }]}>
              {formatVolume(settings.dailyGoalMl, settings.unit)}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={BASE_COLORS.textSecondary} />
          </Pressable>

          <Pressable style={styles.row} onPress={() => setWeightVisible(true)}>
            <Text style={styles.rowLabel}>Weight (optional)</Text>
            <Text style={[styles.rowValue, { color: theme.primary }]}>
              {settings.weightKg ? `${settings.weightKg} kg` : 'Not set'}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={BASE_COLORS.textSecondary} />
          </Pressable>
          <Text style={styles.hint}>
            Used only for the "ideal intake" line on the Home screen. General estimate, not
            medical advice.
          </Text>

          <Text style={[styles.fieldLabel, styles.unitsLabel]}>Units</Text>
          <SegmentedToggle<Unit>
            options={[
              { key: 'ml', label: 'Milliliters (ml)' },
              { key: 'oz', label: 'Fluid ounces (fl oz)' },
            ]}
            value={settings.unit}
            onChange={(unit) => updateSettings({ unit })}
          />
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>Data</Text>
          <Pressable style={styles.row} onPress={confirmClearHistory}>
            <Ionicons name="trash-outline" size={18} color={BASE_COLORS.danger} />
            <Text style={[styles.rowLabel, styles.dangerLabel]}>Clear all history</Text>
          </Pressable>
        </Card>

        <Card>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.row}>
            <Text style={styles.rowLabel}>Version</Text>
            <Text style={styles.rowValue}>{appVersion}</Text>
          </View>
          <Text style={styles.tagline}>Drink more — live better!</Text>
        </Card>
      </ScrollView>

      <AmountModal
        visible={goalVisible}
        title="Daily goal"
        placeholder={settings.unit === 'ml' ? '2000' : '68'}
        suffix={unitLabel(settings.unit)}
        initialValue={
          settings.unit === 'ml'
            ? String(settings.dailyGoalMl)
            : displayAmount(settings.dailyGoalMl, 'oz')
        }
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

      <AmountModal
        visible={weightVisible}
        title="Your weight"
        subtitle="Optional — used for the ideal intake estimate"
        placeholder="70"
        suffix="kg"
        initialValue={settings.weightKg ? String(settings.weightKg) : ''}
        validate={(v) => {
          if (v < 20 || v > 300) return 'Enter a weight between 20 and 300 kg';
          return null;
        }}
        onSubmit={(v) => {
          updateSettings({ weightKg: Math.round(v) });
          setWeightVisible(false);
        }}
        onClear={() => {
          updateSettings({ weightKg: null });
          setWeightVisible(false);
        }}
        onCancel={() => setWeightVisible(false)}
      />
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: BASE_COLORS.textPrimary,
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: BASE_COLORS.textSecondary,
    marginBottom: 8,
  },
  unitsLabel: {
    marginTop: 14,
  },
  swatchRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSelected: {
    borderWidth: 2.5,
    borderColor: BASE_COLORS.textPrimary,
  },
  containerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  containerOption: {
    flex: 1,
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    paddingVertical: 10,
    gap: 4,
  },
  containerLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: BASE_COLORS.textPrimary,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '600',
    color: BASE_COLORS.textSecondary,
  },
  dangerLabel: {
    color: BASE_COLORS.danger,
  },
  hint: {
    fontSize: 12,
    color: BASE_COLORS.textSecondary,
    lineHeight: 17,
  },
  tagline: {
    fontSize: 13,
    color: BASE_COLORS.textSecondary,
    fontStyle: 'italic',
  },
});
