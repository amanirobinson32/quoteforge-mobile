import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert, ScrollView, Share as NativeShare, StyleSheet, Text, View } from 'react-native';

import { createQuoteHtml, createQuoteShareText } from '@/src/domain/quoteHtml';
import { formatCurrency } from '@/src/domain/pricing';
import { useRecords } from '@/src/state/RecordsContext';
import { AppButton } from '@/src/ui/AppButton';
import { Banner } from '@/src/ui/Banner';
import { EmptyState } from '@/src/ui/EmptyState';
import { ScreenScaffold } from '@/src/ui/ScreenScaffold';
import { StatusPill } from '@/src/ui/StatusPill';
import { colors, radii } from '@/src/ui/theme';

function MoneyRow({ label, value }: { label: string; value: number }) {
  return (
    <View style={styles.moneyRow}>
      <Text style={styles.moneyLabel}>{label}</Text>
      <Text style={styles.moneyValue}>{formatCurrency(value)}</Text>
    </View>
  );
}

export function QuotePreviewScreen({ quoteId }: { quoteId: string }) {
  const { approvals, isLoading, quotes, storageError, updateQuoteStatus } = useRecords();
  const quote = quotes.find((item) => item.id === quoteId);
  const approval = approvals.find((item) => item.quoteId === quoteId);

  async function sharePdf() {
    if (!quote) return;

    try {
      const { uri } = await Print.printToFileAsync({
        html: createQuoteHtml(quote, approval),
      });
      const sharingAvailable = await Sharing.isAvailableAsync();

      if (sharingAvailable) {
        await Sharing.shareAsync(uri, {
          dialogTitle: `${quote.quoteNumber} v${quote.version}`,
          mimeType: 'application/pdf',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('PDF created', `PDF saved locally at ${uri}`);
      }
    } catch (error) {
      Alert.alert('PDF not created', error instanceof Error ? error.message : 'Try sharing text instead.');
    }
  }

  async function shareText() {
    if (!quote) return;

    try {
      await NativeShare.share({
        title: `${quote.quoteNumber} v${quote.version}`,
        message: createQuoteShareText(quote, approval),
      });
    } catch (error) {
      Alert.alert('Quote not shared', error instanceof Error ? error.message : 'Try again.');
    }
  }

  async function markSent() {
    if (!quote) return;

    try {
      await updateQuoteStatus(quote.id, 'Sent');
    } catch (error) {
      Alert.alert('Status not updated', error instanceof Error ? error.message : 'Try again.');
    }
  }

  if (isLoading) {
    return (
      <ScreenScaffold showBack title="Quote Preview">
        <View style={styles.loadingWrap}>
          <Banner tone="loading">Loading quote preview...</Banner>
        </View>
      </ScreenScaffold>
    );
  }

  if (!quote) {
    return (
      <ScreenScaffold showBack title="Quote Preview">
        <View style={styles.loadingWrap}>
          <EmptyState message="This quote record is not available on this device." title="Quote not found" />
        </View>
      </ScreenScaffold>
    );
  }

  return (
    <ScreenScaffold
      rightAction={<StatusPill status={quote.status} />}
      showBack
      subtitle="Customer-ready local snapshot"
      title="Quote Preview">
      <ScrollView contentContainerStyle={styles.content}>
        {storageError ? <Banner tone="error">{storageError}</Banner> : null}

        <View style={styles.preview}>
          <View style={styles.previewHeader}>
            <View style={styles.titleStack}>
              <Text style={styles.business}>{quote.businessSnapshot.businessName}</Text>
              <Text style={styles.meta}>{quote.businessSnapshot.businessPhone || quote.businessSnapshot.businessEmail}</Text>
            </View>
            <View style={styles.quoteBadge}>
              <Text style={styles.quoteBadgeLabel}>Quote</Text>
              <Text style={styles.quoteBadgeValue}>
                {quote.quoteNumber} v{quote.version}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.twoColumn}>
            <View style={styles.column}>
              <Text style={styles.sectionLabel}>Bill To</Text>
              <Text style={styles.bodyStrong}>{quote.customerSnapshot.name}</Text>
              <Text style={styles.bodyText}>{quote.customerSnapshot.address || quote.customerSnapshot.email}</Text>
              <Text style={styles.bodyText}>{quote.customerSnapshot.phone}</Text>
            </View>
            <View style={styles.column}>
              <Text style={styles.sectionLabel}>Project</Text>
              <Text style={styles.bodyStrong}>{quote.jobSnapshot.title}</Text>
              <Text style={styles.bodyText}>{quote.jobSnapshot.jobAddress}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Scope</Text>
            <Text style={styles.bodyText}>{quote.jobSnapshot.description || quote.notes || 'Scope details are included in line items.'}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Line Items</Text>
            <View style={styles.lineItemList}>
              {quote.lineItemsSnapshot.map((item) => (
                <View key={item.id} style={styles.lineItem}>
                  <View style={styles.titleStack}>
                    <Text style={styles.lineItemTitle}>{item.name}</Text>
                    <Text style={styles.bodyText}>
                      {item.quantity} {item.unit} x {formatCurrency(item.unitPriceCents)}
                    </Text>
                    {item.description ? <Text style={styles.bodyText}>{item.description}</Text> : null}
                  </View>
                  <Text style={styles.lineItemAmount}>{formatCurrency(item.totalCents)}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Totals</Text>
            <MoneyRow label="Line Items" value={quote.pricingSnapshot.lineItemSubtotalCents} />
            <MoneyRow label="Estimate Markup" value={quote.pricingSnapshot.estimateMarkupCents} />
            <MoneyRow label="Discount" value={-quote.pricingSnapshot.discountCents} />
            <MoneyRow label="Adjustments" value={quote.pricingSnapshot.adjustmentsCents} />
            <MoneyRow label="Tax" value={quote.pricingSnapshot.taxCents} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatCurrency(quote.pricingSnapshot.totalCents)}</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Terms</Text>
            <Text style={styles.bodyText}>{quote.terms}</Text>
            {approval ? (
              <Text style={styles.approvalText}>Approved by {approval.signerName}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.actions}>
          <AppButton label="Create PDF / Share" onPress={sharePdf} />
          <AppButton label="Share Text Fallback" onPress={shareText} variant="secondary" />
          <AppButton label="Mark Sent" onPress={markSent} variant="secondary" />
        </View>
      </ScrollView>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 16,
    padding: 18,
    paddingBottom: 34,
  },
  loadingWrap: {
    padding: 18,
  },
  preview: {
    gap: 18,
    padding: 16,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  previewHeader: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  titleStack: {
    minWidth: 0,
    flex: 1,
  },
  business: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  meta: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  quoteBadge: {
    alignSelf: 'flex-start',
    gap: 3,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: radii.sm,
    backgroundColor: colors.primarySoft,
  },
  quoteBadgeLabel: {
    color: colors.primaryDark,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  quoteBadgeValue: {
    color: colors.primaryDark,
    fontSize: 14,
    fontWeight: '900',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  twoColumn: {
    gap: 14,
  },
  column: {
    gap: 4,
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '900',
  },
  bodyStrong: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
    lineHeight: 21,
  },
  bodyText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  lineItemList: {
    gap: 8,
  },
  lineItem: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lineItemTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  lineItemAmount: {
    flexShrink: 0,
    color: colors.text,
    fontSize: 14,
    fontWeight: '900',
  },
  moneyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  moneyLabel: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '800',
  },
  moneyValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  totalLabel: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '900',
  },
  totalValue: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: '900',
  },
  approvalText: {
    color: colors.success,
    fontSize: 14,
    fontWeight: '900',
  },
  actions: {
    gap: 10,
  },
});
