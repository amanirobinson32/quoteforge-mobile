import {
  ApprovalDraft,
  CustomerDraft,
  EstimateDraft,
  EstimateLineItem,
  JobDraft,
  LaborTemplateDraft,
  MaterialTemplateDraft,
} from './types';

export type CustomerFormErrors = Partial<Record<keyof CustomerDraft, string>>;
export type JobFormErrors = Partial<Record<keyof JobDraft, string>>;
export type EstimateFormErrors = Partial<Record<keyof EstimateDraft | 'lineItems', string>>;
export type TemplateFormErrors = Record<string, string | undefined>;
export type ApprovalFormErrors = Partial<Record<keyof ApprovalDraft, string>>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateCustomerDraft(values: CustomerDraft): CustomerFormErrors {
  const errors: CustomerFormErrors = {};
  const email = values.email.trim();

  if (!values.name.trim()) {
    errors.name = 'Customer name is required.';
  }

  if (email && !emailPattern.test(email)) {
    errors.email = 'Enter a valid email address.';
  }

  return errors;
}

export function validateJobDraft(values: JobDraft, validCustomerIds: string[]): JobFormErrors {
  const errors: JobFormErrors = {};

  if (!values.title.trim()) {
    errors.title = 'Job title is required.';
  }

  if (!values.customerId || !validCustomerIds.includes(values.customerId)) {
    errors.customerId = 'Select a customer for this job.';
  }

  return errors;
}

export function validateLineItem(item: EstimateLineItem): string[] {
  const errors: string[] = [];

  if (!item.name.trim()) {
    errors.push('Line item name is required.');
  }

  if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
    errors.push('Quantity must be greater than 0.');
  }

  if (!Number.isFinite(item.unitCostCents) || item.unitCostCents < 0) {
    errors.push('Unit cost must be a non-negative amount.');
  }

  if (!Number.isFinite(item.markupPercent) || item.markupPercent < 0) {
    errors.push('Markup must be a non-negative percentage.');
  }

  if (!Number.isFinite(item.totalCents) || item.totalCents < 0) {
    errors.push('Line total is invalid.');
  }

  return errors;
}

export function validateEstimateDraft(values: EstimateDraft, validJobIds: string[]): EstimateFormErrors {
  const errors: EstimateFormErrors = {};

  if (!values.title.trim()) {
    errors.title = 'Estimate title is required.';
  }

  if (!values.jobId || !validJobIds.includes(values.jobId)) {
    errors.jobId = 'Select a job for this estimate.';
  }

  if (!values.lineItems.length) {
    errors.lineItems = 'Add at least one line item.';
  }

  if (values.lineItems.some((item) => validateLineItem(item).length > 0)) {
    errors.lineItems = 'Fix invalid line item values before saving.';
  }

  if (!Number.isFinite(values.taxPercent) || values.taxPercent < 0) {
    errors.taxPercent = 'Tax must be a non-negative percentage.';
  }

  if (!Number.isFinite(values.markup.value) || values.markup.value < 0) {
    errors.markup = 'Markup must be non-negative.';
  }

  if (!Number.isFinite(values.discount.value) || values.discount.value < 0) {
    errors.discount = 'Discount must be non-negative.';
  }

  if (values.adjustments.some((adjustment) => !adjustment.label.trim())) {
    errors.adjustments = 'Adjustment label is required.';
  }

  if (values.adjustments.some((adjustment) => !Number.isFinite(adjustment.amountCents))) {
    errors.adjustments = 'Adjustment amount is invalid.';
  }

  return errors;
}

export function validateLaborTemplateDraft(values: LaborTemplateDraft): TemplateFormErrors {
  const errors: TemplateFormErrors = {};

  if (!values.name.trim()) {
    errors.name = 'Template name is required.';
  }

  if (!Number.isFinite(values.defaultRateCents) || values.defaultRateCents < 0) {
    errors.defaultRateCents = 'Rate must be a non-negative amount.';
  }

  if (!Number.isFinite(values.defaultMarkupPercent) || values.defaultMarkupPercent < 0) {
    errors.defaultMarkupPercent = 'Markup must be non-negative.';
  }

  return errors;
}

export function validateMaterialTemplateDraft(values: MaterialTemplateDraft): TemplateFormErrors {
  const errors: TemplateFormErrors = {};

  if (!values.name.trim()) {
    errors.name = 'Template name is required.';
  }

  if (!Number.isFinite(values.defaultCostCents) || values.defaultCostCents < 0) {
    errors.defaultCostCents = 'Cost must be a non-negative amount.';
  }

  if (!Number.isFinite(values.defaultMarkupPercent) || values.defaultMarkupPercent < 0) {
    errors.defaultMarkupPercent = 'Markup must be non-negative.';
  }

  return errors;
}

export function validateApprovalDraft(values: ApprovalDraft): ApprovalFormErrors {
  const errors: ApprovalFormErrors = {};

  if (!values.signerName.trim()) {
    errors.signerName = 'Signer name is required.';
  }

  if (!values.acceptedTerms) {
    errors.acceptedTerms = 'Terms must be accepted before approval.';
  }

  return errors;
}

export function hasValidationErrors(errors: Record<string, string | undefined>) {
  return Object.values(errors).some(Boolean);
}
