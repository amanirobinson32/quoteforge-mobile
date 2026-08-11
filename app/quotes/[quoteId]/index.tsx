import { useLocalSearchParams } from 'expo-router';

import { QuoteDetailScreen } from '@/src/screens/quotes/QuoteDetailScreen';

export default function QuoteDetailRoute() {
  const { quoteId } = useLocalSearchParams<{ quoteId: string }>();

  return <QuoteDetailScreen quoteId={quoteId ?? ''} />;
}
