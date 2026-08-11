import { formatCurrency, formatPercent } from './pricing';
import { formatShortDate } from './records';
import { Quote, SignatureApproval } from './types';

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function createQuoteShareText(quote: Quote, approval?: SignatureApproval) {
  const lines = [
    `${quote.businessSnapshot.businessName || 'QuoteForge'} ${quote.quoteNumber} v${quote.version}`,
    `Status: ${quote.status}`,
    `Customer: ${quote.customerSnapshot.name}`,
    `Project: ${quote.jobSnapshot.title}`,
    `Total: ${formatCurrency(quote.pricingSnapshot.totalCents)}`,
    approval ? `Approved by ${approval.signerName} on ${formatShortDate(approval.signedAt)}` : 'Approval: Not approved',
  ];

  return lines.join('\n');
}

export function createQuoteHtml(quote: Quote, approval?: SignatureApproval) {
  const business = quote.businessSnapshot;
  const rows = quote.lineItemsSnapshot
    .map(
      (item) => `
        <tr>
          <td>
            <strong>${escapeHtml(item.name)}</strong>
            <div class="muted">${escapeHtml(item.description || item.type)}</div>
          </td>
          <td>${escapeHtml(String(item.quantity))} ${escapeHtml(item.unit)}</td>
          <td>${formatCurrency(item.unitPriceCents)}</td>
          <td>${formatCurrency(item.totalCents)}</td>
        </tr>
      `,
    )
    .join('');

  return `
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { color: #202225; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 32px; }
      .header { border-bottom: 3px solid #1c6d60; display: flex; justify-content: space-between; padding-bottom: 18px; }
      h1, h2, p { margin: 0; }
      h1 { font-size: 28px; }
      h2 { font-size: 18px; margin-top: 22px; }
      .muted { color: #66716a; font-size: 12px; line-height: 1.4; }
      .block { margin-top: 18px; }
      table { border-collapse: collapse; margin-top: 14px; width: 100%; }
      th { background: #eef3f0; font-size: 12px; text-align: left; text-transform: uppercase; }
      th, td { border: 1px solid #d9e2de; padding: 10px; vertical-align: top; }
      .summary { margin-left: auto; margin-top: 18px; width: 320px; }
      .summary-row { display: flex; justify-content: space-between; padding: 7px 0; }
      .total { border-top: 2px solid #202225; font-size: 20px; font-weight: 800; margin-top: 8px; padding-top: 10px; }
      .approval { background: #e8f5f1; border: 1px solid #abd4c9; border-radius: 8px; margin-top: 20px; padding: 12px; }
    </style>
  </head>
  <body>
    <section class="header">
      <div>
        <h1>${escapeHtml(business.businessName || 'QuoteForge')}</h1>
        <p class="muted">${escapeHtml(business.contractorName || '')}</p>
        <p class="muted">${escapeHtml(business.businessPhone || '')} ${escapeHtml(business.businessEmail || '')}</p>
        <p class="muted">${escapeHtml(business.businessAddress || '')}</p>
      </div>
      <div>
        <h2>Quote ${escapeHtml(quote.quoteNumber)} v${quote.version}</h2>
        <p class="muted">Created ${formatShortDate(quote.createdAt)}</p>
        <p class="muted">Status ${escapeHtml(quote.status)}</p>
      </div>
    </section>

    <section class="block">
      <h2>Customer</h2>
      <p><strong>${escapeHtml(quote.customerSnapshot.name)}</strong></p>
      <p class="muted">${escapeHtml(quote.customerSnapshot.phone || '')} ${escapeHtml(quote.customerSnapshot.email || '')}</p>
      <p class="muted">${escapeHtml(quote.customerSnapshot.address || '')}</p>
    </section>

    <section class="block">
      <h2>Project</h2>
      <p><strong>${escapeHtml(quote.jobSnapshot.title)}</strong></p>
      <p class="muted">${escapeHtml(quote.jobSnapshot.jobAddress || '')}</p>
      <p>${escapeHtml(quote.jobSnapshot.description || '')}</p>
    </section>

    <section class="block">
      <h2>Line Items</h2>
      <table>
        <thead>
          <tr><th>Item</th><th>Qty</th><th>Unit Price</th><th>Total</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </section>

    <section class="summary">
      <div class="summary-row"><span>Subtotal</span><strong>${formatCurrency(quote.pricingSnapshot.lineItemSubtotalCents)}</strong></div>
      <div class="summary-row"><span>Markup (${quote.pricingSnapshot.markup.type === 'percent' ? formatPercent(quote.pricingSnapshot.markup.value) : 'fixed'})</span><strong>${formatCurrency(quote.pricingSnapshot.estimateMarkupCents)}</strong></div>
      <div class="summary-row"><span>Discount</span><strong>-${formatCurrency(quote.pricingSnapshot.discountCents)}</strong></div>
      <div class="summary-row"><span>Adjustments</span><strong>${formatCurrency(quote.pricingSnapshot.adjustmentsCents)}</strong></div>
      <div class="summary-row"><span>Taxable Amount</span><strong>${formatCurrency(quote.pricingSnapshot.taxableAmountCents)}</strong></div>
      <div class="summary-row"><span>Tax (${formatPercent(quote.pricingSnapshot.taxPercent)})</span><strong>${formatCurrency(quote.pricingSnapshot.taxCents)}</strong></div>
      <div class="summary-row total"><span>Total</span><strong>${formatCurrency(quote.pricingSnapshot.totalCents)}</strong></div>
    </section>

    <section class="block">
      <h2>Notes</h2>
      <p>${escapeHtml(quote.notes || 'No notes provided.')}</p>
      <h2>Terms</h2>
      <p>${escapeHtml(quote.terms || business.defaultTerms)}</p>
    </section>

    <section class="approval">
      <strong>Approval</strong>
      <p>${approval ? `Approved by ${escapeHtml(approval.signerName)} on ${formatShortDate(approval.signedAt)}.` : 'Not approved.'}</p>
    </section>
  </body>
</html>`;
}
