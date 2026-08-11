export const SNAPSHOT_VERSION = 2;

export const jobStatuses = ['New', 'Site Visit', 'Estimating', 'Quote Ready', 'Sent', 'Won', 'Lost', 'Archived'] as const;
export const estimateStatuses = ['Draft', 'Ready', 'Quoted', 'Archived'] as const;
export const lineItemTypes = ['labor', 'material', 'equipment', 'other'] as const;
export const quoteStatuses = ['Draft', 'Ready', 'Sent', 'Approved', 'Rejected', 'Superseded', 'Archived'] as const;
export const discountTypes = ['percent', 'fixed'] as const;
export const markupTypes = ['percent', 'fixed'] as const;

export type JobStatus = (typeof jobStatuses)[number];
export type EstimateStatus = (typeof estimateStatuses)[number];
export type EstimateLineItemType = (typeof lineItemTypes)[number];
export type QuoteStatus = (typeof quoteStatuses)[number];
export type DiscountType = (typeof discountTypes)[number];
export type MarkupType = (typeof markupTypes)[number];

export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type Job = {
  id: string;
  customerId: string;
  title: string;
  jobAddress: string;
  description: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
};

export type MoneyAdjustment = {
  id: string;
  label: string;
  amountCents: number;
};

export type PricingRule = {
  type: MarkupType | DiscountType;
  value: number;
};

export type EstimateLineItem = {
  id: string;
  type: EstimateLineItemType;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unitCostCents: number;
  markupPercent: number;
  unitPriceCents: number;
  totalCents: number;
  sortOrder: number;
  taxable: boolean;
};

export type PricingSummary = {
  lineItemSubtotalCents: number;
  estimateMarkupCents: number;
  discountCents: number;
  adjustmentsCents: number;
  taxableAmountCents: number;
  taxCents: number;
  totalCents: number;
};

export type Estimate = {
  id: string;
  jobId: string;
  title: string;
  status: EstimateStatus;
  lineItems: EstimateLineItem[];
  subtotalCents: number;
  markup: PricingRule;
  discount: PricingRule;
  taxPercent: number;
  taxable: boolean;
  adjustments: MoneyAdjustment[];
  totalCents: number;
  notes: string;
  terms: string;
  createdAt: string;
  updatedAt: string;
};

export type CustomerSnapshot = Pick<Customer, 'id' | 'name' | 'phone' | 'email' | 'address' | 'notes'>;
export type JobSnapshot = Pick<Job, 'id' | 'customerId' | 'title' | 'jobAddress' | 'description' | 'status'>;

export type Quote = {
  id: string;
  jobId: string;
  estimateId: string;
  quoteNumber: string;
  version: number;
  status: QuoteStatus;
  customerSnapshot: CustomerSnapshot;
  jobSnapshot: JobSnapshot;
  lineItemsSnapshot: EstimateLineItem[];
  pricingSnapshot: PricingSummary & {
    markup: PricingRule;
    discount: PricingRule;
    taxPercent: number;
    adjustments: MoneyAdjustment[];
  };
  businessSnapshot: AppSettings;
  notes: string;
  terms: string;
  createdAt: string;
  updatedAt: string;
  sentAt?: string;
  approvedAt?: string;
  rejectedAt?: string;
};

export type LaborTemplate = {
  id: string;
  name: string;
  description: string;
  defaultUnit: string;
  defaultRateCents: number;
  defaultMarkupPercent: number;
  createdAt: string;
  updatedAt: string;
};

export type MaterialTemplate = {
  id: string;
  name: string;
  description: string;
  defaultUnit: string;
  defaultCostCents: number;
  defaultMarkupPercent: number;
  createdAt: string;
  updatedAt: string;
};

export type SignatureApproval = {
  id: string;
  quoteId: string;
  signerName: string;
  signatureData?: string;
  approvalType: 'typed';
  acceptedTerms: boolean;
  signedAt: string;
};

export type AppSettings = {
  businessName: string;
  contractorName: string;
  businessPhone: string;
  businessEmail: string;
  businessAddress: string;
  defaultTaxPercent: number;
  defaultMarkupPercent: number;
  currency: string;
  quotePrefix: string;
  quoteStartingNumber: number;
  defaultTerms: string;
  reducedMotion: boolean;
};

export type LocalSnapshot = {
  version: typeof SNAPSHOT_VERSION;
  customers: Customer[];
  jobs: Job[];
  estimates: Estimate[];
  quotes: Quote[];
  laborTemplates: LaborTemplate[];
  materialTemplates: MaterialTemplate[];
  approvals: SignatureApproval[];
  settings: AppSettings;
};

export type CustomerDraft = Pick<Customer, 'name' | 'phone' | 'email' | 'address' | 'notes'>;

export type JobDraft = Pick<Job, 'customerId' | 'title' | 'jobAddress' | 'description' | 'status'>;

export type EstimateDraft = Pick<
  Estimate,
  'jobId' | 'title' | 'status' | 'lineItems' | 'markup' | 'discount' | 'taxPercent' | 'taxable' | 'adjustments' | 'notes' | 'terms'
>;

export type LaborTemplateDraft = Pick<
  LaborTemplate,
  'name' | 'description' | 'defaultUnit' | 'defaultRateCents' | 'defaultMarkupPercent'
>;

export type MaterialTemplateDraft = Pick<
  MaterialTemplate,
  'name' | 'description' | 'defaultUnit' | 'defaultCostCents' | 'defaultMarkupPercent'
>;

export type ApprovalDraft = {
  quoteId: string;
  signerName: string;
  acceptedTerms: boolean;
};
