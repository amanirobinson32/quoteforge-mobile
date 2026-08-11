import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { formatCurrency, pricingOrderDescription } from '@/src/domain/pricing';
import { formatShortDate } from '@/src/domain/records';
import { quoteStatuses } from '@/src/domain/types';
import { useRecords } from '@/src/state/RecordsContext';
import { AppButton } from '@/src/ui/AppButton';
import { Banner } from '@/src/ui/Banner';
import { EmptyState } from '@/src/ui/EmptyState';
import { ScreenScaffold } from '@/src/ui/ScreenScaffold';
import { StatusPill } from '@/src/ui/StatusPill';
import { colors, radii } from '@/src/ui/theme';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || 'Not provided'}</Text>
    </View>
  );
}

export function QuoteDetailScreen({ quoteId }: { quoteId: string }) {
  const router = useRouter();
  const {
    approvals,
    estimates,
    isLoading,
    notice,
    quotes,
    rejectQuote,
    resetQuoteApproval,
    reviseQuote,
    storageError,
    updateQuoteStatus,
  } = useRecords();
  const quote = quotes.find((item) => item.id === quoteId);
  const estimate = quote ? estimates.find((item) => item.id === quote.estimateId) : undefined;
  const approval = approvals.find((item) => item.quoteId === quoteId);
  const versionCount = quote ? quotes.filter((item) => item.quoteNumber === quote.quoteNumber).length : 0;

  async function handleRevise() {
    if (!quote) return;

    try {
      const newQuote = await reviseQuote(quote.id);
      router.replace({
        pathname: '/quotes/[quoteId]',
        params: { quoteId: newQuote.id },
      });
    } catch (error) {
      Alert.alert('Revision not created', error instanceof Error ? error.message : 'Try again.');
    }
  }

  function confirmReject() {
    if (!quote) return;

    Alert.alert('Reject quote?', 'This keeps the quote in history and marks it rejected.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reject',
        style: 'destructive',
        onPress: async () => {
          try {
            await rejectQuote(quote.id);
          } catch (error) {
            Alert.alert('Quote not rejected', error instanceof Error ? error.message : 'Try again.');
          }
        },
      },
    ]);
  }

  function confirmResetApproval() {
    if (!quote) return;

    Alert.alert('Reset approval?', 'The typed approval record will be removed from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: async () => {
          try {
            await resetQuoteApproval(quote.id);
          } catch (error) {
            Alert.alert('Approval not reset', error instanceof Error ? error.message : 'Try again.');
          }
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <ScreenScaffold showBack title="Quote">
        <View style={styles.loadingWrap}>
          <Banner tone="loading">Loading quote...</Banner>
        </View>
      </ScreenScaffold>
    );
  }

  if (!quote) {
    return (
      <ScreenScaffold showBack title="Quote">
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
      subtitle={`${quote.customerSnapshot.name} / ${formatCurrency(quote.pricingSnapshot.totalCents)}`}
      title={`${quote.quoteNumber} v${quote.version}`}>
      <ScrollView contentContainerStyle={styles.content}>
        {storageError ? <Banner tone="error">{storageError}</Banner> : null}
        {notice ? <Banner tone="success">{notice}</Banner> : null}

        <View style={styles.card}>
          <DetailRow label="Customer" value={quote.customerSnapshot.name} />
          <DetailRow label="Project" value={quote.jobSnapshot.title} />
          <DetailRow label="Job Address" value={quote.jobSnapshot.jobAddress} />
          <DetailRow label="Estimate" value={estimate ? estimate.title : 'Snapshot only'} />
          <DetailRow label="Versions" value={`${versionCount} saved version${versionCount === 1 ? '' : 's'}`} />
          <DetailRow label="Created" value={formatShortDate(quote.createdAt)} />
          <DetailRow label="Updated" value={formatShortDate(quote.updatedAt)} />
          {approval ? <DetailRow label="Approved By" value={`${approval.signerName} on ${formatShortDate(approval.signedAt)}`} /> : null}
        </View>

        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Quote Total</Text>
          <Text style={styles.totalValue}>{formatCurrency(quote.pricingSnapshot.totalCents)}</Text>
          <Text style={styles.totalMeta}>{pricingOrderDescription}</Text>
        </View>

        <View style={styles.actions}>
          <AppButton
            label="Preview and Export"
            onPress={() =>
              router.push({
                pathname: '/quotes/[quoteId]/preview',
                params: { quoteId },
              })
            }
          />
          <AppButton
            label={approval ? 'View Approval' : 'Approve Quote'}
            onPress={() =>
              router.push({
                pathname: '/quotes/[quoteId]/approval',
                params: { quoteId },
              })
            }
            variant="secondary"
          />
          <AppButton
            label="Version History"
            onPress={() =>
              router.push({
                pathname: '/quotes/[quoteId]/versions',
                params: { quoteId },
              })
            }
            variant="secondary"
          />
          {estimate ? (
            <AppButton
              label="Edit Estimate"
              onPress={() =>
                router.push({
                  pathname: '/estimates/[estimateId]/edit',
                  params: { estimateId: estimate.id },
                })
              }
              variant="secondary"
            />
          ) : null}
          <AppButton label="Create Revision" onPress={handleRevise} variant="secondary" />
          {approval ? (
            <AppButton label="Reset Approval" onPress={confirmResetApproval} variant="secondary" />
          ) : (
            <AppButton label="Reject Quote" onPress={confirmReject} variant="secondary" />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <View style={styles.statusGrid}>
            {quoteStatuses.map((status) => (
              <Pressable
                accessibilityRole="button"
                key={status}
                onPress={() => updateQuoteStatus(quote.id, status)}
                style={({ pressed }) => [
                  styles.statusOption,
                  quote.status === status && styles.statusSelected,
                  pressed && styles.pressed,
                ]}>
                <StatusPill status={status} />
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Snapshot</Text>
          <View style={styles.card}>
            <DetailRow label="Business" value={quote.businessSnapshot.businessName} />
            <DetailRow label="Customer Email" value={quote.customerSnapshot.email} />
            <DetailRow label="Customer Phone" value={quote.customerSnapshot.phone} />
            <DetailRow label="Terms" value={quote.terms} />
          </View>
        </View>
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
    gap: 14,
    padding: 15,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  detailRow: {
    gap: 4,
  },
  detailLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  detailValue: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 21,
  },
  totalCard: {
    gap: 5,
    padding: 15,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  totalLabel: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  totalValue: {
    color: colors.primaryDark,
    fontSize: 30,
    fontWeight: '900',
  },
  totalMeta: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  actions: {
    gap: 10,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'transparent',
    padding: 2,
  },
  statusSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  pressed: {
    opacity: 0.78,
  },
});
