import { useMemo } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { formatShortDate } from '@/src/domain/records';
import { useRecords } from '@/src/state/RecordsContext';
import { AppButton } from '@/src/ui/AppButton';
import { Banner } from '@/src/ui/Banner';
import { EmptyState } from '@/src/ui/EmptyState';
import { JobCard, QuoteCard } from '@/src/ui/RecordCards';
import { ScreenScaffold } from '@/src/ui/ScreenScaffold';
import { colors, radii } from '@/src/ui/theme';

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value || 'Not provided'}</Text>
    </View>
  );
}

export function CustomerDetailScreen({ customerId }: { customerId: string }) {
  const router = useRouter();
  const { customerNameById, customers, deleteCustomer, isLoading, jobs, notice, quotes, storageError } = useRecords();
  const customer = customers.find((item) => item.id === customerId);
  const customerJobs = useMemo(() => jobs.filter((job) => job.customerId === customerId), [customerId, jobs]);
  const customerQuotes = useMemo(
    () => quotes.filter((quote) => quote.customerSnapshot.id === customerId).slice(0, 4),
    [customerId, quotes],
  );

  function confirmDelete() {
    Alert.alert('Delete customer?', 'Customers with linked jobs or quotes are protected from deletion.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteCustomer(customerId);
            router.back();
          } catch (error) {
            Alert.alert('Customer not deleted', error instanceof Error ? error.message : 'Delete failed.');
          }
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <ScreenScaffold showBack title="Customer">
        <View style={styles.loadingWrap}>
          <Banner tone="loading">Loading customer...</Banner>
        </View>
      </ScreenScaffold>
    );
  }

  if (!customer) {
    return (
      <ScreenScaffold showBack title="Customer">
        <View style={styles.loadingWrap}>
          <EmptyState message="This customer record is not available on this device." title="Customer not found" />
        </View>
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold
      rightAction={
        <AppButton
          label="Edit"
          onPress={() =>
            router.push({
              pathname: '/customers/[customerId]/edit',
              params: { customerId },
            })
          }
          small
          variant="secondary"
        />
      }
      showBack
      subtitle={`${customerJobs.length} job${customerJobs.length === 1 ? '' : 's'} / ${customerQuotes.length} recent quote${customerQuotes.length === 1 ? '' : 's'}`}
      title={customer.name}>
      <ScrollView contentContainerStyle={styles.content}>
        {storageError ? <Banner tone="error">{storageError}</Banner> : null}
        {notice ? <Banner tone="success">{notice}</Banner> : null}

        <View style={styles.card}>
          <DetailRow label="Phone" value={customer.phone} />
          <DetailRow label="Email" value={customer.email} />
          <DetailRow label="Address" value={customer.address} />
          <DetailRow label="Notes" value={customer.notes} />
          <DetailRow label="Created" value={formatShortDate(customer.createdAt)} />
        </View>

        <View style={styles.actions}>
          <AppButton
            icon="+"
            label="Add Job for Customer"
            onPress={() =>
              router.push({
                pathname: '/jobs/new',
                params: { customerId },
              })
            }
          />
          <AppButton label="Delete Customer" onPress={confirmDelete} variant="secondary" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Quote Activity</Text>
          {customerQuotes.length === 0 ? <Banner>No quotes for this customer yet.</Banner> : null}
          <View style={styles.list}>
            {customerQuotes.map((quote) => (
              <QuoteCard customerName={customer.name} key={quote.id} quote={quote} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Customer Jobs</Text>
          {customerJobs.length === 0 ? (
            <EmptyState
              message="Create the first job when a request or site visit comes in."
              primaryAction={{
                label: 'Add Job',
                onPress: () =>
                  router.push({
                    pathname: '/jobs/new',
                    params: { customerId },
                  }),
              }}
              title="No jobs yet"
            />
          ) : (
            <View style={styles.list}>
              {customerJobs.map((job) => (
                <JobCard customerName={customerNameById[job.customerId]} job={job} key={job.id} />
              ))}
            </View>
          )}
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
    gap: 13,
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
  list: {
    gap: 10,
  },
});
