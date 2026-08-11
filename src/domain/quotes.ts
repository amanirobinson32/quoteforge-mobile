import {
  AppSettings,
  Customer,
  Estimate,
  EstimateDraft,
  Job,
  Quote,
  QuoteStatus,
} from './types';
import { calculateEstimateTotals } from './pricing';
import { cloneQuote, createRecordId } from './records';

function parseQuoteSequence(quoteNumber: string, prefix: string) {
  const normalizedPrefix = `${prefix}-`;

  if (!quoteNumber.startsWith(normalizedPrefix)) {
    return 0;
  }

  const value = Number(quoteNumber.slice(normalizedPrefix.length));
  return Number.isFinite(value) ? value : 0;
}

export function getNextQuoteNumber(quotes: Quote[], settings: AppSettings) {
  const highestExistingNumber = quotes.reduce((highest, quote) => {
    return Math.max(highest, parseQuoteSequence(quote.quoteNumber, settings.quotePrefix));
  }, settings.quoteStartingNumber - 1);

  return `${settings.quotePrefix}-${highestExistingNumber + 1}`;
}

export function getNextQuoteVersion(quotes: Quote[], quoteNumber: string) {
  return (
    quotes
      .filter((quote) => quote.quoteNumber === quoteNumber)
      .reduce((highest, quote) => Math.max(highest, quote.version), 0) + 1
  );
}

export function createQuoteFromEstimate({
  customer,
  estimate,
  job,
  quoteNumber,
  settings,
  version,
}: {
  customer: Customer;
  estimate: Estimate;
  job: Job;
  quoteNumber: string;
  settings: AppSettings;
  version: number;
}): Quote {
  const now = new Date().toISOString();
  const estimateDraft: EstimateDraft = {
    jobId: estimate.jobId,
    title: estimate.title,
    status: estimate.status,
    lineItems: estimate.lineItems.map((item) => ({ ...item })),
    markup: estimate.markup,
    discount: estimate.discount,
    taxPercent: estimate.taxPercent,
    taxable: estimate.taxable,
    adjustments: estimate.adjustments.map((adjustment) => ({ ...adjustment })),
    notes: estimate.notes,
    terms: estimate.terms,
  };
  const pricingSummary = calculateEstimateTotals(estimateDraft);

  return {
    id: createRecordId('quo'),
    jobId: job.id,
    estimateId: estimate.id,
    quoteNumber,
    version,
    status: 'Draft',
    customerSnapshot: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      notes: customer.notes,
    },
    jobSnapshot: {
      id: job.id,
      customerId: job.customerId,
      title: job.title,
      jobAddress: job.jobAddress,
      description: job.description,
      status: job.status,
    },
    lineItemsSnapshot: estimate.lineItems.map((item) => ({ ...item })),
    pricingSnapshot: {
      ...pricingSummary,
      markup: estimate.markup,
      discount: estimate.discount,
      taxPercent: estimate.taxPercent,
      adjustments: estimate.adjustments.map((adjustment) => ({ ...adjustment })),
    },
    businessSnapshot: { ...settings },
    notes: estimate.notes,
    terms: estimate.terms || settings.defaultTerms,
    createdAt: now,
    updatedAt: now,
  };
}

export function duplicateQuoteAsDraft(quote: Quote): Quote {
  const now = new Date().toISOString();
  const nextQuote = cloneQuote(quote);

  return {
    ...nextQuote,
    id: createRecordId('quo'),
    status: 'Draft',
    createdAt: now,
    updatedAt: now,
    sentAt: undefined,
    approvedAt: undefined,
    rejectedAt: undefined,
  };
}

export function setQuoteStatus(quote: Quote, status: QuoteStatus): Quote {
  const now = new Date().toISOString();

  return {
    ...quote,
    status,
    sentAt: status === 'Sent' ? now : quote.sentAt,
    approvedAt: status === 'Approved' ? now : quote.approvedAt,
    rejectedAt: status === 'Rejected' ? now : quote.rejectedAt,
    updatedAt: now,
  };
}
