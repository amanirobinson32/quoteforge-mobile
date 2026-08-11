import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { formatCurrency } from '@/src/domain/pricing';
import { formatShortDate } from '@/src/domain/records';
import { ApprovalDraft } from '@/src/domain/types';
import { hasValidationErrors, validateApprovalDraft } from '@/src/domain/validation';
import { useRecords } from '@/src/state/RecordsContext';
import { AppButton } from '@/src/ui/AppButton';
import { Banner } from '@/src/ui/Banner';
import { EmptyState } from '@/src/ui/EmptyState';
import { TextField } from '@/src/ui/FormField';
import { ScreenScaffold } from '@/src/ui/ScreenScaffold';
import { StatusPill } from '@/src/ui/StatusPill';
import { colors, radii } from '@/src/ui/theme';

export function ApprovalScreen({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const { approvals, approveQuote, isLoading, quotes, rejectQuote, resetQuoteApproval, storageError } = useRecords();
  const quote = quotes.find((item) => item.id === quoteId);
  const approval = approvals.find((item) => item.quoteId === quoteId);
  const [values, setValues] = useState<ApprovalDraft>({
    quoteId,
    signerName: approval?.signerName ?? '',
    acceptedTerms: Boolean(approval),
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ApprovalDraft, string>>>({});
  const [submitError, setSubmitError] = useState('');

  function updateField<K extends keyof ApprovalDraft>(field: K, value: ApprovalDraft[K]) {
    setValues((currentValues) => ({ ...currentValues, [field]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }));
    setSubmitError('');
  }

  async function handleApprove() {
    const nextErrors = validateApprovalDraft(values);
    setErrors(nextErrors);
    setSubmitError('');

    if (hasValidationErrors(nextErrors)) {
      return;
    }

    try {
      await approveQuote(values);
      router.replace({
        pathname: '/quotes/[quoteId]',
        params: { quoteId },
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Quote could not be approved.');
    }
  }

  function confirmReject() {
    Alert.alert('Reject quote?', 'This keeps the quote record and marks it rejected.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            await rejectQuote(quoteId);
            router.replace({
              pathname: '/quotes/[quoteId]',
              params: { quoteId },
            });
          } catch (error) {
            setSubmitError(error instanceof Error ? error.message : 'Quote could not be rejected.');
          }
        },
      },
    ]);
  }

  function confirmReset() {
    Alert.alert('Reset approval?', 'The typed approval record will be removed from this local device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          try {
            await resetQuoteApproval(quoteId);
          } catch (error) {
            setSubmitError(error instanceof Error ? error.message : 'Approval could not be reset.');
          }
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <ScreenScaffold showBack title="Approval">
        <View style={styles.loadingWrap}>
          <Banner tone="loading">Loading approval...</Banner>
        </View>
      </ScreenScaffold>
    );
  }

  if (!quote) {
    return (
      <ScreenScaffold showBack title="Approval">
        <View style={styles.loadingWrap}>
          <EmptyState message="This quote record is not available on this device." title="Quote not found" />
        </View>
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold
      rightAction={<StatusPill status={quote.status} />}
      showBack
      subtitle={`${quote.quoteNumber} / ${formatCurrency(quote.pricingSnapshot.totalCents)}`}
      title="Quote Approval">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {storageError ? <Banner tone="error">{storageError}</Banner> : null}
        {submitError ? <Banner tone="error">{submitError}</Banner> : null}
        {hasValidationErrors(errors) ? <Banner tone="error">Fix the highlighted approval fields.</Banner> : null}

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Customer</Text>
          <Text style={styles.cardTitle}>{quote.customerSnapshot.name}</Text>
          <Text style={styles.cardBody}>{quote.jobSnapshot.title}</Text>
          <Text style={styles.cardAmount}>{formatCurrency(quote.pricingSnapshot.totalCents)}</Text>
        </View>

        {approval ? (
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Approved Locally</Text>
            <Text style={styles.cardTitle}>{approval.signerName}</Text>
            <Text style={styles.cardBody}>Typed approval accepted on {formatShortDate(approval.signedAt)}.</Text>
            <AppButton label="Reset Approval" onPress={confirmReset} variant="secondary" />
          </View>
        ) : (
          <View style={styles.formSection}>
            <Banner>
              This is a local typed approval for QuoteForge records only. Signature capture and external signing come later.
            </Banner>
            <TextField
              autoCapitalize="words"
              error={errors.signerName}
              label="Signer Name"
              onChangeText={(value) => updateField('signerName', value)}
              placeholder="Customer full name"
              value={values.signerName}
            />
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: values.acceptedTerms }}
              onPress={() => updateField('acceptedTerms', !values.acceptedTerms)}
              style={({ pressed }) => [styles.checkboxRow, pressed && styles.pressed]}>
              <View style={[styles.checkbox, values.acceptedTerms && styles.checkboxChecked]}>
                <Text style={styles.checkboxMark}>{values.acceptedTerms ? 'X' : ''}</Text>
              </View>
              <View style={styles.checkboxTextWrap}>
                <Text style={styles.checkboxTitle}>I accept the quote terms.</Text>
                <Text style={styles.checkboxBody}>{quote.terms}</Text>
                {errors.acceptedTerms ? <Text style={styles.errorText}>{errors.acceptedTerms}</Text> : null}
              </View>
            </Pressable>
            <AppButton label="Approve Quote" onPress={handleApprove} />
          </View>
        )}

        <AppButton label="Reject Quote" onPress={confirmReject} variant="secondary" />
      </ScrollView>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    padding: 18,
    paddingBottom: 34,
  },
  loadingWrap: {
    padding: 18,
  },
  card: {
    gap: 9,
    padding: 15,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  cardTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
  },
  cardBody: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  cardAmount: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '900',
  },
  formSection: {
    gap: 14,
  },
  checkboxRow: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  checkbox: {
    width: 26,
    height: 26,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  checkboxChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  checkboxMark: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '900',
  },
  checkboxTextWrap: {
    minWidth: 0,
    flex: 1,
    gap: 5,
  },
  checkboxTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  checkboxBody: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.78,
  },
});
