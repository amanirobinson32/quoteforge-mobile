import { useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Job, JobDraft, jobStatuses, JobStatus } from '@/src/domain/types';
import { hasValidationErrors, validateJobDraft } from '@/src/domain/validation';
import { useRecords } from '@/src/state/RecordsContext';
import { AppButton } from '@/src/ui/AppButton';
import { Banner } from '@/src/ui/Banner';
import { EmptyState } from '@/src/ui/EmptyState';
import { TextField } from '@/src/ui/FormField';
import { ScreenScaffold } from '@/src/ui/ScreenScaffold';
import { StatusPill } from '@/src/ui/StatusPill';
import { colors, radii } from '@/src/ui/theme';

const emptyJobDraft: JobDraft = {
  customerId: '',
  title: '',
  jobAddress: '',
  description: '',
  status: 'New',
};

type JobFormScreenProps = {
  initialCustomerId?: string;
  jobId?: string;
  mode: 'create' | 'edit';
};

type JobFormBodyProps = {
  initialValues: JobDraft;
  isEditing: boolean;
  jobId: string;
};

function draftFromJob(job: Job): JobDraft {
  return {
    customerId: job.customerId,
    title: job.title,
    jobAddress: job.jobAddress,
    description: job.description,
    status: job.status,
  };
}

function LoadingJobForm() {
  return (
    <ScreenScaffold showBack title="Edit Job">
      <View style={styles.content}>
        <Banner tone="loading">Loading job records...</Banner>
      </View>
    </ScreenScaffold>
  );
}

function JobFormBody({ initialValues, isEditing, jobId }: JobFormBodyProps) {
  const router = useRouter();
  const { addJob, customers, isLoading, storageError, updateJob } = useRecords();
  const [values, setValues] = useState<JobDraft>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof JobDraft, string>>>({});
  const [submitError, setSubmitError] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = customerSearch.trim().toLowerCase();

    if (!normalizedSearch) {
      return customers;
    }

    return customers.filter((customer) =>
      [customer.name, customer.phone, customer.email, customer.address]
        .join(' ')
        .toLowerCase()
        .includes(normalizedSearch),
    );
  }, [customerSearch, customers]);

  function updateField<K extends keyof JobDraft>(field: K, value: JobDraft[K]) {
    setValues((currentValues) => ({ ...currentValues, [field]: value }));
    setErrors((currentErrors) => ({ ...currentErrors, [field]: undefined }));
    setSubmitError('');
  }

  async function handleSubmit() {
    const nextErrors = validateJobDraft(
      values,
      customers.map((customer) => customer.id),
    );
    setErrors(nextErrors);
    setSubmitError('');

    if (hasValidationErrors(nextErrors)) {
      return;
    }

    try {
      const savedJob = isEditing ? await updateJob(jobId, values) : await addJob(values);

      router.replace({
        pathname: '/jobs/[jobId]',
        params: { jobId: savedJob.id },
      });
    } catch {
      setSubmitError('Job could not be saved. Check the fields and try again.');
    }
  }

  return (
    <ScreenScaffold
      showBack
      subtitle="Job title and customer selection are required."
      title={isEditing ? 'Edit Job' : 'Add Job'}>
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: 'padding', android: undefined })}
        keyboardVerticalOffset={12}
        style={styles.keyboardView}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {isLoading ? <Banner tone="loading">Loading job records...</Banner> : null}
          {storageError ? <Banner tone="error">{storageError}</Banner> : null}
          {submitError ? <Banner tone="error">{submitError}</Banner> : null}
          {hasValidationErrors(errors) ? <Banner tone="error">Fix the highlighted job fields.</Banner> : null}

          <TextField
            autoCapitalize="words"
            error={errors.title}
            label="Job Title"
            onChangeText={(value) => updateField('title', value)}
            placeholder="Kitchen remodel walkthrough"
            returnKeyType="next"
            value={values.title}
          />

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Customer</Text>
            {errors.customerId ? <Text style={styles.fieldError}>{errors.customerId}</Text> : null}
            {customers.length === 0 ? (
              <EmptyState
                message="Add a customer before saving a job."
                primaryAction={{ label: 'Add Customer', onPress: () => router.push('/customers/new') }}
                title="No customers available"
              />
            ) : (
              <>
                <TextField
                  autoCapitalize="none"
                  label="Filter Customers"
                  onChangeText={setCustomerSearch}
                  placeholder="Search saved customers"
                  value={customerSearch}
                />
                <View style={styles.choiceList}>
                  {filteredCustomers.map((customer) => {
                    const isSelected = values.customerId === customer.id;

                    return (
                      <Pressable
                        accessibilityRole="button"
                        key={customer.id}
                        onPress={() => updateField('customerId', customer.id)}
                        style={({ pressed }) => [
                          styles.choiceCard,
                          isSelected && styles.choiceCardSelected,
                          pressed && styles.pressed,
                        ]}>
                        <Text style={[styles.choiceTitle, isSelected && styles.choiceTitleSelected]}>
                          {customer.name}
                        </Text>
                        <Text numberOfLines={1} style={styles.choiceMeta}>
                          {customer.address || customer.phone || customer.email || 'No contact details yet'}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}
          </View>

          <TextField
            label="Job Address"
            multiline
            onChangeText={(value) => updateField('jobAddress', value)}
            placeholder="Job site address"
            value={values.jobAddress}
          />
          <TextField
            label="Description"
            multiline
            onChangeText={(value) => updateField('description', value)}
            placeholder="Scope notes from the call or site visit"
            value={values.description}
          />

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Status</Text>
            <View style={styles.statusGrid}>
              {jobStatuses.map((status) => {
                const isSelected = values.status === status;

                return (
                  <Pressable
                    accessibilityRole="button"
                    key={status}
                    onPress={() => updateField('status', status as JobStatus)}
                    style={({ pressed }) => [
                      styles.statusOption,
                      isSelected && styles.statusOptionSelected,
                      pressed && styles.pressed,
                    ]}>
                    <StatusPill status={status} />
                  </Pressable>
                );
              })}
            </View>
          </View>

          <AppButton
            disabled={isLoading}
            fullWidth
            label={isEditing ? 'Save Changes' : 'Save Job'}
            onPress={handleSubmit}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenScaffold>
  );
}

export function JobFormScreen({ initialCustomerId, jobId = '', mode }: JobFormScreenProps) {
  const { isLoading, jobs } = useRecords();
  const isEditing = mode === 'edit';
  const existingJob = jobs.find((job) => job.id === jobId);

  if (isEditing && isLoading) {
    return <LoadingJobForm />;
  }

  if (isEditing && !existingJob) {
    return (
      <ScreenScaffold showBack title="Edit Job">
        <View style={styles.content}>
          <EmptyState message="This job record is not available on this device." title="Job not found" />
        </View>
      </ScreenScaffold>
    );
  }

  return (
    <JobFormBody
      initialValues={
        existingJob
          ? draftFromJob(existingJob)
          : {
              ...emptyJobDraft,
              customerId: initialCustomerId ?? '',
            }
      }
      isEditing={isEditing}
      jobId={jobId}
      key={existingJob?.id ?? initialCustomerId ?? 'new-job'}
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
  fieldGroup: {
    gap: 9,
  },
  label: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '800',
  },
  fieldError: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: '700',
  },
  choiceList: {
    gap: 8,
  },
  choiceCard: {
    minHeight: 58,
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 13,
    paddingVertical: 10,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  choiceCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  choiceTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '900',
  },
  choiceTitleSelected: {
    color: colors.primaryDark,
  },
  choiceMeta: {
    color: colors.muted,
    fontSize: 13,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusOption: {
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: 'transparent',
    padding: 2,
  },
  statusOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  pressed: {
    opacity: 0.78,
  },
});
