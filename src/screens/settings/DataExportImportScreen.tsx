import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Alert, ScrollView, Share as NativeShare, StyleSheet, Text, View } from 'react-native';

import { useRecords } from '@/src/state/RecordsContext';
import { AppButton } from '@/src/ui/AppButton';
import { Banner } from '@/src/ui/Banner';
import { ScreenScaffold } from '@/src/ui/ScreenScaffold';
import { colors, radii } from '@/src/ui/theme';

function SnapshotStat({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export function DataExportImportScreen() {
  const {
    clearAllData,
    customers,
    estimates,
    exportSnapshotString,
    importSnapshotString,
    jobs,
    loadDemoData,
    notice,
    quotes,
    storageError,
  } = useRecords();

  async function exportBackup() {
    try {
      const backup = exportSnapshotString();
      const cacheDirectory = FileSystem.cacheDirectory;

      if (!cacheDirectory) {
        await NativeShare.share({ message: backup, title: 'QuoteForge backup' });
        return;
      }

      const fileUri = `${cacheDirectory}quoteforge-backup-${Date.now()}.json`;
      await FileSystem.writeAsStringAsync(fileUri, backup, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(fileUri, {
          dialogTitle: 'Share QuoteForge backup',
          mimeType: 'application/json',
          UTI: 'public.json',
        });
      } else {
        await NativeShare.share({ message: backup, title: 'QuoteForge backup' });
      }
    } catch (error) {
      Alert.alert('Export failed', error instanceof Error ? error.message : 'Try again.');
    }
  }

  async function pickImportFile() {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
        type: ['application/json', 'text/json', 'text/plain'],
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];
      const fileText = await FileSystem.readAsStringAsync(asset.uri, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      Alert.alert('Import backup?', 'This replaces the current local QuoteForge workspace on this device.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Import',
          onPress: async () => {
            try {
              await importSnapshotString(fileText);
            } catch (error) {
              Alert.alert('Import failed', error instanceof Error ? error.message : 'Selected file is not valid.');
            }
          },
        },
      ]);
    } catch (error) {
      Alert.alert('Import failed', error instanceof Error ? error.message : 'Try again.');
    }
  }

  function confirmClear() {
    Alert.alert('Clear all local data?', 'This removes all QuoteForge records from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear Data',
        style: 'destructive',
        onPress: async () => {
          try {
            await clearAllData();
          } catch (error) {
            Alert.alert('Clear failed', error instanceof Error ? error.message : 'Try again.');
          }
        },
      },
    ]);
  }

  function confirmDemoData() {
    Alert.alert('Load demo data?', 'Demo records are added to your current local data and do not overwrite it.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Load Demo Data', onPress: loadDemoData },
    ]);
  }

  return (
    <ScreenScaffold showBack subtitle="Local backups only" title="Data">
      <ScrollView contentContainerStyle={styles.content}>
        {storageError ? <Banner tone="error">{storageError}</Banner> : null}
        {notice ? <Banner tone="success">{notice}</Banner> : null}

        <View style={styles.statsGrid}>
          <SnapshotStat label="Customers" value={customers.length} />
          <SnapshotStat label="Jobs" value={jobs.length} />
          <SnapshotStat label="Estimates" value={estimates.length} />
          <SnapshotStat label="Quotes" value={quotes.length} />
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Backup Snapshot</Text>
          <Text style={styles.cardBody}>
            Export and import use the versioned local JSON snapshot. No backend, accounts, or cloud credentials are used.
          </Text>
        </View>

        <View style={styles.actions}>
          <AppButton label="Export JSON Backup" onPress={exportBackup} />
          <AppButton label="Import JSON Backup" onPress={pickImportFile} variant="secondary" />
          <AppButton label="Load Demo Data" onPress={confirmDemoData} variant="secondary" />
          <AppButton label="Clear Local Data" onPress={confirmClear} variant="secondary" />
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
    gap: 7,
    padding: 15,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  cardBody: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  actions: {
    gap: 10,
  },
});
