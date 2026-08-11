import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { formatCurrency } from '@/src/domain/pricing';
import { useRecords } from '@/src/state/RecordsContext';
import { AppButton } from '@/src/ui/AppButton';
import { Banner } from '@/src/ui/Banner';
import { ScreenScaffold } from '@/src/ui/ScreenScaffold';
import { colors, radii } from '@/src/ui/theme';

function SettingsRow({
  body,
  label,
  onPress,
}: {
  body: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.rowCard, pressed && styles.pressed]}>
      <View style={styles.rowText}>
        <Text style={styles.rowTitle}>{label}</Text>
        <Text style={styles.rowBody}>{body}</Text>
      </View>
      <Text style={styles.rowArrow}>{'>'}</Text>
    </Pressable>
  );
}

export function SettingsScreen() {
  const router = useRouter();
  const {
    customers,
    estimates,
    jobs,
    laborTemplates,
    loadDemoData,
    materialTemplates,
    notice,
    quotes,
    settings,
    storageError,
  } = useRecords();
  const quoteTotalCents = quotes.reduce((sum, quote) => sum + quote.pricingSnapshot.totalCents, 0);

  function confirmDemoData() {
    Alert.alert('Load demo data?', 'Demo records are added to your current local data and do not overwrite it.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Load Demo Data', onPress: loadDemoData },
    ]);
  }

  return (
    <ScreenScaffold subtitle="Local workspace and defaults" title="Settings">
      <ScrollView contentContainerStyle={styles.content}>
        {storageError ? <Banner tone="error">{storageError}</Banner> : null}
        {notice ? <Banner tone="success">{notice}</Banner> : null}

        <View style={styles.businessCard}>
          <Text style={styles.businessLabel}>Business</Text>
          <Text style={styles.businessTitle}>{settings.businessName}</Text>
          <Text style={styles.businessMeta}>
            {settings.contractorName || 'Contractor name not set'} / {settings.businessPhone || 'Phone not set'}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{customers.length}</Text>
            <Text style={styles.statLabel}>Customers</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{jobs.length}</Text>
            <Text style={styles.statLabel}>Jobs</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{estimates.length}</Text>
            <Text style={styles.statLabel}>Estimates</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{quotes.length}</Text>
            <Text style={styles.statLabel}>Quotes</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardLabel}>Local Quote Value</Text>
          <Text style={styles.cardAmount}>{formatCurrency(quoteTotalCents)}</Text>
          <Text style={styles.cardBody}>All records are stored on this device through AsyncStorage.</Text>
        </View>

        <View style={styles.list}>
          <SettingsRow
            body="Business identity, tax, markup, quote numbering, and default terms."
            label="App Settings"
            onPress={() => router.push('/settings/app')}
          />
          <SettingsRow
            body={`${laborTemplates.length} labor and ${materialTemplates.length} material templates`}
            label="Template Library"
            onPress={() => router.push('/settings/templates')}
          />
          <SettingsRow
            body="Export a JSON backup, import a backup, load demos, or clear local data."
            label="Data"
            onPress={() => router.push('/settings/data')}
          />
        </View>

        <AppButton label="Load Demo Data" onPress={confirmDemoData} variant="secondary" />
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
  businessCard: {
    gap: 5,
    padding: 16,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  businessLabel: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  businessTitle: {
    color: colors.primaryDark,
    fontSize: 24,
    fontWeight: '900',
  },
  businessMeta: {
    color: colors.text,
    fontSize: 13,
    lineHeight: 19,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  stat: {
    minWidth: '47%',
    flexGrow: 1,
    gap: 3,
    padding: 13,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  statValue: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  statLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  card: {
    gap: 5,
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
  cardAmount: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '900',
  },
  cardBody: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  list: {
    gap: 10,
  },
  rowCard: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  rowText: {
    minWidth: 0,
    flex: 1,
    gap: 4,
  },
  rowTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  rowBody: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  rowArrow: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.78,
  },
});
