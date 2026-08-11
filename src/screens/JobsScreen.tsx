import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { sortByUpdatedAt } from '@/src/domain/records';
import { jobStatuses, JobStatus } from '@/src/domain/types';
import { useRecords } from '@/src/state/RecordsContext';
import { AppButton } from '@/src/ui/AppButton';
import { Banner } from '@/src/ui/Banner';
import { EmptyState } from '@/src/ui/EmptyState';
import { TextField } from '@/src/ui/FormField';
import { JobCard } from '@/src/ui/RecordCards';
import { ScreenScaffold } from '@/src/ui/ScreenScaffold';
import { colors, radii } from '@/src/ui/theme';

type StatusFilter = 'All' | JobStatus;

export function JobsScreen() {
  const router = useRouter();
  const { activeJobs, customerNameById, customers, isLoading, jobs, loadDemoData, notice, storageError } = useRecords();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');

  const sortedJobs = useMemo(() => sortByUpdatedAt(jobs), [jobs]);
  const filteredJobs = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return sortedJobs.filter((job) => {
      const matchesStatus = statusFilter === 'All' || job.status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        [job.title, job.jobAddress, job.description, job.status, customerNameById[job.customerId]]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [customerNameById, search, sortedJobs, statusFilter]);

  return (
    <ScreenScaffold
      rightAction={<AppButton icon="+" label="Add" onPress={() => router.push('/jobs/new')} small />}
      title="Jobs"
      subtitle={`${activeJobs.length} active in the queue`}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {isLoading ? <Banner tone="loading">Loading job queue...</Banner> : null}
        {storageError ? <Banner tone="error">{storageError}</Banner> : null}
        {notice ? <Banner tone="success">{notice}</Banner> : null}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryValue}>{jobs.length}</Text>
          <Text style={styles.summaryLabel}>Total jobs saved locally</Text>
        </View>

        <TextField
          autoCapitalize="none"
          label="Search jobs"
          onChangeText={setSearch}
          placeholder="Title, status, customer, or address"
          returnKeyType="search"
          value={search}
        />

        <View style={styles.filterWrap}>
          {(['All', ...jobStatuses] as StatusFilter[]).map((status) => (
            <Pressable
              accessibilityRole="button"
              key={status}
              onPress={() => setStatusFilter(status)}
              style={({ pressed }) => [
                styles.filterChip,
                statusFilter === status && styles.filterChipSelected,
                pressed && styles.pressed,
              ]}>
              <Text style={[styles.filterText, statusFilter === status && styles.filterTextSelected]}>{status}</Text>
            </Pressable>
          ))}
        </View>

        {!isLoading && jobs.length === 0 ? (
          <EmptyState
            message={
              customers.length === 0
                ? 'Add a customer first, then create the first job record.'
                : 'Capture the first site visit, repair request, or quote follow-up.'
            }
            primaryAction={{
              label: customers.length === 0 ? 'Add Customer' : 'Add Job',
              onPress: () => router.push(customers.length === 0 ? '/customers/new' : '/jobs/new'),
            }}
            secondaryAction={{ label: 'Load Demo Data', onPress: loadDemoData }}
            title="No jobs yet"
          />
        ) : null}

        {jobs.length > 0 && filteredJobs.length === 0 ? <Banner>No jobs match that filter.</Banner> : null}

        <View style={styles.list}>
          {filteredJobs.map((job) => (
            <JobCard customerName={customerNameById[job.customerId]} job={job} key={job.id} />
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
  summaryCard: {
    padding: 15,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.slate,
  },
  summaryValue: {
    color: colors.surface,
    fontSize: 30,
    fontWeight: '900',
  },
  summaryLabel: {
    color: '#d9dfd8',
    fontSize: 13,
    fontWeight: '800',
  },
  filterWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterChip: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 11,
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
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
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
