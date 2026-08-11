import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import { formatCurrency } from '@/src/domain/pricing';
import { LaborTemplate, MaterialTemplate } from '@/src/domain/types';
import { useRecords } from '@/src/state/RecordsContext';
import { AppButton } from '@/src/ui/AppButton';
import { Banner } from '@/src/ui/Banner';
import { EmptyState } from '@/src/ui/EmptyState';
import { TextField } from '@/src/ui/FormField';
import { ScreenScaffold } from '@/src/ui/ScreenScaffold';
import { colors, radii } from '@/src/ui/theme';

type TemplateTab = 'labor' | 'materials';

function LaborTemplateCard({ template }: { template: LaborTemplate }) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: '/settings/templates/labor/[templateId]',
          params: { templateId: template.id },
        })
      }
      style={({ pressed }) => [styles.templateCard, pressed && styles.pressed]}>
      <View style={styles.templateHeader}>
        <View style={styles.templateText}>
          <Text style={styles.templateTitle}>{template.name}</Text>
          <Text numberOfLines={2} style={styles.templateBody}>
            {template.description || 'No description'}
          </Text>
        </View>
        <Text style={styles.templateAmount}>{formatCurrency(template.defaultRateCents)}</Text>
      </View>
      <Text style={styles.templateMeta}>
        {template.defaultUnit} / {template.defaultMarkupPercent}% markup
      </Text>
    </Pressable>
  );
}

function MaterialTemplateCard({ template }: { template: MaterialTemplate }) {
  const router = useRouter();

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() =>
        router.push({
          pathname: '/settings/templates/material/[templateId]',
          params: { templateId: template.id },
        })
      }
      style={({ pressed }) => [styles.templateCard, pressed && styles.pressed]}>
      <View style={styles.templateHeader}>
        <View style={styles.templateText}>
          <Text style={styles.templateTitle}>{template.name}</Text>
          <Text numberOfLines={2} style={styles.templateBody}>
            {template.description || 'No description'}
          </Text>
        </View>
        <Text style={styles.templateAmount}>{formatCurrency(template.defaultCostCents)}</Text>
      </View>
      <Text style={styles.templateMeta}>
        {template.defaultUnit} / {template.defaultMarkupPercent}% markup
      </Text>
    </Pressable>
  );
}

export function TemplateLibraryScreen() {
  const router = useRouter();
  const { laborTemplates, materialTemplates, notice, storageError } = useRecords();
  const [tab, setTab] = useState<TemplateTab>('labor');
  const [search, setSearch] = useState('');

  const filteredLaborTemplates = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return laborTemplates.filter((template) =>
      [template.name, template.description, template.defaultUnit].join(' ').toLowerCase().includes(normalizedSearch),
    );
  }, [laborTemplates, search]);

  const filteredMaterialTemplates = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return materialTemplates.filter((template) =>
      [template.name, template.description, template.defaultUnit].join(' ').toLowerCase().includes(normalizedSearch),
    );
  }, [materialTemplates, search]);

  const visibleCount = tab === 'labor' ? filteredLaborTemplates.length : filteredMaterialTemplates.length;

  return (
    <ScreenScaffold showBack subtitle="Reusable local pricing starters" title="Templates">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {storageError ? <Banner tone="error">{storageError}</Banner> : null}
        {notice ? <Banner tone="success">{notice}</Banner> : null}

        <TextField
          autoCapitalize="none"
          label="Search Templates"
          onChangeText={setSearch}
          placeholder="Name, description, or unit"
          value={search}
        />

        <View style={styles.tabRow}>
          <Pressable
            accessibilityRole="button"
            onPress={() => setTab('labor')}
            style={({ pressed }) => [styles.tab, tab === 'labor' && styles.tabSelected, pressed && styles.pressed]}>
            <Text style={[styles.tabText, tab === 'labor' && styles.tabTextSelected]}>Labor</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setTab('materials')}
            style={({ pressed }) => [styles.tab, tab === 'materials' && styles.tabSelected, pressed && styles.pressed]}>
            <Text style={[styles.tabText, tab === 'materials' && styles.tabTextSelected]}>Materials</Text>
          </Pressable>
        </View>

        <View style={styles.actions}>
          <AppButton
            icon="+"
            label="Add Labor"
            onPress={() => router.push('/settings/templates/labor/new')}
            variant={tab === 'labor' ? 'primary' : 'secondary'}
          />
          <AppButton
            icon="+"
            label="Add Material"
            onPress={() => router.push('/settings/templates/material/new')}
            variant={tab === 'materials' ? 'primary' : 'secondary'}
          />
        </View>

        {visibleCount === 0 ? (
          <EmptyState
            message="Templates are optional starters for estimates. They can be copied into a line item and edited there."
            title={tab === 'labor' ? 'No labor templates' : 'No material templates'}
          />
        ) : null}

        <View style={styles.list}>
          {tab === 'labor'
            ? filteredLaborTemplates.map((template) => <LaborTemplateCard key={template.id} template={template} />)
            : filteredMaterialTemplates.map((template) => (
                <MaterialTemplateCard key={template.id} template={template} />
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
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 3,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
  },
  tab: {
    minHeight: 42,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
  },
  tabSelected: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '900',
  },
  tabTextSelected: {
    color: colors.primaryDark,
  },
  actions: {
    gap: 10,
  },
  list: {
    gap: 10,
  },
  templateCard: {
    gap: 9,
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  templateHeader: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  templateText: {
    minWidth: 0,
    flex: 1,
    gap: 4,
  },
  templateTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  templateBody: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  templateAmount: {
    flexShrink: 0,
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  templateMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.78,
  },
});
