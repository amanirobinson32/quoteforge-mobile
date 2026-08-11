import assert from 'node:assert/strict';
import test from 'node:test';

import {
  calculateEstimateTotals,
  calculateLineItemTotal,
  createLineItemFromLaborTemplate,
  createLineItemFromMaterialTemplate,
  formatCurrency,
  parseMoneyToCents,
} from './pricing';
import { EstimateDraft, LaborTemplate, MaterialTemplate } from './types';

test('calculates line item totals with per-item markup', () => {
  const lineItem = calculateLineItemTotal({
    id: 'li_1',
    type: 'labor',
    name: 'Install cabinets',
    description: '',
    quantity: 2,
    unit: 'hr',
    unitCostCents: 10000,
    markupPercent: 25,
    sortOrder: 0,
    taxable: true,
  });

  assert.equal(lineItem.unitPriceCents, 12500);
  assert.equal(lineItem.totalCents, 25000);
});

test('calculates estimate totals in deterministic pricing order', () => {
  const draft: EstimateDraft = {
    jobId: 'job_1',
    title: 'Kitchen estimate',
    status: 'Draft',
    lineItems: [
      calculateLineItemTotal({
        id: 'li_1',
        type: 'labor',
        name: 'Install cabinets',
        description: '',
        quantity: 2,
        unit: 'hr',
        unitCostCents: 10000,
        markupPercent: 25,
        sortOrder: 0,
        taxable: true,
      }),
    ],
    markup: { type: 'percent', value: 10 },
    discount: { type: 'fixed', value: 5000 },
    taxPercent: 7.5,
    taxable: true,
    adjustments: [{ id: 'adj_1', label: 'Site protection', amountCents: 1000 }],
    notes: '',
    terms: '',
  };

  const totals = calculateEstimateTotals(draft);

  assert.equal(totals.lineItemSubtotalCents, 25000);
  assert.equal(totals.estimateMarkupCents, 2500);
  assert.equal(totals.discountCents, 5000);
  assert.equal(totals.adjustmentsCents, 1000);
  assert.equal(totals.taxableAmountCents, 23500);
  assert.equal(totals.taxCents, 1763);
  assert.equal(totals.totalCents, 25263);
});

test('parses and formats money values', () => {
  assert.equal(parseMoneyToCents('$1,234.56'), 123456);
  assert.equal(parseMoneyToCents('-50'), -5000);
  assert.equal(formatCurrency(123456), '$1,234.56');
});

test('copies templates into independent line items', () => {
  const laborTemplate: LaborTemplate = {
    id: 'lab_1',
    name: 'Lead carpenter',
    description: 'Skilled labor',
    defaultUnit: 'hr',
    defaultRateCents: 8500,
    defaultMarkupPercent: 20,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
  const materialTemplate: MaterialTemplate = {
    id: 'mat_1',
    name: 'Deck board',
    description: 'Pressure-treated board',
    defaultUnit: 'ea',
    defaultCostCents: 1850,
    defaultMarkupPercent: 25,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };

  const laborItem = createLineItemFromLaborTemplate(laborTemplate, 0);
  const materialItem = createLineItemFromMaterialTemplate(materialTemplate, 1);

  assert.equal(laborItem.type, 'labor');
  assert.equal(laborItem.unitPriceCents, 10200);
  assert.equal(materialItem.type, 'material');
  assert.equal(materialItem.unitPriceCents, 2313);
  assert.notEqual(laborItem.id, laborTemplate.id);
  assert.notEqual(materialItem.id, materialTemplate.id);
});
