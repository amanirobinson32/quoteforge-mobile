import { useLocalSearchParams } from 'expo-router';

import { QuoteVersionHistoryScreen } from '@/src/screens/quotes/QuoteVersionHistoryScreen';

export default function QuoteVersionsRoute() {
  const { quoteId } = useLocalSearchParams<{ quoteId: string }>();

  return <QuoteVersionHistoryScreen quoteId={quoteId ?? ''} />;
}
