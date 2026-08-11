import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateLineItemTotal } from './pricing';
import { createQuoteFromEstimate, getNextQuoteNumber, getNextQuoteVersion, setQuoteStatus } from './quotes';
import { defaultSettings } from './records';
import { Customer, Estimate, Job, Quote } from './types';

const now = '2026-01-01T00:00:00.000Z';

const customer: Customer = {
  id: 'cus_1',
  name: 'Ridgeview Homes',
  phone: '(555) 010-0101',
  email: 'office@example.com',
  address: '128 Market Street',
  notes: '',
  createdAt: now,
  updatedAt: now,
};

const job: Job = {
  id: 'job_1',
  customerId: customer.id,
  title: 'Kitchen remodel',
  jobAddress: '128 Market Street',
  description: 'Cabinet layout and finish work',
  status: 'Estimating',
  createdAt: now,
  updatedAt: now,
};

function makeEstimate(): Estimate {
  const lineItem = calculateLineItemTotal({
    id: 'li_1',
    type: 'labor',
    name: 'Lead carpenter',
    description: 'Install planning',
    quantity: 4,
    unit: 'hr',
    unitCostCents: 8500,
    markupPercent: 20,
    sortOrder: 0,
    taxable: true,
  });

  return {
    id: 'est_1',
    jobId: job.id,
    title: 'Kitchen estimate',
    status: 'Ready',
    lineItems: [lineItem],
    subtotalCents: lineItem.totalCents,
    markup: { type: 'percent', value: 10 },
    discount: { type: 'fixed', value: 0 },
    taxPercent: 0,
    taxable: true,
    adjustments: [],
    totalCents: 44880,
    notes: 'Includes labor.',
    terms: 'Valid for 30 days.',
    createdAt: now,
    updatedAt: now,
  };
}

test('creates immutable quote snapshots from an estimate', () => {
  const estimate = makeEstimate();
  const quote = createQuoteFromEstimate({
    customer,
    estimate,
    job,
    quoteNumber: 'QF-1001',
    settings: defaultSettings,
    version: 1,
  });

  estimate.lineItems[0].name = 'Changed after quote';

  assert.equal(quote.quoteNumber, 'QF-1001');
  assert.equal(quote.version, 1);
  assert.equal(quote.customerSnapshot.name, 'Ridgeview Homes');
  assert.equal(quote.jobSnapshot.title, 'Kitchen remodel');
  assert.equal(quote.lineItemsSnapshot[0].name, 'Lead carpenter');
  assert.equal(quote.pricingSnapshot.totalCents, 44880);
});

test('chooses the next quote number for the active prefix', () => {
  const quotes = [
    { quoteNumber: 'QF-1007' },
    { quoteNumber: 'QF-1002' },
    { quoteNumber: 'OLD-9999' },
  ] as Quote[];

  assert.equal(getNextQuoteNumber(quotes, defaultSettings), 'QF-1008');
});

test('chooses the next quote version by quote number', () => {
  const quotes = [
    { quoteNumber: 'QF-1001', version: 1 },
    { quoteNumber: 'QF-1001', version: 3 },
    { quoteNumber: 'QF-1002', version: 9 },
  ] as Quote[];

  assert.equal(getNextQuoteVersion(quotes, 'QF-1001'), 4);
});

test('sets status timestamps without mutating original quote', () => {
  const quote = createQuoteFromEstimate({
    customer,
    estimate: makeEstimate(),
    job,
    quoteNumber: 'QF-1001',
    settings: defaultSettings,
    version: 1,
  });

  const sentQuote = setQuoteStatus(quote, 'Sent');

  assert.equal(quote.status, 'Draft');
  assert.equal(sentQuote.status, 'Sent');
  assert.ok(sentQuote.sentAt);
});
