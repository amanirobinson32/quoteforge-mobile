import { useState } from 'react';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { Customer, CustomerDraft } from '@/src/domain/types';
import { hasValidationErrors, validateCustomerDraft } from '@/src/domain/validation';
import { useRecords } from '@/src/state/RecordsContext';
import { AppButton } from '@/src/ui/AppButton';
import { Banner } from '@/src/ui/Banner';
import { EmptyState } from '@/src/ui/EmptyState';
import { TextField } from '@/src/ui/FormField';
import { ScreenScaffold } from '@/src/ui/ScreenScaffold';

const emptyCustomerDraft: CustomerDraft = {
  name: '',
  phone: '',
  email: '',
  address: '',
  notes: '',
};

type CustomerFormScreenProps = {
  customerId?: string;
  mode: 'create' | 'edit';
};

type CustomerFormBodyProps = {
  customerId: string;
  initialValues: CustomerDraft;
  isEditing: boolean;
};

function draftFromCustomer(customer: Customer): CustomerDraft {
  return {
    name: customer.name,
    phone: customer.phone,
    email: customer.email,
    address: customer.address,
    notes: customer.notes,
  };
}

function LoadingCustomerForm() {
  return (
    <ScreenScaffold showBack title="Edit Customer">
      <View style={styles.content}>
        <Banner tone="loading">Loading customer records...</Banner>
      </View>
    </ScreenScaffold>
  );
}

function CustomerFormBody({ customerId, initialValues, isEditing }: CustomerFormBodyProps) {
  const router = useRouter();
  const { addCustomer, isLoading, storageError, updateCustomer } = useRecords();
  const [values, setValues] = useState<CustomerDraft>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof CustomerDraft, string>>>({});
  const [submitError, setSubmitError] = useState('');

  function updateField(field: keyof CustomerDraft, value: string) {
    setValues((currentValues) => ({ ...currentValues, [field]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }));
    setSubmitError('');
  }

  async function handleSubmit() {
    const nextErrors = validateCustomerDraft(values);
    setErrors(nextErrors);
    setSubmitError('');

    if (hasValidationErrors(nextErrors)) {
      return;
    }

    try {
      const savedCustomer = isEditing ? await updateCustomer(customerId, values) : await addCustomer(values);

      router.replace({
        pathname: '/customers/[customerId]',
        params: { customerId: savedCustomer.id },
      });
    } catch {
      setSubmitError('Customer could not be saved. Check the fields and try again.');
    }
  }

  return (
    <ScreenScaffold
      showBack
      subtitle="Name is required. Email is optional, but must be valid."
      title={isEditing ? 'Edit Customer' : 'Add Customer'}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={12}
        style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {isLoading ? <Banner tone="loading">Loading customer records...</Banner> : null}
          {storageError ? <Banner tone="error">{storageError}</Banner> : null}
          {submitError ? <Banner tone="error">{submitError}</Banner> : null}
          {hasValidationErrors(errors) ? <Banner tone="error">Fix the highlighted customer fields.</Banner> : null}

          <TextField
            autoCapitalize="words"
            error={errors.name}
            label="Customer Name"
            onChangeText={(value) => updateField('name', value)}
            placeholder="Customer or company name"
            returnKeyType="next"
            value={values.name}
          />
          <TextField
            keyboardType="phone-pad"
            label="Phone"
            onChangeText={(value) => updateField('phone', value)}
            placeholder="(555) 012-3456"
            textContentType="telephoneNumber"
            value={values.phone}
          />
          <TextField
            autoCapitalize="none"
            autoCorrect={false}
            error={errors.email}
            keyboardType="email-address"
            label="Email"
            onChangeText={(value) => updateField('email', value)}
            placeholder="name@example.com"
            textContentType="emailAddress"
            value={values.email}
          />
          <TextField
            label="Address"
            multiline
            onChangeText={(value) => updateField('address', value)}
            placeholder="Billing or service address"
            value={values.address}
          />
          <TextField
            label="Notes"
            multiline
            onChangeText={(value) => updateField('notes', value)}
            placeholder="Access details, preferences, reminders"
            value={values.notes}
          />

          <AppButton
            disabled={isLoading}
            fullWidth
            label={isEditing ? 'Save Changes' : 'Save Customer'}
            onPress={handleSubmit}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenScaffold>
  );
}

export function CustomerFormScreen({ customerId = '', mode }: CustomerFormScreenProps) {
  const { customers, isLoading } = useRecords();
  const isEditing = mode === 'edit';
  const existingCustomer = customers.find((customer) => customer.id === customerId);

  if (isEditing && isLoading) {
    return <LoadingCustomerForm />;
  }

  if (isEditing && !existingCustomer) {
    return (
      <ScreenScaffold showBack title="Edit Customer">
        <View style={styles.content}>
          <EmptyState message="This customer record is not available on this device." title="Customer not found" />
        </View>
      </ScreenScaffold>
    );
  }

  return (
    <CustomerFormBody
      customerId={customerId}
      initialValues={existingCustomer ? draftFromCustomer(existingCustomer) : emptyCustomerDraft}
      isEditing={isEditing}
      key={existingCustomer?.id ?? 'new-customer'}
    />
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  content: {
    gap: 14,
    padding: 18,
    paddingBottom: 34,
  },
});
