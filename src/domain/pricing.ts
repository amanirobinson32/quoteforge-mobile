import {
  EstimateDraft,
  EstimateLineItem,
  LaborTemplate,
  MaterialTemplate,
  MoneyAdjustment,
  PricingRule,
  PricingSummary,
} from './types';

const centsFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

export function roundCents(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value);
}

export function parseMoneyToCents(value: string) {
  const cleanedValue = value.replace(/[$,\s]/g, '');
  const parsedValue = Number(cleanedValue);

  if (!Number.isFinite(parsedValue)) {
    return 0;
  }

  return roundCents(parsedValue * 100);
}

export function formatCurrency(cents: number) {
  return centsFormatter.format((Number.isFinite(cents) ? cents : 0) / 100);
}

export function formatPercent(value: number) {
  if (!Number.isFinite(value)) {
    return '0%';
  }

  return `${Number(value.toFixed(2))}%`;
}

export function calculatePercentCents(baseCents: number, percent: number) {
  if (!Number.isFinite(baseCents) || !Number.isFinite(percent)) {
    return 0;
  }

  return roundCents((baseCents * percent) / 100);
}

export function calculateLineItemTotal(item: Omit<EstimateLineItem, 'unitPriceCents' | 'totalCents'>): EstimateLineItem {
  const quantity = Number.isFinite(item.quantity) ? item.quantity : 0;
  const unitCostCents = Math.max(0, roundCents(item.unitCostCents));
  const markupPercent = Number.isFinite(item.markupPercent) ? Math.max(0, item.markupPercent) : 0;
  const unitPriceCents = unitCostCents + calculatePercentCents(unitCostCents, markupPercent);

  return {
    ...item,
    quantity,
    unitCostCents,
    markupPercent,
    unitPriceCents,
    totalCents: roundCents(Math.max(0, quantity) * unitPriceCents),
  };
}

export function createBlankLineItem(sortOrder: number): EstimateLineItem {
  return calculateLineItemTotal({
    id: `li_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    type: 'labor',
    name: '',
    description: '',
    quantity: 1,
    unit: 'hr',
    unitCostCents: 0,
    markupPercent: 0,
    sortOrder,
    taxable: true,
  });
}

export function createLineItemFromLaborTemplate(template: LaborTemplate, sortOrder: number): EstimateLineItem {
  return calculateLineItemTotal({
    id: `li_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    type: 'labor',
    name: template.name,
    description: template.description,
    quantity: 1,
    unit: template.defaultUnit || 'hr',
    unitCostCents: template.defaultRateCents,
    markupPercent: template.defaultMarkupPercent,
    sortOrder,
    taxable: true,
  });
}

export function createLineItemFromMaterialTemplate(template: MaterialTemplate, sortOrder: number): EstimateLineItem {
  return calculateLineItemTotal({
    id: `li_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    type: 'material',
    name: template.name,
    description: template.description,
    quantity: 1,
    unit: template.defaultUnit || 'ea',
    unitCostCents: template.defaultCostCents,
    markupPercent: template.defaultMarkupPercent,
    sortOrder,
    taxable: true,
  });
}

export function normalizeAdjustment(adjustment: MoneyAdjustment): MoneyAdjustment {
  return {
    ...adjustment,
    label: adjustment.label.trim(),
    amountCents: roundCents(adjustment.amountCents),
  };
}

function applyPricingRule(baseCents: number, rule: PricingRule) {
  if (!Number.isFinite(baseCents) || !Number.isFinite(rule.value)) {
    return 0;
  }

  if (rule.type === 'fixed') {
    return roundCents(rule.value);
  }

  return calculatePercentCents(baseCents, rule.value);
}

export function calculateEstimateTotals(estimate: Pick<EstimateDraft, 'lineItems' | 'markup' | 'discount' | 'taxPercent' | 'taxable' | 'adjustments'>): PricingSummary {
  const normalizedLineItems = estimate.lineItems.map((item) => calculateLineItemTotal(item));
  const lineItemSubtotalCents = normalizedLineItems.reduce((sum, item) => sum + item.totalCents, 0);
  const estimateMarkupCents = Math.max(0, applyPricingRule(lineItemSubtotalCents, estimate.markup));
  const beforeDiscountCents = lineItemSubtotalCents + estimateMarkupCents;
  const rawDiscountCents = Math.max(0, applyPricingRule(beforeDiscountCents, estimate.discount));
  const discountCents = Math.min(beforeDiscountCents, rawDiscountCents);
  const adjustmentsCents = estimate.adjustments.map(normalizeAdjustment).reduce((sum, adjustment) => sum + adjustment.amountCents, 0);
  const afterAdjustmentsCents = Math.max(0, beforeDiscountCents - discountCents + adjustmentsCents);
  const taxableAmountCents = estimate.taxable ? afterAdjustmentsCents : 0;
  const taxCents = calculatePercentCents(taxableAmountCents, Math.max(0, estimate.taxPercent));
  const totalCents = Math.max(0, afterAdjustmentsCents + taxCents);

  return {
    lineItemSubtotalCents,
    estimateMarkupCents,
    discountCents,
    adjustmentsCents,
    taxableAmountCents,
    taxCents,
    totalCents,
  };
}

export const pricingOrderDescription =
  'Pricing order: line-item selling totals, estimate markup, discount, fixed adjustments, taxable amount, tax, final total.';
