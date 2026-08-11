import {
  AppSettings,
  Customer,
  CustomerDraft,
  Estimate,
  EstimateDraft,
  Job,
  JobDraft,
  LaborTemplate,
  LaborTemplateDraft,
  LocalSnapshot,
  MaterialTemplate,
  MaterialTemplateDraft,
  Quote,
  SNAPSHOT_VERSION,
  SignatureApproval,
} from './types';
import { calculateEstimateTotals } from './pricing';

export const defaultSettings: AppSettings = {
  businessName: 'QuoteForge Contracting',
  contractorName: '',
  businessPhone: '',
  businessEmail: '',
  businessAddress: '',
  defaultTaxPercent: 0,
  defaultMarkupPercent: 15,
  currency: 'USD',
  quotePrefix: 'QF',
  quoteStartingNumber: 1001,
  defaultTerms: 'Quote is valid for 30 days. Changes to scope, site conditions, or material pricing may require a revision.',
  reducedMotion: false,
};

export function createEmptySnapshot(): LocalSnapshot {
  return {
    version: SNAPSHOT_VERSION,
    customers: [],
    jobs: [],
    estimates: [],
    quotes: [],
    laborTemplates: [],
    materialTemplates: [],
    approvals: [],
    settings: defaultSettings,
  };
}

export function createRecordId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createCustomer(draft: CustomerDraft): Customer {
  const now = new Date().toISOString();

  return {
    id: createRecordId('cus'),
    name: draft.name.trim(),
    phone: draft.phone.trim(),
    email: draft.email.trim(),
    address: draft.address.trim(),
    notes: draft.notes.trim(),
    createdAt: now,
    updatedAt: now,
  };
}

export function updateCustomerRecord(customer: Customer, draft: CustomerDraft): Customer {
  return {
    ...customer,
    name: draft.name.trim(),
    phone: draft.phone.trim(),
    email: draft.email.trim(),
    address: draft.address.trim(),
    notes: draft.notes.trim(),
    updatedAt: new Date().toISOString(),
  };
}

export function createJob(draft: JobDraft): Job {
  const now = new Date().toISOString();

  return {
    id: createRecordId('job'),
    customerId: draft.customerId,
    title: draft.title.trim(),
    jobAddress: draft.jobAddress.trim(),
    description: draft.description.trim(),
    status: draft.status,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateJobRecord(job: Job, draft: JobDraft): Job {
  return {
    ...job,
    customerId: draft.customerId,
    title: draft.title.trim(),
    jobAddress: draft.jobAddress.trim(),
    description: draft.description.trim(),
    status: draft.status,
    updatedAt: new Date().toISOString(),
  };
}

export function createEstimate(draft: EstimateDraft): Estimate {
  const now = new Date().toISOString();
  const totals = calculateEstimateTotals(draft);

  return {
    id: createRecordId('est'),
    jobId: draft.jobId,
    title: draft.title.trim(),
    status: draft.status,
    lineItems: draft.lineItems,
    subtotalCents: totals.lineItemSubtotalCents,
    markup: draft.markup,
    discount: draft.discount,
    taxPercent: draft.taxPercent,
    taxable: draft.taxable,
    adjustments: draft.adjustments,
    totalCents: totals.totalCents,
    notes: draft.notes.trim(),
    terms: draft.terms.trim(),
    createdAt: now,
    updatedAt: now,
  };
}

export function updateEstimateRecord(estimate: Estimate, draft: EstimateDraft): Estimate {
  const totals = calculateEstimateTotals(draft);

  return {
    ...estimate,
    jobId: draft.jobId,
    title: draft.title.trim(),
    status: draft.status,
    lineItems: draft.lineItems,
    subtotalCents: totals.lineItemSubtotalCents,
    markup: draft.markup,
    discount: draft.discount,
    taxPercent: draft.taxPercent,
    taxable: draft.taxable,
    adjustments: draft.adjustments,
    totalCents: totals.totalCents,
    notes: draft.notes.trim(),
    terms: draft.terms.trim(),
    updatedAt: new Date().toISOString(),
  };
}

export function duplicateEstimateRecord(estimate: Estimate): Estimate {
  const now = new Date().toISOString();
  const copiedLineItems = estimate.lineItems.map((item, index) => ({
    ...item,
    id: createRecordId('li'),
    sortOrder: index,
  }));
  const draft: EstimateDraft = {
    jobId: estimate.jobId,
    title: `${estimate.title} Copy`,
    status: 'Draft',
    lineItems: copiedLineItems,
    markup: estimate.markup,
    discount: estimate.discount,
    taxPercent: estimate.taxPercent,
    taxable: estimate.taxable,
    adjustments: estimate.adjustments.map((adjustment) => ({ ...adjustment, id: createRecordId('adj') })),
    notes: estimate.notes,
    terms: estimate.terms,
  };
  const totals = calculateEstimateTotals(draft);

  return {
    ...estimate,
    ...draft,
    id: createRecordId('est'),
    subtotalCents: totals.lineItemSubtotalCents,
    totalCents: totals.totalCents,
    createdAt: now,
    updatedAt: now,
  };
}

export function createLaborTemplate(draft: LaborTemplateDraft): LaborTemplate {
  const now = new Date().toISOString();

  return {
    id: createRecordId('lab'),
    name: draft.name.trim(),
    description: draft.description.trim(),
    defaultUnit: draft.defaultUnit.trim() || 'hr',
    defaultRateCents: draft.defaultRateCents,
    defaultMarkupPercent: draft.defaultMarkupPercent,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateLaborTemplateRecord(template: LaborTemplate, draft: LaborTemplateDraft): LaborTemplate {
  return {
    ...template,
    name: draft.name.trim(),
    description: draft.description.trim(),
    defaultUnit: draft.defaultUnit.trim() || 'hr',
    defaultRateCents: draft.defaultRateCents,
    defaultMarkupPercent: draft.defaultMarkupPercent,
    updatedAt: new Date().toISOString(),
  };
}

export function duplicateLaborTemplateRecord(template: LaborTemplate): LaborTemplate {
  const now = new Date().toISOString();

  return {
    ...template,
    id: createRecordId('lab'),
    name: `${template.name} Copy`,
    createdAt: now,
    updatedAt: now,
  };
}

export function createMaterialTemplate(draft: MaterialTemplateDraft): MaterialTemplate {
  const now = new Date().toISOString();

  return {
    id: createRecordId('mat'),
    name: draft.name.trim(),
    description: draft.description.trim(),
    defaultUnit: draft.defaultUnit.trim() || 'ea',
    defaultCostCents: draft.defaultCostCents,
    defaultMarkupPercent: draft.defaultMarkupPercent,
    createdAt: now,
    updatedAt: now,
  };
}

export function updateMaterialTemplateRecord(template: MaterialTemplate, draft: MaterialTemplateDraft): MaterialTemplate {
  return {
    ...template,
    name: draft.name.trim(),
    description: draft.description.trim(),
    defaultUnit: draft.defaultUnit.trim() || 'ea',
    defaultCostCents: draft.defaultCostCents,
    defaultMarkupPercent: draft.defaultMarkupPercent,
    updatedAt: new Date().toISOString(),
  };
}

export function duplicateMaterialTemplateRecord(template: MaterialTemplate): MaterialTemplate {
  const now = new Date().toISOString();

  return {
    ...template,
    id: createRecordId('mat'),
    name: `${template.name} Copy`,
    createdAt: now,
    updatedAt: now,
  };
}

export function createApproval(quoteId: string, signerName: string): SignatureApproval {
  return {
    id: createRecordId('sig'),
    quoteId,
    signerName: signerName.trim(),
    approvalType: 'typed',
    acceptedTerms: true,
    signedAt: new Date().toISOString(),
  };
}

export function sortByUpdatedAt<T extends { updatedAt: string; createdAt: string }>(records: T[]) {
  return [...records].sort((a, b) => {
    const bDate = new Date(b.updatedAt || b.createdAt).getTime();
    const aDate = new Date(a.updatedAt || a.createdAt).getTime();
    return bDate - aDate;
  });
}

export function formatShortDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown';
  }

  return new Intl.DateTimeFormat('en', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function cloneQuote(quote: Quote): Quote {
  return JSON.parse(JSON.stringify(quote)) as Quote;
}
