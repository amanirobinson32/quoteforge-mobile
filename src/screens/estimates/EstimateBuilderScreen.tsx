import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';

import {
  calculateEstimateTotals,
  calculateLineItemTotal,
  createBlankLineItem,
  createLineItemFromLaborTemplate,
  createLineItemFromMaterialTemplate,
  formatCurrency,
  formatPercent,
  parseMoneyToCents,
} from '@/src/domain/pricing';
import { createRecordId } from '@/src/domain/records';
import {
  Estimate,
  EstimateDraft,
  EstimateLineItem,
  EstimateLineItemType,
  EstimateStatus,
  estimateStatuses,
  lineItemTypes,
  PricingRule,
} from '@/src/domain/types';
import { hasValidationErrors, validateEstimateDraft, validateLineItem } from '@/src/domain/validation';
import { useRecords } from '@/src/state/RecordsContext';
import { AppButton } from '@/src/ui/AppButton';
import { Banner } from '@/src/ui/Banner';
import { EmptyState } from '@/src/ui/EmptyState';
import { TextField } from '@/src/ui/FormField';
import { ScreenScaffold } from '@/src/ui/ScreenScaffold';
import { StatusPill } from '@/src/ui/StatusPill';
import { colors, radii } from '@/src/ui/theme';

type EstimateBuilderScreenProps = {
  estimateId?: string;
  initialJobId?: string;
  mode: 'create' | 'edit';
};

type LineItemFormValues = {
  id?: string;
  type: EstimateLineItemType;
  name: string;
  description: string;
  quantity: string;
  unit: string;
  unitCost: string;
  markupPercent: string;
  taxable: boolean;
};

function moneyInput(cents: number) {
  return cents > 0 ? String(cents / 100) : '';
}

function numberInput(value: number) {
  return Number.isFinite(value) ? String(value) : '0';
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function lineItemFormFromItem(item: EstimateLineItem): LineItemFormValues {
  return {
    id: item.id,
    type: item.type,
    name: item.name,
    description: item.description,
    quantity: numberInput(item.quantity),
    unit: item.unit,
    unitCost: moneyInput(item.unitCostCents),
    markupPercent: numberInput(item.markupPercent),
    taxable: item.taxable,
  };
}

function emptyLineItemForm(sortOrder: number): LineItemFormValues {
  const blankItem = createBlankLineItem(sortOrder);

  return {
    id: blankItem.id,
    type: blankItem.type,
    name: '',
    description: '',
    quantity: '1',
    unit: 'hr',
    unitCost: '',
    markupPercent: '0',
    taxable: true,
  };
}

function lineItemFromForm(values: LineItemFormValues, sortOrder: number): EstimateLineItem {
  return calculateLineItemTotal({
    id: values.id ?? createRecordId('li'),
    type: values.type,
    name: values.name.trim(),
    description: values.description.trim(),
    quantity: toNumber(values.quantity),
    unit: values.unit.trim() || (values.type === 'labor' ? 'hr' : 'ea'),
    unitCostCents: parseMoneyToCents(values.unitCost),
    markupPercent: toNumber(values.markupPercent),
    sortOrder,
    taxable: values.taxable,
  });
}

function draftFromEstimate(estimate: Estimate): EstimateDraft {
  return {
    jobId: estimate.jobId,
    title: estimate.title,
    status: estimate.status,
    lineItems: estimate.lineItems.map((item) => ({ ...item })),
    markup: { ...estimate.markup },
    discount: { ...estimate.discount },
    taxPercent: estimate.taxPercent,
    taxable: estimate.taxable,
    adjustments: estimate.adjustments.map((adjustment) => ({ ...adjustment })),
    notes: estimate.notes,
    terms: estimate.terms,
  };
}

function defaultDraft(initialJobId: string | undefined, settingsDefaultMarkup: number, settingsDefaultTax: number, defaultTerms: string): EstimateDraft {
  return {
    jobId: initialJobId ?? '',
    title: '',
    status: 'Draft',
    lineItems: [],
    markup: { type: 'percent', value: settingsDefaultMarkup },
    discount: { type: 'fixed', value: 0 },
    taxPercent: settingsDefaultTax,
    taxable: true,
    adjustments: [],
    notes: '',
    terms: defaultTerms,
  };
}

function sortLineItems(lineItems: EstimateLineItem[]) {
  return [...lineItems].sort((a, b) => a.sortOrder - b.sortOrder);
}

function MoneyRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.moneyRow}>
      <Text style={styles.moneyLabel}>{label}</Text>
      <Text style={styles.moneyValue}>{formatCurrency(value)}</Text>
    </View>
  );
}

function PricingRuleEditor({
  label,
  onChange,
  rule,
}: {
  label: string;
  onChange: (rule: PricingRule) => void;
  rule: PricingRule;
}) {
  const displayValue = rule.type === 'fixed' ? moneyInput(rule.value) : numberInput(rule.value);

  function updateType(type: PricingRule['type']) {
    onChange({ type, value: 0 });
  }

  function updateValue(value: string) {
    onChange({
      ...rule,
      value: rule.type === 'fixed' ? parseMoneyToCents(value) : toNumber(value),
    });
  }

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.segmentRow}>
        <Pressable
          accessibilityRole="button"
          onPress={() => updateType('percent')}
          style={({ pressed }) => [styles.segment, rule.type === 'percent' && styles.segmentSelected, pressed && styles.pressed]}>
          <Text style={[styles.segmentText, rule.type === 'percent' && styles.segmentTextSelected]}>Percent</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => updateType('fixed')}
          style={({ pressed }) => [styles.segment, rule.type === 'fixed' && styles.segmentSelected, pressed && styles.pressed]}>
          <Text style={[styles.segmentText, rule.type === 'fixed' && styles.segmentTextSelected]}>Fixed</Text>
        </Pressable>
      </View>
      <TextField
        keyboardType="decimal-pad"
        label={rule.type === 'fixed' ? `${label} Amount` : `${label} %`}
        onChangeText={updateValue}
        placeholder={rule.type === 'fixed' ? '0' : '10'}
        value={displayValue}
      />
    </View>
  );
}

export function EstimateBuilderScreen({ estimateId = '', initialJobId, mode }: EstimateBuilderScreenProps) {
  const router = useRouter();
  const {
    customerNameById,
    deleteEstimate,
    duplicateEstimate,
    estimates,
    isLoading,
    jobs,
    laborTemplates,
    materialTemplates,
    saveEstimate,
    saveEstimateAndCreateQuote,
    settings,
    storageError,
  } = useRecords();
  const existingEstimate = estimates.find((estimate) => estimate.id === estimateId);
  const [draft, setDraft] = useState<EstimateDraft>(() =>
    existingEstimate
      ? draftFromEstimate(existingEstimate)
      : defaultDraft(initialJobId, settings.defaultMarkupPercent, settings.defaultTaxPercent, settings.defaultTerms),
  );
  const [errors, setErrors] = useState<Partial<Record<keyof EstimateDraft | 'lineItems', string>>>({});
  const [submitError, setSubmitError] = useState('');
  const [lineItemForm, setLineItemForm] = useState<LineItemFormValues>(() => emptyLineItemForm(0));
  const [lineItemError, setLineItemError] = useState('');
  const [editingLineItemId, setEditingLineItemId] = useState<string | undefined>();
  const [adjustmentLabel, setAdjustmentLabel] = useState('');
  const [adjustmentAmount, setAdjustmentAmount] = useState('');
  const [adjustmentError, setAdjustmentError] = useState('');

  const selectedJob = jobs.find((job) => job.id === draft.jobId);
  const totals = useMemo(() => calculateEstimateTotals(draft), [draft]);
  const sortedLineItems = useMemo(() => sortLineItems(draft.lineItems), [draft.lineItems]);

  function updateDraft<K extends keyof EstimateDraft>(field: K, value: EstimateDraft[K]) {
    setDraft((currentDraft) => ({ ...currentDraft, [field]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }));
    setSubmitError('');
  }

  function updateLineItemField<K extends keyof LineItemFormValues>(field: K, value: LineItemFormValues[K]) {
    setLineItemForm((currentValues) => ({ ...currentValues, [field]: value }));
    setLineItemError('');
    setErrors((currentErrors) => ({ ...currentErrors, lineItems: undefined }));
  }

  function addOrUpdateLineItem() {
    const existingLineItem = editingLineItemId
      ? draft.lineItems.find((item) => item.id === editingLineItemId)
      : undefined;
    const sortOrder = existingLineItem?.sortOrder ?? draft.lineItems.length;
    const lineItem = lineItemFromForm(lineItemForm, sortOrder);
    const lineErrors = validateLineItem(lineItem);

    if (lineErrors.length > 0) {
      setLineItemError(lineErrors[0] ?? 'Line item is invalid.');
      return;
    }

    const nextLineItems = existingLineItem
      ? draft.lineItems.map((item) => (item.id === existingLineItem.id ? lineItem : item))
      : [...draft.lineItems, lineItem];

    updateDraft(
      'lineItems',
      sortLineItems(nextLineItems).map((item, index) => ({ ...item, sortOrder: index })),
    );
    setLineItemForm(emptyLineItemForm(nextLineItems.length));
    setEditingLineItemId(undefined);
  }

  function editLineItem(item: EstimateLineItem) {
    setLineItemForm(lineItemFormFromItem(item));
    setEditingLineItemId(item.id);
    setLineItemError('');
  }

  function removeLineItem(id: string) {
    updateDraft(
      'lineItems',
      draft.lineItems.filter((item) => item.id !== id).map((item, index) => ({ ...item, sortOrder: index })),
    );

    if (editingLineItemId === id) {
      setLineItemForm(emptyLineItemForm(0));
      setEditingLineItemId(undefined);
    }
  }

  function moveLineItem(id: string, direction: -1 | 1) {
    const items = sortLineItems(draft.lineItems);
    const index = items.findIndex((item) => item.id === id);
    const targetIndex = index + direction;

    if (index < 0 || targetIndex < 0 || targetIndex >= items.length) {
      return;
    }

    const nextItems = [...items];
    const [item] = nextItems.splice(index, 1);
    nextItems.splice(targetIndex, 0, item);
    updateDraft(
      'lineItems',
      nextItems.map((nextItem, nextIndex) => ({ ...nextItem, sortOrder: nextIndex })),
    );
  }

  function addLaborTemplate(templateId: string) {
    const template = laborTemplates.find((item) => item.id === templateId);
    if (!template) return;
    updateDraft('lineItems', [...draft.lineItems, createLineItemFromLaborTemplate(template, draft.lineItems.length)]);
  }

  function addMaterialTemplate(templateId: string) {
    const template = materialTemplates.find((item) => item.id === templateId);
    if (!template) return;
    updateDraft('lineItems', [...draft.lineItems, createLineItemFromMaterialTemplate(template, draft.lineItems.length)]);
  }

  function addAdjustment() {
    if (!adjustmentLabel.trim()) {
      setAdjustmentError('Adjustment label is required.');
      return;
    }

    updateDraft('adjustments', [
      ...draft.adjustments,
      {
        id: createRecordId('adj'),
        label: adjustmentLabel.trim(),
        amountCents: parseMoneyToCents(adjustmentAmount),
      },
    ]);
    setAdjustmentLabel('');
    setAdjustmentAmount('');
    setAdjustmentError('');
  }

  function removeAdjustment(id: string) {
    updateDraft(
      'adjustments',
      draft.adjustments.filter((adjustment) => adjustment.id !== id),
    );
  }

  function validateDraft() {
    const nextErrors = validateEstimateDraft(
      draft,
      jobs.map((job) => job.id),
    );
    setErrors(nextErrors);
    setSubmitError('');
    return !hasValidationErrors(nextErrors);
  }

  async function handleSave() {
    if (!validateDraft()) {
      return;
    }

    try {
      const savedEstimate = await saveEstimate(mode === 'edit' ? estimateId : undefined, draft);
      router.replace({
        pathname: '/estimates/[estimateId]/edit',
        params: { estimateId: savedEstimate.id },
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Estimate could not be saved.');
    }
  }

  async function handleCreateQuote() {
    if (!validateDraft()) {
      return;
    }

    try {
      const result = await saveEstimateAndCreateQuote(mode === 'edit' ? estimateId : undefined, draft);
      router.replace({
        pathname: '/quotes/[quoteId]',
        params: { quoteId: result.quote.id },
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Quote could not be created.');
    }
  }

  async function handleDuplicate() {
    try {
      const duplicate = await duplicateEstimate(estimateId);
      router.replace({
        pathname: '/estimates/[estimateId]/edit',
        params: { estimateId: duplicate.id },
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Estimate could not be duplicated.');
    }
  }

  function confirmDelete() {
    Alert.alert('Delete draft estimate?', 'Estimates with quotes are protected from deletion.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEstimate(estimateId);
            router.back();
          } catch (error) {
            setSubmitError(error instanceof Error ? error.message : 'Estimate could not be deleted.');
          }
        },
      },
    ]);
  }

  if (mode === 'edit' && isLoading) {
    return (
      <ScreenScaffold showBack title="Estimate">
        <View style={styles.loadingWrap}>
          <Banner tone="loading">Loading estimate...</Banner>
        </View>
      </ScreenScaffold>
    );
  }

  if (mode === 'edit' && !existingEstimate) {
    return (
      <ScreenScaffold showBack title="Estimate">
        <View style={styles.loadingWrap}>
          <EmptyState message="This estimate record is not available on this device." title="Estimate not found" />
        </View>
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold
      rightAction={<StatusPill status={draft.status} />}
      showBack
      subtitle={selectedJob ? `${selectedJob.title} / ${customerNameById[selectedJob.customerId]}` : 'Local estimate draft'}
      title={mode === 'edit' ? 'Edit Estimate' : 'Build Estimate'}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={12}
        style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {storageError ? <Banner tone="error">{storageError}</Banner> : null}
          {submitError ? <Banner tone="error">{submitError}</Banner> : null}
          {hasValidationErrors(errors) ? <Banner tone="error">Fix the highlighted estimate fields.</Banner> : null}

          <TextField
            autoCapitalize="words"
            error={errors.title}
            label="Estimate Title"
            onChangeText={(value) => updateDraft('title', value)}
            placeholder="Kitchen remodel estimate"
            value={draft.title}
          />

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Job</Text>
            {errors.jobId ? <Text style={styles.errorText}>{errors.jobId}</Text> : null}
            {jobs.length === 0 ? (
              <EmptyState
                message="Add a job before saving an estimate."
                primaryAction={{ label: 'Add Job', onPress: () => router.push('/jobs/new') }}
                title="No jobs available"
              />
            ) : (
              <View style={styles.list}>
                {jobs.map((job) => {
                  const isSelected = draft.jobId === job.id;

                  return (
                    <Pressable
                      accessibilityRole="button"
                      key={job.id}
                      onPress={() => updateDraft('jobId', job.id)}
                      style={({ pressed }) => [
                        styles.choiceCard,
                        isSelected && styles.choiceCardSelected,
                        pressed && styles.pressed,
                      ]}>
                      <View style={styles.choiceHeader}>
                        <View style={styles.titleStack}>
                          <Text style={[styles.choiceTitle, isSelected && styles.choiceTitleSelected]}>
                            {job.title}
                          </Text>
                          <Text style={styles.choiceMeta}>{customerNameById[job.customerId] || 'Unassigned customer'}</Text>
                        </View>
                        <StatusPill status={job.status} />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Estimate Status</Text>
            <View style={styles.statusGrid}>
              {estimateStatuses.map((status) => (
                <Pressable
                  accessibilityRole="button"
                  key={status}
                  onPress={() => updateDraft('status', status as EstimateStatus)}
                  style={({ pressed }) => [
                    styles.statusOption,
                    draft.status === status && styles.statusSelected,
                    pressed && styles.pressed,
                  ]}>
                  <StatusPill status={status} />
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Line Items</Text>
            {errors.lineItems ? <Text style={styles.errorText}>{errors.lineItems}</Text> : null}
            <View style={styles.card}>
              <View style={styles.statusGrid}>
                {lineItemTypes.map((type) => (
                  <Pressable
                    accessibilityRole="button"
                    key={type}
                    onPress={() => updateLineItemField('type', type)}
                    style={({ pressed }) => [
                      styles.typeChip,
                      lineItemForm.type === type && styles.typeChipSelected,
                      pressed && styles.pressed,
                    ]}>
                    <Text style={[styles.typeText, lineItemForm.type === type && styles.typeTextSelected]}>
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <TextField
                autoCapitalize="words"
                label="Line Item Name"
                onChangeText={(value) => updateLineItemField('name', value)}
                placeholder="Lead carpenter"
                value={lineItemForm.name}
              />
              <TextField
                label="Description"
                multiline
                onChangeText={(value) => updateLineItemField('description', value)}
                placeholder="Scope notes for this item"
                value={lineItemForm.description}
              />
              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <TextField
                    keyboardType="decimal-pad"
                    label="Quantity"
                    onChangeText={(value) => updateLineItemField('quantity', value)}
                    placeholder="1"
                    value={lineItemForm.quantity}
                  />
                </View>
                <View style={styles.fieldHalf}>
                  <TextField
                    autoCapitalize="none"
                    label="Unit"
                    onChangeText={(value) => updateLineItemField('unit', value)}
                    placeholder="hr"
                    value={lineItemForm.unit}
                  />
                </View>
              </View>
              <View style={styles.fieldRow}>
                <View style={styles.fieldHalf}>
                  <TextField
                    keyboardType="decimal-pad"
                    label="Unit Cost"
                    onChangeText={(value) => updateLineItemField('unitCost', value)}
                    placeholder="85"
                    value={lineItemForm.unitCost}
                  />
                </View>
                <View style={styles.fieldHalf}>
                  <TextField
                    keyboardType="decimal-pad"
                    label="Markup %"
                    onChangeText={(value) => updateLineItemField('markupPercent', value)}
                    placeholder="15"
                    value={lineItemForm.markupPercent}
                  />
                </View>
              </View>
              <Pressable
                accessibilityRole="switch"
                accessibilityState={{ checked: lineItemForm.taxable }}
                onPress={() => updateLineItemField('taxable', !lineItemForm.taxable)}
                style={({ pressed }) => [styles.toggleRow, pressed && styles.pressed]}>
                <Text style={styles.toggleTitle}>Taxable Line Item</Text>
                <Text style={[styles.toggleValue, lineItemForm.taxable && styles.toggleValueOn]}>
                  {lineItemForm.taxable ? 'Yes' : 'No'}
                </Text>
              </Pressable>
              {lineItemError ? <Text style={styles.errorText}>{lineItemError}</Text> : null}
              <View style={styles.actions}>
                <AppButton
                  label={editingLineItemId ? 'Update Line Item' : 'Add Line Item'}
                  onPress={addOrUpdateLineItem}
                />
                {editingLineItemId ? (
                  <AppButton
                    label="Cancel Edit"
                    onPress={() => {
                      setLineItemForm(emptyLineItemForm(draft.lineItems.length));
                      setEditingLineItemId(undefined);
                      setLineItemError('');
                    }}
                    variant="secondary"
                  />
                ) : null}
              </View>
            </View>

            {sortedLineItems.length === 0 ? <Banner>Add at least one line item before creating a quote.</Banner> : null}
            <View style={styles.list}>
              {sortedLineItems.map((item, index) => (
                <View key={item.id} style={styles.lineItemCard}>
                  <View style={styles.lineItemHeader}>
                    <View style={styles.titleStack}>
                      <Text style={styles.lineItemTitle}>{item.name}</Text>
                      <Text style={styles.lineItemMeta}>
                        {item.quantity} {item.unit} x {formatCurrency(item.unitPriceCents)} / {formatPercent(item.markupPercent)}
                      </Text>
                    </View>
                    <Text style={styles.lineItemAmount}>{formatCurrency(item.totalCents)}</Text>
                  </View>
                  {item.description ? <Text style={styles.lineItemDescription}>{item.description}</Text> : null}
                  <View style={styles.inlineActions}>
                    <AppButton label="Edit" onPress={() => editLineItem(item)} small variant="secondary" />
                    <AppButton label="Delete" onPress={() => removeLineItem(item.id)} small variant="secondary" />
                    <AppButton
                      disabled={index === 0}
                      label="Up"
                      onPress={() => moveLineItem(item.id, -1)}
                      small
                      variant="secondary"
                    />
                    <AppButton
                      disabled={index === sortedLineItems.length - 1}
                      label="Down"
                      onPress={() => moveLineItem(item.id, 1)}
                      small
                      variant="secondary"
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Templates</Text>
            {laborTemplates.length === 0 && materialTemplates.length === 0 ? (
              <Banner>No templates saved yet. Add reusable labor or material starters in Settings.</Banner>
            ) : null}
            <View style={styles.templateList}>
              {laborTemplates.map((template) => (
                <Pressable
                  accessibilityRole="button"
                  key={template.id}
                  onPress={() => addLaborTemplate(template.id)}
                  style={({ pressed }) => [styles.templateChip, pressed && styles.pressed]}>
                  <Text style={styles.templateChipTitle}>{template.name}</Text>
                  <Text style={styles.templateChipMeta}>{formatCurrency(template.defaultRateCents)} labor</Text>
                </Pressable>
              ))}
              {materialTemplates.map((template) => (
                <Pressable
                  accessibilityRole="button"
                  key={template.id}
                  onPress={() => addMaterialTemplate(template.id)}
                  style={({ pressed }) => [styles.templateChip, pressed && styles.pressed]}>
                  <Text style={styles.templateChipTitle}>{template.name}</Text>
                  <Text style={styles.templateChipMeta}>{formatCurrency(template.defaultCostCents)} material</Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Pricing</Text>
            <View style={styles.card}>
              <PricingRuleEditor
                label="Estimate Markup"
                onChange={(rule) => updateDraft('markup', rule)}
                rule={draft.markup}
              />
              <PricingRuleEditor
                label="Discount"
                onChange={(rule) => updateDraft('discount', rule)}
                rule={draft.discount}
              />
              <TextField
                error={errors.taxPercent}
                keyboardType="decimal-pad"
                label="Tax %"
                onChangeText={(value) => updateDraft('taxPercent', toNumber(value))}
                placeholder="0"
                value={numberInput(draft.taxPercent)}
              />
              <Pressable
                accessibilityRole="switch"
                accessibilityState={{ checked: draft.taxable }}
                onPress={() => updateDraft('taxable', !draft.taxable)}
                style={({ pressed }) => [styles.toggleRow, pressed && styles.pressed]}>
                <Text style={styles.toggleTitle}>Tax Estimate Total</Text>
                <Text style={[styles.toggleValue, draft.taxable && styles.toggleValueOn]}>
                  {draft.taxable ? 'Yes' : 'No'}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Adjustments</Text>
            {errors.adjustments ? <Text style={styles.errorText}>{errors.adjustments}</Text> : null}
            <View style={styles.card}>
              <TextField
                label="Adjustment Label"
                onChangeText={(value) => {
                  setAdjustmentLabel(value);
                  setAdjustmentError('');
                }}
                placeholder="Permit fee"
                value={adjustmentLabel}
              />
              <TextField
                keyboardType="numbers-and-punctuation"
                label="Amount"
                onChangeText={(value) => {
                  setAdjustmentAmount(value);
                  setAdjustmentError('');
                }}
                placeholder="125 or -50"
                value={adjustmentAmount}
              />
              {adjustmentError ? <Text style={styles.errorText}>{adjustmentError}</Text> : null}
              <AppButton label="Add Adjustment" onPress={addAdjustment} variant="secondary" />
            </View>
            <View style={styles.list}>
              {draft.adjustments.map((adjustment) => (
                <View key={adjustment.id} style={styles.adjustmentRow}>
                  <View style={styles.titleStack}>
                    <Text style={styles.adjustmentTitle}>{adjustment.label}</Text>
                    <Text style={styles.adjustmentAmount}>{formatCurrency(adjustment.amountCents)}</Text>
                  </View>
                  <AppButton label="Delete" onPress={() => removeAdjustment(adjustment.id)} small variant="secondary" />
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes and Terms</Text>
            <TextField
              label="Estimate Notes"
              multiline
              onChangeText={(value) => updateDraft('notes', value)}
              placeholder="Scope assumptions or exclusions"
              value={draft.notes}
            />
            <TextField
              label="Quote Terms"
              multiline
              onChangeText={(value) => updateDraft('terms', value)}
              placeholder="Quote terms"
              value={draft.terms}
            />
          </View>

          <View style={styles.totalCard}>
            <Text style={styles.totalTitle}>Estimate Total</Text>
            <Text style={styles.totalValue}>{formatCurrency(totals.totalCents)}</Text>
            <MoneyRow label="Line Items" value={totals.lineItemSubtotalCents} />
            <MoneyRow label="Estimate Markup" value={totals.estimateMarkupCents} />
            <MoneyRow label="Discount" value={-totals.discountCents} />
            <MoneyRow label="Adjustments" value={totals.adjustmentsCents} />
            <MoneyRow label="Taxable Amount" value={totals.taxableAmountCents} />
            <MoneyRow label="Tax" value={totals.taxCents} />
          </View>

          <View style={styles.actions}>
            <AppButton label="Save Estimate" onPress={handleSave} />
            <AppButton label="Create Quote Snapshot" onPress={handleCreateQuote} variant="secondary" />
            {mode === 'edit' ? <AppButton label="Duplicate Estimate" onPress={handleDuplicate} variant="secondary" /> : null}
            {mode === 'edit' ? <AppButton label="Delete Draft" onPress={confirmDelete} variant="secondary" /> : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  content: {
    gap: 16,
    padding: 18,
    paddingBottom: 34,
  },
  loadingWrap: {
    padding: 18,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 19,
    fontWeight: '900',
  },
  card: {
    gap: 14,
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  fieldGroup: {
    gap: 9,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  fieldHalf: {
    minWidth: 0,
    flex: 1,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 8,
    padding: 3,
    borderRadius: radii.md,
    backgroundColor: colors.surfaceAlt,
  },
  segment: {
    minHeight: 40,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.sm,
  },
  segmentSelected: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  segmentText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '900',
  },
  segmentTextSelected: {
    color: colors.primaryDark,
  },
  list: {
    gap: 10,
  },
  choiceCard: {
    gap: 8,
    padding: 13,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  choiceCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  choiceHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    justifyContent: 'space-between',
  },
  choiceTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  choiceTitleSelected: {
    color: colors.primaryDark,
  },
  choiceMeta: {
    color: colors.muted,
    fontSize: 13,
  },
  titleStack: {
    minWidth: 0,
    flex: 1,
    gap: 4,
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
  typeChip: {
    minHeight: 38,
    justifyContent: 'center',
    paddingHorizontal: 11,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  typeChipSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  typeText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  typeTextSelected: {
    color: colors.primaryDark,
  },
  toggleRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    padding: 13,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  toggleTitle: {
    minWidth: 0,
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  toggleValue: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '900',
  },
  toggleValueOn: {
    color: colors.primary,
  },
  lineItemCard: {
    gap: 10,
    padding: 14,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  lineItemHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
  },
  lineItemTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  lineItemMeta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  lineItemDescription: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  lineItemAmount: {
    flexShrink: 0,
    color: colors.primary,
    fontSize: 15,
    fontWeight: '900',
  },
  inlineActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  templateList: {
    gap: 8,
  },
  templateChip: {
    gap: 3,
    padding: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  templateChipTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  templateChipMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  adjustmentRow: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 13,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  adjustmentTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  adjustmentAmount: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  totalCard: {
    gap: 8,
    padding: 15,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  totalTitle: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  totalValue: {
    color: colors.primaryDark,
    fontSize: 30,
    fontWeight: '900',
  },
  moneyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  moneyLabel: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  moneyValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
  actions: {
    gap: 10,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.78,
  },
});
