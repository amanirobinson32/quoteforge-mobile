import { ReactNode, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { formatCurrency, parseMoneyToCents } from '@/src/domain/pricing';
import { LaborTemplateDraft, MaterialTemplateDraft } from '@/src/domain/types';
import {
  hasValidationErrors,
  TemplateFormErrors,
  validateLaborTemplateDraft,
  validateMaterialTemplateDraft,
} from '@/src/domain/validation';
import { useRecords } from '@/src/state/RecordsContext';
import { AppButton } from '@/src/ui/AppButton';
import { Banner } from '@/src/ui/Banner';
import { EmptyState } from '@/src/ui/EmptyState';
import { TextField } from '@/src/ui/FormField';
import { ScreenScaffold } from '@/src/ui/ScreenScaffold';

type TemplateMode = 'create' | 'edit';

type TemplateFormValues = {
  name: string;
  description: string;
  defaultUnit: string;
  amount: string;
  markup: string;
};

function moneyInput(cents: number) {
  return cents > 0 ? String(cents / 100) : '';
}

function toNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function emptyLaborValues(): TemplateFormValues {
  return {
    name: '',
    description: '',
    defaultUnit: 'hr',
    amount: '',
    markup: '15',
  };
}

function emptyMaterialValues(): TemplateFormValues {
  return {
    name: '',
    description: '',
    defaultUnit: 'ea',
    amount: '',
    markup: '15',
  };
}

export function LaborTemplateEditorScreen({ mode, templateId = '' }: { mode: TemplateMode; templateId?: string }) {
  const router = useRouter();
  const {
    deleteLaborTemplate,
    duplicateLaborTemplate,
    isLoading,
    laborTemplates,
    saveLaborTemplate,
    storageError,
  } = useRecords();
  const template = laborTemplates.find((item) => item.id === templateId);
  const [values, setValues] = useState<TemplateFormValues>(() =>
    template
      ? {
          name: template.name,
          description: template.description,
          defaultUnit: template.defaultUnit,
          amount: moneyInput(template.defaultRateCents),
          markup: String(template.defaultMarkupPercent),
        }
      : emptyLaborValues(),
  );
  const [errors, setErrors] = useState<TemplateFormErrors>({});
  const [submitError, setSubmitError] = useState('');

  function updateField(field: keyof TemplateFormValues, value: string) {
    setValues((currentValues) => ({ ...currentValues, [field]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }));
    setSubmitError('');
  }

  function toDraft(): LaborTemplateDraft {
    return {
      name: values.name,
      description: values.description,
      defaultUnit: values.defaultUnit,
      defaultRateCents: parseMoneyToCents(values.amount),
      defaultMarkupPercent: toNumber(values.markup),
    };
  }

  async function handleSave() {
    const draft = toDraft();
    const nextErrors = validateLaborTemplateDraft(draft);
    setErrors(nextErrors);
    setSubmitError('');

    if (hasValidationErrors(nextErrors)) {
      return;
    }

    try {
      const savedTemplate = await saveLaborTemplate(mode === 'edit' ? templateId : undefined, draft);
      router.replace({
        pathname: '/settings/templates/labor/[templateId]',
        params: { templateId: savedTemplate.id },
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Template could not be saved.');
    }
  }

  function confirmDelete() {
    Alert.alert('Delete labor template?', 'Existing estimate line items will not be changed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteLaborTemplate(templateId);
            router.replace('/settings/templates');
          } catch (error) {
            setSubmitError(error instanceof Error ? error.message : 'Template could not be deleted.');
          }
        },
      },
    ]);
  }

  async function handleDuplicate() {
    try {
      const duplicate = await duplicateLaborTemplate(templateId);
      router.replace({
        pathname: '/settings/templates/labor/[templateId]',
        params: { templateId: duplicate.id },
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Template could not be duplicated.');
    }
  }

  if (mode === 'edit' && isLoading) {
    return (
      <ScreenScaffold showBack title="Labor Template">
        <View style={styles.content}>
          <Banner tone="loading">Loading template...</Banner>
        </View>
      </ScreenScaffold>
    );
  }

  if (mode === 'edit' && !template) {
    return (
      <ScreenScaffold showBack title="Labor Template">
        <View style={styles.content}>
          <EmptyState message="This labor template is not available on this device." title="Template not found" />
        </View>
      </ScreenScaffold>
    );
  }

  return (
    <TemplateFormShell
      amountError={errors.defaultRateCents}
      amountLabel="Default Rate"
      amountPlaceholder="85"
      footer={
        <>
          <AppButton label={mode === 'edit' ? 'Save Labor Template' : 'Create Labor Template'} onPress={handleSave} />
          {mode === 'edit' ? <AppButton label="Duplicate Template" onPress={handleDuplicate} variant="secondary" /> : null}
          {mode === 'edit' ? <AppButton label="Delete Template" onPress={confirmDelete} variant="secondary" /> : null}
        </>
      }
      nameError={errors.name}
      onChange={updateField}
      storageError={storageError}
      submitError={submitError}
      subtitle="Saved starters for labor line items"
      title={mode === 'edit' ? 'Edit Labor Template' : 'Add Labor Template'}
      values={values}
    />
  );
}

export function MaterialTemplateEditorScreen({ mode, templateId = '' }: { mode: TemplateMode; templateId?: string }) {
  const router = useRouter();
  const {
    deleteMaterialTemplate,
    duplicateMaterialTemplate,
    isLoading,
    materialTemplates,
    saveMaterialTemplate,
    storageError,
  } = useRecords();
  const template = materialTemplates.find((item) => item.id === templateId);
  const [values, setValues] = useState<TemplateFormValues>(() =>
    template
      ? {
          name: template.name,
          description: template.description,
          defaultUnit: template.defaultUnit,
          amount: moneyInput(template.defaultCostCents),
          markup: String(template.defaultMarkupPercent),
        }
      : emptyMaterialValues(),
  );
  const [errors, setErrors] = useState<TemplateFormErrors>({});
  const [submitError, setSubmitError] = useState('');

  function updateField(field: keyof TemplateFormValues, value: string) {
    setValues((currentValues) => ({ ...currentValues, [field]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }));
    setSubmitError('');
  }

  function toDraft(): MaterialTemplateDraft {
    return {
      name: values.name,
      description: values.description,
      defaultUnit: values.defaultUnit,
      defaultCostCents: parseMoneyToCents(values.amount),
      defaultMarkupPercent: toNumber(values.markup),
    };
  }

  async function handleSave() {
    const draft = toDraft();
    const nextErrors = validateMaterialTemplateDraft(draft);
    setErrors(nextErrors);
    setSubmitError('');

    if (hasValidationErrors(nextErrors)) {
      return;
    }

    try {
      const savedTemplate = await saveMaterialTemplate(mode === 'edit' ? templateId : undefined, draft);
      router.replace({
        pathname: '/settings/templates/material/[templateId]',
        params: { templateId: savedTemplate.id },
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Template could not be saved.');
    }
  }

  function confirmDelete() {
    Alert.alert('Delete material template?', 'Existing estimate line items will not be changed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMaterialTemplate(templateId);
            router.replace('/settings/templates');
          } catch (error) {
            setSubmitError(error instanceof Error ? error.message : 'Template could not be deleted.');
          }
        },
      },
    ]);
  }

  async function handleDuplicate() {
    try {
      const duplicate = await duplicateMaterialTemplate(templateId);
      router.replace({
        pathname: '/settings/templates/material/[templateId]',
        params: { templateId: duplicate.id },
      });
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Template could not be duplicated.');
    }
  }

  if (mode === 'edit' && isLoading) {
    return (
      <ScreenScaffold showBack title="Material Template">
        <View style={styles.content}>
          <Banner tone="loading">Loading template...</Banner>
        </View>
      </ScreenScaffold>
    );
  }

  if (mode === 'edit' && !template) {
    return (
      <ScreenScaffold showBack title="Material Template">
        <View style={styles.content}>
          <EmptyState message="This material template is not available on this device." title="Template not found" />
        </View>
      </ScreenScaffold>
    );
  }

  return (
    <TemplateFormShell
      amountError={errors.defaultCostCents}
      amountLabel="Default Cost"
      amountPlaceholder="52"
      footer={
        <>
          <AppButton
            label={mode === 'edit' ? 'Save Material Template' : 'Create Material Template'}
            onPress={handleSave}
          />
          {mode === 'edit' ? <AppButton label="Duplicate Template" onPress={handleDuplicate} variant="secondary" /> : null}
          {mode === 'edit' ? <AppButton label="Delete Template" onPress={confirmDelete} variant="secondary" /> : null}
        </>
      }
      nameError={errors.name}
      onChange={updateField}
      storageError={storageError}
      submitError={submitError}
      subtitle="Saved starters for material line items"
      title={mode === 'edit' ? 'Edit Material Template' : 'Add Material Template'}
      values={values}
    />
  );
}

function TemplateFormShell({
  amountError,
  amountLabel,
  amountPlaceholder,
  footer,
  nameError,
  onChange,
  storageError,
  submitError,
  subtitle,
  title,
  values,
}: {
  amountError?: string;
  amountLabel: string;
  amountPlaceholder: string;
  footer: ReactNode;
  nameError?: string;
  onChange: (field: keyof TemplateFormValues, value: string) => void;
  storageError: string;
  submitError: string;
  subtitle: string;
  title: string;
  values: TemplateFormValues;
}) {
  return (
    <ScreenScaffold showBack subtitle={subtitle} title={title}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={12}
        style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {storageError ? <Banner tone="error">{storageError}</Banner> : null}
          {submitError ? <Banner tone="error">{submitError}</Banner> : null}
          <TextField
            autoCapitalize="words"
            error={nameError}
            label="Template Name"
            onChangeText={(value) => onChange('name', value)}
            placeholder="Lead carpenter"
            value={values.name}
          />
          <TextField
            label="Description"
            multiline
            onChangeText={(value) => onChange('description', value)}
            placeholder="Notes copied into estimate line items"
            value={values.description}
          />
          <TextField
            autoCapitalize="none"
            label="Default Unit"
            onChangeText={(value) => onChange('defaultUnit', value)}
            placeholder="hr, ea, sq ft"
            value={values.defaultUnit}
          />
          <TextField
            error={amountError}
            keyboardType="decimal-pad"
            label={`${amountLabel} (${values.amount ? formatCurrency(parseMoneyToCents(values.amount)) : '$0.00'})`}
            onChangeText={(value) => onChange('amount', value)}
            placeholder={amountPlaceholder}
            value={values.amount}
          />
          <TextField
            keyboardType="decimal-pad"
            label="Default Markup %"
            onChangeText={(value) => onChange('markup', value)}
            placeholder="15"
            value={values.markup}
          />
          <View style={styles.actions}>{footer}</View>
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
    gap: 14,
    padding: 18,
    paddingBottom: 34,
  },
  actions: {
    gap: 10,
  },
});
