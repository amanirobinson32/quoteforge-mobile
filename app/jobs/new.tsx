import { useLocalSearchParams } from 'expo-router';

import { JobFormScreen } from '@/src/screens/JobFormScreen';

export default function NewJobRoute() {
  const { customerId } = useLocalSearchParams<{ customerId?: string }>();

  return <JobFormScreen initialCustomerId={customerId} mode="create" />;
}
