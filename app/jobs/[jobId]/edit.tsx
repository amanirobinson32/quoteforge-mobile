import { useLocalSearchParams } from 'expo-router';

import { JobFormScreen } from '@/src/screens/JobFormScreen';

export default function EditJobRoute() {
  const { jobId } = useLocalSearchParams<{ jobId: string }>();

  return <JobFormScreen jobId={jobId ?? ''} mode="edit" />;
}
