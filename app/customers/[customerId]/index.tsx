import { useLocalSearchParams } from 'expo-router';

import { CustomerDetailScreen } from '@/src/screens/CustomerDetailScreen';

export default function CustomerDetailRoute() {
  const { customerId } = useLocalSearchParams<{ customerId: string }>();

  return <CustomerDetailScreen customerId={customerId ?? ''} />;
}
