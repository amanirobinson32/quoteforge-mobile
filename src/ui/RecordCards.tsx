import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { formatShortDate } from '@/src/domain/records';
import { formatCurrency } from '@/src/domain/pricing';
import { Customer, Estimate, Job, Quote } from '@/src/domain/types';

import { StatusPill } from './StatusPill';
import { colors, radii } from './theme';

type CustomerCardProps = {
  customer: Customer;
  jobCount: number;
};

type JobCardProps = {
  customerName: string;
  job: Job;
};

type QuoteCardProps = {
  customerName?: string;
  quote: Quote;
};

type EstimateCardProps = {
  estimate: Estimate;
  jobTitle?: string;
};

export function CustomerCard({ customer, jobCount }: CustomerCardProps) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: '/customers/[customerId]',
          params: { customerId: customer.id },
        })
      }
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.cardHeader}>
        <Text numberOfLines={2} style={styles.title}>
          {customer.name}
        </Text>
        <Text style={styles.count}>{jobCount} jobs</Text>
      </View>
      <Text numberOfLines={1} style={styles.body}>
        {customer.phone || customer.email || 'No contact method yet'}
      </Text>
      <Text numberOfLines={2} style={styles.meta}>
        {customer.address || 'No address saved'}
      </Text>
    </Pressable>
  );
}

export function JobCard({ customerName, job }: JobCardProps) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: '/jobs/[jobId]',
          params: { jobId: job.id },
        })
      }
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.cardHeader}>
        <View style={styles.titleStack}>
          <Text numberOfLines={2} style={styles.title}>
            {job.title}
          </Text>
          <Text numberOfLines={1} style={styles.body}>
            {customerName || 'Unassigned customer'}
          </Text>
        </View>
        <StatusPill status={job.status} />
      </View>
      <Text numberOfLines={2} style={styles.meta}>
        {job.jobAddress || 'No job address yet'}
      </Text>
      <Text style={styles.date}>Updated {formatShortDate(job.updatedAt)}</Text>
    </Pressable>
  );
}

export function QuoteCard({ customerName, quote }: QuoteCardProps) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: '/quotes/[quoteId]',
          params: { quoteId: quote.id },
        })
      }
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.cardHeader}>
        <View style={styles.titleStack}>
          <Text numberOfLines={1} style={styles.title}>
            {quote.quoteNumber} v{quote.version}
          </Text>
          <Text numberOfLines={1} style={styles.body}>
            {customerName || quote.customerSnapshot.name}
          </Text>
        </View>
        <StatusPill status={quote.status} />
      </View>
      <Text numberOfLines={2} style={styles.meta}>
        {quote.jobSnapshot.title}
      </Text>
      <View style={styles.footerRow}>
        <Text style={styles.date}>Updated {formatShortDate(quote.updatedAt)}</Text>
        <Text style={styles.amount}>{formatCurrency(quote.pricingSnapshot.totalCents)}</Text>
      </View>
    </Pressable>
  );
}

export function EstimateCard({ estimate, jobTitle }: EstimateCardProps) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: '/estimates/[estimateId]/edit',
          params: { estimateId: estimate.id },
        })
      }
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.cardHeader}>
        <View style={styles.titleStack}>
          <Text numberOfLines={2} style={styles.title}>
            {estimate.title}
          </Text>
          <Text numberOfLines={1} style={styles.body}>
            {jobTitle || 'Estimate'}
          </Text>
        </View>
        <StatusPill status={estimate.status} />
      </View>
      <View style={styles.footerRow}>
        <Text style={styles.date}>Updated {formatShortDate(estimate.updatedAt)}</Text>
        <Text style={styles.amount}>{formatCurrency(estimate.totalCents)}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: 9,
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: {
    opacity: 0.78,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleStack: {
    minWidth: 0,
    flex: 1,
  },
  title: {
    minWidth: 0,
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
    lineHeight: 22,
  },
  body: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 19,
  },
  meta: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  date: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  amount: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '900',
  },
  count: {
    flexShrink: 0,
    color: colors.primary,
    fontSize: 13,
    fontWeight: '900',
  },
});
