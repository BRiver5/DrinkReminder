import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { BASE_COLORS, RADIUS } from '../theme/theme';
import { useTheme } from '../theme/useTheme';

interface AmountModalProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  /** Prefilled numeric value as text (already in display units) */
  initialValue: string;
  placeholder: string;
  /** Unit suffix shown next to the input, e.g. "ml" or "kg" */
  suffix: string;
  submitLabel?: string;
  /** Return an error message to block submit, or null when valid */
  validate: (value: number) => string | null;
  onSubmit: (value: number) => void;
  onCancel: () => void;
  /** Optional "Clear value" action (used for optional weight) */
  onClear?: () => void;
}

export function AmountModal({
  visible,
  title,
  subtitle,
  initialValue,
  placeholder,
  suffix,
  submitLabel = 'Save',
  validate,
  onSubmit,
  onCancel,
  onClear,
}: AmountModalProps) {
  const theme = useTheme();
  const [text, setText] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setText(initialValue);
      setError(null);
    }
  }, [visible, initialValue]);

  const handleSubmit = () => {
    const value = Number(text.replace(',', '.').trim());
    if (!Number.isFinite(value)) {
      setError('Enter a number');
      return;
    }
    const validationError = validate(value);
    if (validationError) {
      setError(validationError);
      return;
    }
    onSubmit(value);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, { borderColor: theme.primary }]}
              value={text}
              onChangeText={(t) => {
                setText(t);
                setError(null);
              }}
              keyboardType="numeric"
              placeholder={placeholder}
              placeholderTextColor={BASE_COLORS.textSecondary}
              autoFocus
              maxLength={7}
            />
            <Text style={styles.suffix}>{suffix}</Text>
          </View>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <View style={styles.buttons}>
            {onClear ? (
              <Pressable onPress={onClear} style={styles.textButton}>
                <Text style={[styles.textButtonLabel, { color: BASE_COLORS.danger }]}>Clear</Text>
              </Pressable>
            ) : null}
            <View style={styles.spacer} />
            <Pressable onPress={onCancel} style={styles.textButton}>
              <Text style={[styles.textButtonLabel, { color: BASE_COLORS.textSecondary }]}>
                Cancel
              </Text>
            </Pressable>
            <Pressable
              onPress={handleSubmit}
              style={[styles.primaryButton, { backgroundColor: theme.primary }]}
            >
              <Text style={styles.primaryButtonLabel}>{submitLabel}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(14,42,71,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  sheet: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: BASE_COLORS.card,
    borderRadius: RADIUS.card,
    padding: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: BASE_COLORS.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: BASE_COLORS.textSecondary,
    marginTop: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: RADIUS.button,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: '600',
    color: BASE_COLORS.textPrimary,
  },
  suffix: {
    marginLeft: 10,
    fontSize: 15,
    color: BASE_COLORS.textSecondary,
    fontWeight: '600',
  },
  error: {
    color: BASE_COLORS.danger,
    fontSize: 13,
    marginTop: 8,
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
  },
  spacer: {
    flex: 1,
  },
  textButton: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  textButtonLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  primaryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: RADIUS.button,
    marginLeft: 4,
  },
  primaryButtonLabel: {
    color: BASE_COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
});
