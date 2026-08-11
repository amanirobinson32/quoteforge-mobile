import { useLocalSearchParams } from 'expo-router';

import { EstimateBuilderScreen } from '@/src/screens/estimates/EstimateBuilderScreen';

export default function EditEstimateRoute() {
  const { estimateId } = useLocalSearchParams<{ estimateId: string }>();

  return <EstimateBuilderScreen estimateId={estimateId ?? ''} mode="edit" />;
}
