import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { AppSettings } from '@/src/domain/types';
import { hasValidationErrors } from '@/src/domain/validation';
import { useRecords } from '@/src/state/RecordsContext';
import { AppButton } from '@/src/ui/AppButton';
import { Banner } from '@/src/ui/Banner';
import { TextField } from '@/src/ui/FormField';
import { ScreenScaffold } from '@/src/ui/ScreenScaffold';
import { colors, radii } from '@/src/ui/theme';

type SettingsErrors = Partial<Record<keyof AppSettings, string>>;

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function validateSettings(values: AppSettings): SettingsErrors {
  const errors: SettingsErrors = {};

  if (!values.businessName.trim()) {
    errors.businessName = 'Business name is required.';
  }

  if (!values.quotePrefix.trim()) {
    errors.quotePrefix = 'Quote prefix is required.';
  }

  if (!Number.isFinite(values.defaultTaxPercent) || values.defaultTaxPercent < 0) {
    errors.defaultTaxPercent = 'Tax must be a non-negative percentage.';
  }

  if (!Number.isFinite(values.defaultMarkupPercent) || values.defaultMarkupPercent < 0) {
    errors.defaultMarkupPercent = 'Markup must be a non-negative percentage.';
  }

  if (!Number.isFinite(values.quoteStartingNumber) || values.quoteStartingNumber < 1) {
    errors.quoteStartingNumber = 'Starting number must be 1 or greater.';
  }

  return errors;
}

export function AppSettingsScreen() {
  const router = useRouter();
  const { settings, storageError, updateSettings } = useRecords();
  const [values, setValues] = useState<AppSettings>(settings);
  const [errors, setErrors] = useState<SettingsErrors>({});
  const [submitError, setSubmitError] = useState('');

  function updateField<K extends keyof AppSettings>(field: K, value: AppSettings[K]) {
    setValues((currentValues) => ({ ...currentValues, [field]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }));
    setSubmitError('');
  }

  async function handleSubmit() {
    const nextValues: AppSettings = {
      ...values,
      businessName: values.businessName.trim(),
      contractorName: values.contractorName.trim(),
      businessPhone: values.businessPhone.trim(),
      businessEmail: values.businessEmail.trim(),
      businessAddress: values.businessAddress.trim(),
      currency: values.currency.trim() || 'USD',
      quotePrefix: values.quotePrefix.trim(),
      defaultTerms: values.defaultTerms.trim(),
      quoteStartingNumber: Math.max(1, Math.round(values.quoteStartingNumber)),
    };
    const nextErrors = validateSettings(nextValues);
    setErrors(nextErrors);
    setSubmitError('');

    if (hasValidationErrors(nextErrors)) {
      return;
    }

    try {
      await updateSettings(nextValues);
      router.back();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Settings could not be saved.');
    }
  }

  return (
    <ScreenScaffold showBack subtitle="Used on new estimates and quote snapshots" title="App Settings">
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={12}
        style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {storageError ? <Banner tone="error">{storageError}</Banner> : null}
          {submitError ? <Banner tone="error">{submitError}</Banner> : null}
          {hasValidationErrors(errors) ? <Banner tone="error">Fix the highlighted settings fields.</Banner> : null}

          <TextField
            autoCapitalize="words"
            error={errors.businessName}
            label="Business Name"
            onChangeText={(value) => updateField('businessName', value)}
            placeholder="QuoteForge Contracting"
            value={values.businessName}
          />
          <TextField
            autoCapitalize="words"
            label="Contractor Name"
            onChangeText={(value) => updateField('contractorName', value)}
            placeholder="Your name"
            value={values.contractorName}
          />
          <TextField
            keyboardType="phone-pad"
            label="Business Phone"
            onChangeText={(value) => updateField('businessPhone', value)}
            placeholder="(555) 012-3456"
            value={values.businessPhone}
          />
          <TextField
            autoCapitalize="none"
            keyboardType="email-address"
            label="Business Email"
            onChangeText={(value) => updateField('businessEmail', value)}
            placeholder="office@example.com"
            value={values.businessEmail}
          />
          <TextField
            label="Business Address"
            multiline
            onChangeText={(value) => updateField('businessAddress', value)}
            placeholder="Business mailing address"
            value={values.businessAddress}
          />

          <View style={styles.fieldRow}>
            <View style={styles.fieldHalf}>
              <TextField
                error={errors.defaultTaxPercent}
                keyboardType="decimal-pad"
                label="Default Tax %"
                onChangeText={(value) => updateField('defaultTaxPercent', toNumber(value))}
                placeholder="0"
                value={String(values.defaultTaxPercent)}
              />
            </View>
            <View style={styles.fieldHalf}>
              <TextField
                error={errors.defaultMarkupPercent}
                keyboardType="decimal-pad"
                label="Default Markup %"
                onChangeText={(value) => updateField('defaultMarkupPercent', toNumber(value))}
                placeholder="15"
                value={String(values.defaultMarkupPercent)}
              />
            </View>
          </View>

          <View style={styles.fieldRow}>
            <View style={styles.fieldHalf}>
              <TextField
                autoCapitalize="characters"
                error={errors.quotePrefix}
                label="Quote Prefix"
                onChangeText={(value) => updateField('quotePrefix', value)}
                placeholder="QF"
                value={values.quotePrefix}
              />
            </View>
            <View style={styles.fieldHalf}>
              <TextField
                error={errors.quoteStartingNumber}
                keyboardType="number-pad"
                label="Start Number"
                onChangeText={(value) => updateField('quoteStartingNumber', toNumber(value))}
                placeholder="1001"
                value={String(values.quoteStartingNumber)}
              />
            </View>
          </View>

          <TextField
            autoCapitalize="characters"
            label="Currency"
            onChangeText={(value) => updateField('currency', value)}
            placeholder="USD"
            value={values.currency}
          />
          <TextField
            label="Default Terms"
            multiline
            onChangeText={(value) => updateField('defaultTerms', value)}
            placeholder="Quote terms"
            value={values.defaultTerms}
          />

          <Pressable
            accessibilityRole="switch"
            accessibilityState={{ checked: values.reducedMotion }}
            onPress={() => updateField('reducedMotion', !values.reducedMotion)}
            style={({ pressed }) => [styles.toggleRow, pressed && styles.pressed]}>
            <View style={styles.toggleText}>
              <Text style={styles.toggleTitle}>Reduced Motion</Text>
              <Text style={styles.toggleBody}>Saved for future animation preferences.</Text>
            </View>
            <View style={[styles.toggleTrack, values.reducedMotion && styles.toggleTrackOn]}>
              <View style={[styles.toggleThumb, values.reducedMotion && styles.toggleThumbOn]} />
            </View>
          </Pressable>

          <AppButton label="Save Settings" onPress={handleSubmit} />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  content: {
    gap: 14,
    padding: 18,
    paddingBottom: 34,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldHalf: {
    minWidth: 0,
    flex: 1,
  },
  toggleRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  toggleText: {
    minWidth: 0,
    flex: 1,
    gap: 3,
  },
  toggleTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  toggleBody: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  toggleTrack: {
    width: 52,
    height: 30,
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderRadius: 15,
    backgroundColor: colors.border,
  },
  toggleTrackOn: {
    backgroundColor: colors.primary,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  toggleThumbOn: {
    alignSelf: 'flex-end',
  },
  pressed: {
    opacity: 0.78,
  },
});
