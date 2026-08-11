import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '@/src/domain/pricing';
import { useRecords } from '@/src/state/RecordsContext';
import { Banner } from '@/src/ui/Banner';
import { EmptyState } from '@/src/ui/EmptyState';
import { QuoteCard } from '@/src/ui/RecordCards';
import { ScreenScaffold } from '@/src/ui/ScreenScaffold';
import { colors, radii } from '@/src/ui/theme';

export function QuoteVersionHistoryScreen({ quoteId }: { quoteId: string }) {
  const { isLoading, quotes } = useRecords();
  const quote = quotes.find((item) => item.id === quoteId);
  const versions = quote
    ? quotes
        .filter((item) => item.quoteNumber === quote.quoteNumber)
        .sort((a, b) => b.version - a.version)
    : [];

  if (isLoading) {
    return (
      <ScreenScaffold showBack title="Versions">
        <View style={styles.loadingWrap}>
          <Banner tone="loading">Loading quote versions...</Banner>
        </View>
      </ScreenScaffold>
    );
  }

  if (!quote) {
    return (
      <ScreenScaffold showBack title="Versions">
        <View style={styles.loadingWrap}>
          <EmptyState message="This quote record is not available on this device." title="Quote not found" />
        </View>
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold
      showBack
      subtitle={`${versions.length} local version${versions.length === 1 ? '' : 's'}`}
      title={`${quote.quoteNumber} Versions`}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Latest Total</Text>
          <Text style={styles.summaryValue}>{formatCurrency(versions[0]?.pricingSnapshot.totalCents ?? 0)}</Text>
          <Text style={styles.summaryMeta}>
            Each quote version stores its own customer, job, line item, pricing, and business snapshots.
          </Text>
        </View>

        <View style={styles.list}>
          {versions.map((version) => (
            <View key={version.id} style={version.id === quoteId ? styles.currentWrap : undefined}>
              {version.id === quoteId ? <Text style={styles.currentLabel}>Current screen</Text> : null}
              <QuoteCard customerName={version.customerSnapshot.name} quote={version} />
            </View>
          ))}
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
  summaryCard: {
    gap: 5,
    padding: 15,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  summaryValue: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: '900',
  },
  summaryMeta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  list: {
    gap: 10,
  },
  currentWrap: {
    gap: 6,
  },
  currentLabel: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});
