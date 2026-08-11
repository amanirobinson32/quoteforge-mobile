import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRecords } from '@/src/state/RecordsContext';
import { AppButton } from '@/src/ui/AppButton';
import { Banner } from '@/src/ui/Banner';
import { EmptyState } from '@/src/ui/EmptyState';
import { JobCard, QuoteCard } from '@/src/ui/RecordCards';
import { ScreenScaffold } from '@/src/ui/ScreenScaffold';
import { colors, radii } from '@/src/ui/theme';

function MetricCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

export function HomeScreen() {
  const router = useRouter();
  const {
    activeJobs,
    customerNameById,
    customers,
    isLoading,
    jobs,
    loadDemoData,
    notice,
    quotes,
    recentJobs,
    recentQuotes,
    storageError,
  } = useRecords();
  const draftedQuotes = quotes.filter((quote) => quote.status === 'Draft').length;
  const readyQuotes = quotes.filter((quote) => quote.status === 'Ready').length;
  const approvedQuotes = quotes.filter((quote) => quote.status === 'Approved').length;

  return (
    <ScreenScaffold title="QuoteForge" subtitle="Local estimating, quotes, and approvals.">
      <ScrollView contentContainerStyle={styles.content}>
        {isLoading ? <Banner tone="loading">Loading local QuoteForge records...</Banner> : null}
        {storageError ? <Banner tone="error">{storageError}</Banner> : null}
        {notice ? <Banner tone="success">{notice}</Banner> : null}

        <View style={styles.metricsGrid}>
          <MetricCard label="Customers" value={customers.length} />
          <MetricCard label="Jobs" value={jobs.length} />
          <MetricCard label="Active Jobs" value={activeJobs.length} />
          <MetricCard label="Draft Quotes" value={draftedQuotes} />
          <MetricCard label="Ready Quotes" value={readyQuotes} />
          <MetricCard label="Approved" value={approvedQuotes} />
        </View>

        <View style={styles.actionRow}>
          <AppButton fullWidth icon="+" label="Add Customer" onPress={() => router.push('/customers/new')} />
          <AppButton fullWidth icon="+" label="Add Job" onPress={() => router.push('/jobs/new')} variant="secondary" />
          <AppButton
            disabled={jobs.length === 0}
            fullWidth
            icon="+"
            label="Build Estimate"
            onPress={() => router.push('/estimates/new')}
            variant="secondary"
          />
        </View>

        {customers.length === 0 && jobs.length === 0 && !isLoading ? (
          <EmptyState
            message="Start with a customer and job, or load demo data to test estimates, quotes, approvals, export, and import."
            primaryAction={{ label: 'Add First Customer', onPress: () => router.push('/customers/new') }}
            secondaryAction={{ label: 'Load Demo Data', onPress: loadDemoData }}
            title="No local records yet"
          />
        ) : null}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Quotes</Text>
            <Text style={styles.sectionMeta}>{quotes.length} total</Text>
          </View>
          {recentQuotes.length === 0 ? <Banner>No quotes yet. Build an estimate, then create a quote.</Banner> : null}
          <View style={styles.list}>
            {recentQuotes.map((quote) => (
              <QuoteCard customerName={quote.customerSnapshot.name} key={quote.id} quote={quote} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Job Queue</Text>
            <Text style={styles.sectionMeta}>{activeJobs.length} active</Text>
          </View>

          {recentJobs.length === 0 && customers.length > 0 ? (
            <EmptyState
              message="Customers are ready. Add the first job when a walkthrough, repair, or quote request comes in."
              primaryAction={{ label: 'Add Job', onPress: () => router.push('/jobs/new') }}
              title="No jobs in the queue"
            />
          ) : null}

          <View style={styles.list}>
            {recentJobs.map((job) => (
              <JobCard customerName={customerNameById[job.customerId]} job={job} key={job.id} />
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
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    minHeight: 86,
    flexBasis: '47%',
    flexGrow: 1,
    justifyContent: 'center',
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  metricValue: {
    color: colors.primary,
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 34,
  },
  metricLabel: {
    marginTop: 4,
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  actionRow: {
    gap: 10,
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
  },
  sectionMeta: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  list: {
    gap: 10,
  },
});
