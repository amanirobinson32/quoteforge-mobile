import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { formatShortDate } from '@/src/domain/records';
import { jobStatuses } from '@/src/domain/types';
import { useRecords } from '@/src/state/RecordsContext';
import { AppButton } from '@/src/ui/AppButton';
import { Banner } from '@/src/ui/Banner';
import { EmptyState } from '@/src/ui/EmptyState';
import { EstimateCard, QuoteCard } from '@/src/ui/RecordCards';
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

export function JobDetailScreen({ jobId }: { jobId: string }) {
  const router = useRouter();
  const {
    customerNameById,
    customers,
    deleteJob,
    estimates,
    isLoading,
    jobs,
    notice,
    quotes,
    storageError,
    updateJobStatus,
  } = useRecords();
  const job = jobs.find((item) => item.id === jobId);
  const customer = job ? customers.find((item) => item.id === job.customerId) : undefined;
  const jobEstimates = estimates.filter((estimate) => estimate.jobId === jobId);
  const jobQuotes = quotes.filter((quote) => quote.jobId === jobId);
  const latestQuote = jobQuotes[0];

  function confirmDelete() {
    Alert.alert('Delete job?', 'Jobs with estimates or quotes are protected from deletion.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteJob(jobId);
            router.back();
          } catch (error) {
            Alert.alert('Job not deleted', error instanceof Error ? error.message : 'Delete failed.');
          }
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <ScreenScaffold showBack title="Job">
        <View style={styles.loadingWrap}>
          <Banner tone="loading">Loading job...</Banner>
        </View>
      </ScreenScaffold>
    );
  }

  if (!job) {
    return (
      <ScreenScaffold showBack title="Job">
        <View style={styles.loadingWrap}>
          <EmptyState message="This job record is not available on this device." title="Job not found" />
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
              pathname: '/jobs/[jobId]/edit',
              params: { jobId },
            })
          }
          small
          variant="secondary"
        />
      }
      showBack
      subtitle={customerNameById[job.customerId] || 'Unassigned customer'}
      title={job.title}>
      <ScrollView contentContainerStyle={styles.content}>
        {storageError ? <Banner tone="error">{storageError}</Banner> : null}
        {notice ? <Banner tone="success">{notice}</Banner> : null}

        <View style={styles.card}>
          <StatusPill status={job.status} />
          <DetailRow label="Customer" value={customerNameById[job.customerId] || 'Unassigned customer'} />
          <DetailRow label="Job Address" value={job.jobAddress} />
          <DetailRow label="Description" value={job.description} />
          <DetailRow label="Latest Quote" value={latestQuote ? `${latestQuote.quoteNumber} v${latestQuote.version} / ${latestQuote.status}` : 'None'} />
          <DetailRow label="Created" value={formatShortDate(job.createdAt)} />
          <DetailRow label="Updated" value={formatShortDate(job.updatedAt)} />
        </View>

        <View style={styles.actions}>
          <AppButton
            icon="+"
            label="Build Estimate"
            onPress={() =>
              router.push({
                pathname: '/estimates/new',
                params: { jobId },
              })
            }
          />
          {latestQuote ? (
            <AppButton
              label="View Latest Quote"
              onPress={() =>
                router.push({
                  pathname: '/quotes/[quoteId]',
                  params: { quoteId: latestQuote.id },
                })
              }
              variant="secondary"
            />
          ) : null}
          {customer ? (
            <AppButton
              label="Open Customer"
              onPress={() =>
                router.push({
                  pathname: '/customers/[customerId]',
                  params: { customerId: customer.id },
                })
              }
              variant="secondary"
            />
          ) : null}
          <AppButton label="Delete Job" onPress={confirmDelete} variant="secondary" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Change Status</Text>
          <View style={styles.statusGrid}>
            {jobStatuses.map((status) => (
              <Pressable
                accessibilityRole="button"
                key={status}
                onPress={() => updateJobStatus(jobId, status)}
                style={({ pressed }) => [
                  styles.statusOption,
                  job.status === status && styles.statusSelected,
                  pressed && styles.pressed,
                ]}>
                <StatusPill status={status} />
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estimates</Text>
          {jobEstimates.length === 0 ? <Banner>No estimates for this job yet.</Banner> : null}
          <View style={styles.list}>
            {jobEstimates.map((estimate) => (
              <EstimateCard estimate={estimate} jobTitle={job.title} key={estimate.id} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quotes</Text>
          {jobQuotes.length === 0 ? <Banner>No quotes for this job yet.</Banner> : null}
          <View style={styles.list}>
            {jobQuotes.map((quote) => (
              <QuoteCard customerName={quote.customerSnapshot.name} key={quote.id} quote={quote} />
            ))}
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
  list: {
    gap: 10,
  },
});
