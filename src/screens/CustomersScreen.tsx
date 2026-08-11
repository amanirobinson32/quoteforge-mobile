import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useRecords } from '@/src/state/RecordsContext';
import { AppButton } from '@/src/ui/AppButton';
import { Banner } from '@/src/ui/Banner';
import { EmptyState } from '@/src/ui/EmptyState';
import { TextField } from '@/src/ui/FormField';
import { CustomerCard } from '@/src/ui/RecordCards';
import { ScreenScaffold } from '@/src/ui/ScreenScaffold';
import { colors } from '@/src/ui/theme';

export function CustomersScreen() {
  const router = useRouter();
  const { customers, isLoading, jobCountByCustomerId, loadDemoData, notice, storageError } = useRecords();
  const [search, setSearch] = useState('');

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return customers;
    }

    return customers.filter((customer) =>
      [customer.name, customer.phone, customer.email, customer.address, customer.notes]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [customers, search]);

  return (
    <ScreenScaffold
      rightAction={<AppButton icon="+" label="Add" onPress={() => router.push('/customers/new')} small />}
      title="Customers"
      subtitle={`${customers.length} saved locally`}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {isLoading ? <Banner tone="loading">Loading customer directory...</Banner> : null}
        {storageError ? <Banner tone="error">{storageError}</Banner> : null}
        {notice ? <Banner tone="success">{notice}</Banner> : null}

        <TextField
          autoCapitalize="none"
          label="Search customers"
          onChangeText={setSearch}
          placeholder="Name, phone, email, or address"
          returnKeyType="search"
          value={search}
        />

        {!isLoading && customers.length === 0 ? (
          <EmptyState
            message="Add customer contact details and notes before creating job records."
            primaryAction={{ label: 'Add Customer', onPress: () => router.push('/customers/new') }}
            secondaryAction={{ label: 'Load Demo Data', onPress: loadDemoData }}
            title="No customers yet"
          />
        ) : null}

        {customers.length > 0 && filteredCustomers.length === 0 ? (
          <Banner>No customers match that search.</Banner>
        ) : null}

        <View style={styles.list}>
          {filteredCustomers.map((customer) => (
            <CustomerCard
              customer={customer}
              jobCount={jobCountByCustomerId[customer.id] ?? 0}
              key={customer.id}
            />
          ))}
        </View>

        {filteredCustomers.length > 0 ? (
          <Text style={styles.footerText}>Records are stored only on this device.</Text>
        ) : null}
      </ScrollView>
    </ScreenScaffold>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
    padding: 18,
    paddingBottom: 34,
  },
  list: {
    gap: 10,
  },
  footerText: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
  },
});
