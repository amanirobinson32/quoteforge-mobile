import { useLocalSearchParams } from 'expo-router';

import { QuotePreviewScreen } from '@/src/screens/quotes/QuotePreviewScreen';

export default function QuotePreviewRoute() {
  const { quoteId } = useLocalSearchParams<{ quoteId: string }>();

  return <QuotePreviewScreen quoteId={quoteId ?? ''} />;
}
