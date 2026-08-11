import { useLocalSearchParams } from 'expo-router';

import { JobDetailScreen } from '@/src/screens/JobDetailScreen';

export default function JobDetailRoute() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();

  return <JobDetailScreen jobId={jobId ?? ''} />;
}
