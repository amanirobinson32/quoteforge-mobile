import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { formatCurrency } from '@/src/domain/pricing';
import { quoteStatuses, QuoteStatus } from '@/src/domain/types';
import { useRecords } from '@/src/state/RecordsContext';
import { AppButton } from '@/src/ui/AppButton';
import { Banner } from '@/src/ui/Banner';
import { EmptyState } from '@/src/ui/EmptyState';
import { TextField } from '@/src/ui/FormField';
import { QuoteCard } from '@/src/ui/RecordCards';
import { ScreenScaffold } from '@/src/ui/ScreenScaffold';
import { StatusPill } from '@/src/ui/StatusPill';
import { colors, radii } from '@/src/ui/theme';

type QuoteFilter = 'All' | QuoteStatus;

export function QuotesScreen() {
  const router = useRouter();
  const { isLoading, jobs, loadDemoData, notice, quotes, storageError } = useRecords();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<QuoteFilter>('All');

  const filteredQuotes = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return quotes.filter((quote) => {
      const matchesFilter = filter === 'All' || quote.status === filter;
      const matchesSearch =
        !normalizedSearch ||
        [
          quote.quoteNumber,
          quote.status,
          quote.customerSnapshot.name,
          quote.customerSnapshot.email,
          quote.jobSnapshot.title,
          quote.jobSnapshot.jobAddress,
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesFilter && matchesSearch;
    });
  }, [filter, quotes, search]);

  const readyTotalCents = useMemo(
    () =>
      quotes
        .filter((quote) => quote.status === 'Ready' || quote.status === 'Sent')
        .reduce((sum, quote) => sum + quote.pricingSnapshot.totalCents, 0),
    [quotes],
  );

  return (
    <ScreenScaffold
      rightAction={
        <AppButton
          disabled={jobs.length === 0}
          icon="+"
          label="Estimate"
          onPress={() => router.push('/estimates/new')}
          small
        />
      }
      subtitle={`${quotes.length} quotes / ${formatCurrency(readyTotalCents)} ready or sent`}
      title="Quotes">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {isLoading ? <Banner tone="loading">Loading quote records...</Banner> : null}
        {storageError ? <Banner tone="error">{storageError}</Banner> : null}
        {notice ? <Banner tone="success">{notice}</Banner> : null}

        <TextField
          autoCapitalize="none"
          label="Search Quotes"
          onChangeText={setSearch}
          placeholder="Number, customer, status, or job"
          returnKeyType="search"
          value={search}
        />

        <View style={styles.filterRow}>
          {(['All', ...quoteStatuses] as QuoteFilter[]).map((status) => {
            const isSelected = filter === status;

            return (
              <Pressable
                accessibilityRole="button"
                key={status}
                onPress={() => setFilter(status)}
                style={({ pressed }) => [
                  styles.filterChip,
                  isSelected && styles.filterChipSelected,
                  pressed && styles.pressed,
                ]}>
                {status === 'All' ? (
                  <Text style={[styles.filterText, isSelected && styles.filterTextSelected]}>All</Text>
                ) : (
                  <StatusPill status={status} />
                )}
              </Pressable>
            );
          })}
        </View>

        {!isLoading && quotes.length === 0 ? (
          <EmptyState
            message="Create a quote from a saved estimate when the scope and pricing are ready."
            primaryAction={{
              label: jobs.length > 0 ? 'Build Estimate' : 'Add Job',
              onPress: () => router.push(jobs.length > 0 ? '/estimates/new' : '/jobs/new'),
            }}
            secondaryAction={{ label: 'Load Demo Data', onPress: loadDemoData }}
            title="No quotes yet"
          />
        ) : null}

        {quotes.length > 0 && filteredQuotes.length === 0 ? <Banner>No quotes match that view.</Banner> : null}

        <View style={styles.list}>
          {filteredQuotes.map((quote) => (
            <QuoteCard customerName={quote.customerSnapshot.name} key={quote.id} quote={quote} />
          ))}
        </View>
      </ScrollView>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
    padding: 18,
    paddingBottom: 34,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    minHeight: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  filterChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  filterText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  filterTextSelected: {
    color: colors.primaryDark,
  },
  pressed: {
    opacity: 0.78,
  },
  list: {
    gap: 10,
  },
});
