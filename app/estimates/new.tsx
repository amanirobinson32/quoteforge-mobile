import { useLocalSearchParams } from 'expo-router';

import { EstimateBuilderScreen } from '@/src/screens/estimates/EstimateBuilderScreen';

export default function NewEstimateRoute() {
  const { jobId } = useLocalSearchParams<{ jobId?: string }>();

  return <EstimateBuilderScreen initialJobId={jobId} mode="create" />;
}
