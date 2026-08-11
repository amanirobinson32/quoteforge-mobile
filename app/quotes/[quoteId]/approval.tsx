import { useLocalSearchParams } from 'expo-router';

import { ApprovalScreen } from '@/src/screens/quotes/ApprovalScreen';

export default function QuoteApprovalRoute() {
  const { quoteId } = useLocalSearchParams<{ quoteId: string }>();

  return <ApprovalScreen quoteId={quoteId ?? ''} />;
}
