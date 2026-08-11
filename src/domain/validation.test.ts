import assert from 'node:assert/strict';
import test from 'node:test';

import { calculateLineItemTotal } from './pricing';
import {
  validateApprovalDraft,
  validateCustomerDraft,
  validateEstimateDraft,
  validateJobDraft,
  validateLaborTemplateDraft,
  validateMaterialTemplateDraft,
} from './validation';

test('validates customer required name and optional email format', () => {
  assert.equal(validateCustomerDraft({ name: '', phone: '', email: '', address: '', notes: '' }).name, 'Customer name is required.');
  assert.equal(
    validateCustomerDraft({ name: 'Ridgeview', phone: '', email: 'bad-email', address: '', notes: '' }).email,
    'Enter a valid email address.',
  );
  assert.deepEqual(
    validateCustomerDraft({ name: 'Ridgeview', phone: '', email: 'office@example.com', address: '', notes: '' }),
    {},
  );
});

test('validates job title and customer selection', () => {
  const errors = validateJobDraft(
    {
      customerId: 'missing',
      title: '',
      jobAddress: '',
      description: '',
      status: 'New',
    },
    ['cus_1'],
  );

  assert.equal(errors.title, 'Job title is required.');
  assert.equal(errors.customerId, 'Select a customer for this job.');
});

test('validates estimate required fields and line item math', () => {
  const invalidErrors = validateEstimateDraft(
    {
      jobId: '',
      title: '',
      status: 'Draft',
      lineItems: [],
      markup: { type: 'percent', value: 0 },
      discount: { type: 'fixed', value: 0 },
      taxPercent: 0,
      taxable: true,
      adjustments: [],
      notes: '',
      terms: '',
    },
    ['job_1'],
  );

  assert.equal(invalidErrors.title, 'Estimate title is required.');
  assert.equal(invalidErrors.jobId, 'Select a job for this estimate.');
  assert.equal(invalidErrors.lineItems, 'Add at least one line item.');

  const validErrors = validateEstimateDraft(
    {
      jobId: 'job_1',
      title: 'Kitchen estimate',
      status: 'Draft',
      lineItems: [
        calculateLineItemTotal({
          id: 'li_1',
          type: 'labor',
          name: 'Lead carpenter',
          description: '',
          quantity: 1,
          unit: 'hr',
          unitCostCents: 8500,
          markupPercent: 20,
          sortOrder: 0,
          taxable: true,
        }),
      ],
      markup: { type: 'percent', value: 10 },
      discount: { type: 'fixed', value: 0 },
      taxPercent: 0,
      taxable: true,
      adjustments: [],
      notes: '',
      terms: '',
    },
    ['job_1'],
  );

  assert.deepEqual(validErrors, {});
});

test('validates templates and local typed approvals', () => {
  assert.equal(
    validateLaborTemplateDraft({
      name: '',
      description: '',
      defaultUnit: 'hr',
      defaultRateCents: -1,
      defaultMarkupPercent: -5,
    }).name,
    'Template name is required.',
  );
  assert.equal(
    validateMaterialTemplateDraft({
      name: 'Deck board',
      description: '',
      defaultUnit: 'ea',
      defaultCostCents: -1,
      defaultMarkupPercent: 10,
    }).defaultCostCents,
    'Cost must be a non-negative amount.',
  );

  const approvalErrors = validateApprovalDraft({
    quoteId: 'quo_1',
    signerName: '',
    acceptedTerms: false,
  });

  assert.equal(approvalErrors.signerName, 'Signer name is required.');
  assert.equal(approvalErrors.acceptedTerms, 'Terms must be accepted before approval.');
});
