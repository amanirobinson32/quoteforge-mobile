import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { asyncStorageRecordsRepository } from '@/src/data/asyncStorageRecordsRepository';
import { RecordsRepository } from '@/src/data/recordsRepository';
import { validateImportedSnapshot } from '@/src/domain/migrations';
import { calculateLineItemTotal } from '@/src/domain/pricing';
import {
  createApproval,
  createCustomer,
  createEmptySnapshot,
  createEstimate,
  createJob,
  createLaborTemplate,
  createMaterialTemplate,
  defaultSettings,
  duplicateEstimateRecord,
  duplicateLaborTemplateRecord,
  duplicateMaterialTemplateRecord,
  sortByUpdatedAt,
  updateCustomerRecord,
  updateEstimateRecord,
  updateJobRecord,
  updateLaborTemplateRecord,
  updateMaterialTemplateRecord,
} from '@/src/domain/records';
import { createQuoteFromEstimate, getNextQuoteNumber, getNextQuoteVersion, setQuoteStatus } from '@/src/domain/quotes';
import {
  AppSettings,
  ApprovalDraft,
  Customer,
  CustomerDraft,
  Estimate,
  EstimateDraft,
  EstimateLineItem,
  Job,
  JobDraft,
  LaborTemplate,
  LaborTemplateDraft,
  LocalSnapshot,
  MaterialTemplate,
  MaterialTemplateDraft,
  Quote,
  QuoteStatus,
  SignatureApproval,
} from '@/src/domain/types';

type RecordsContextValue = {
  activeJobs: Job[];
  approvals: SignatureApproval[];
  customerNameById: Record<string, string>;
  customers: Customer[];
  estimates: Estimate[];
  isLoading: boolean;
  jobCountByCustomerId: Record<string, number>;
  jobs: Job[];
  laborTemplates: LaborTemplate[];
  materialTemplates: MaterialTemplate[];
  notice: string;
  quotes: Quote[];
  recentJobs: Job[];
  recentQuotes: Quote[];
  settings: AppSettings;
  storageError: string;
  addCustomer(draft: CustomerDraft): Promise<Customer>;
  updateCustomer(id: string, draft: CustomerDraft): Promise<Customer>;
  deleteCustomer(id: string): Promise<void>;
  addJob(draft: JobDraft): Promise<Job>;
  updateJob(id: string, draft: JobDraft): Promise<Job>;
  updateJobStatus(id: string, status: Job['status']): Promise<Job>;
  deleteJob(id: string): Promise<void>;
  saveEstimate(id: string | undefined, draft: EstimateDraft): Promise<Estimate>;
  saveEstimateAndCreateQuote(id: string | undefined, draft: EstimateDraft): Promise<{ estimate: Estimate; quote: Quote }>;
  duplicateEstimate(id: string): Promise<Estimate>;
  deleteEstimate(id: string): Promise<void>;
  createQuote(estimateId: string): Promise<Quote>;
  reviseQuote(quoteId: string): Promise<Quote>;
  updateQuoteStatus(id: string, status: QuoteStatus): Promise<Quote>;
  approveQuote(draft: ApprovalDraft): Promise<SignatureApproval>;
  rejectQuote(id: string): Promise<Quote>;
  resetQuoteApproval(id: string): Promise<void>;
  saveLaborTemplate(id: string | undefined, draft: LaborTemplateDraft): Promise<LaborTemplate>;
  duplicateLaborTemplate(id: string): Promise<LaborTemplate>;
  deleteLaborTemplate(id: string): Promise<void>;
  saveMaterialTemplate(id: string | undefined, draft: MaterialTemplateDraft): Promise<MaterialTemplate>;
  duplicateMaterialTemplate(id: string): Promise<MaterialTemplate>;
  deleteMaterialTemplate(id: string): Promise<void>;
  updateSettings(draft: AppSettings): Promise<void>;
  exportSnapshotString(): string;
  importSnapshotString(value: string): Promise<LocalSnapshot>;
  clearAllData(): Promise<void>;
  loadDemoData(): Promise<void>;
  dismissNotice(): void;
  clearStorageError(): void;
};

const RecordsContext = createContext<RecordsContextValue | undefined>(undefined);

type RecordsProviderProps = PropsWithChildren<{
  repository?: RecordsRepository;
}>;

function normalizeEstimateDraft(draft: EstimateDraft): EstimateDraft {
  const lineItems = draft.lineItems
    .map((item, index) =>
      calculateLineItemTotal({
        ...item,
        name: item.name.trim(),
        description: item.description.trim(),
        unit: item.unit.trim() || 'ea',
        sortOrder: index,
      }),
    )
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return {
    ...draft,
    title: draft.title.trim(),
    lineItems,
    adjustments: draft.adjustments.map((adjustment) => ({
      ...adjustment,
      label: adjustment.label.trim(),
    })),
    notes: draft.notes.trim(),
    terms: draft.terms.trim(),
  };
}

function createDemoSnapshot(existingSnapshot: LocalSnapshot): LocalSnapshot {
  const now = new Date().toISOString();
  const suffix = Date.now().toString(36);
  const customerOneId = `demo_customer_${suffix}_1`;
  const customerTwoId = `demo_customer_${suffix}_2`;
  const jobOneId = `demo_job_${suffix}_1`;
  const jobTwoId = `demo_job_${suffix}_2`;
  const jobThreeId = `demo_job_${suffix}_3`;

  const customers: Customer[] = [
    {
      id: customerOneId,
      name: 'Ridgeview Homes',
      phone: '(555) 014-2811',
      email: 'office@ridgeview.example',
      address: '128 Market Street',
      notes: 'Prefers morning site visits.',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: customerTwoId,
      name: 'Cedar Lane Property Group',
      phone: '(555) 014-7732',
      email: 'manager@cedarlane.example',
      address: '44 Cedar Lane',
      notes: 'Rental turnover work.',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const jobs: Job[] = [
    {
      id: jobOneId,
      customerId: customerOneId,
      title: 'Kitchen remodel walkthrough',
      jobAddress: '128 Market Street',
      description: 'Measure cabinets, review flooring transition, and capture finish preferences.',
      status: 'Quote Ready',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: jobTwoId,
      customerId: customerTwoId,
      title: 'Unit 3 paint and trim',
      jobAddress: '44 Cedar Lane, Unit 3',
      description: 'Scope interior repaint, baseboard repairs, and door casing touch-ups.',
      status: 'Estimating',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: jobThreeId,
      customerId: customerOneId,
      title: 'Deck repair',
      jobAddress: '128 Market Street',
      description: 'Replace damaged boards and quote staining.',
      status: 'Site Visit',
      createdAt: now,
      updatedAt: now,
    },
  ];

  const laborTemplates: LaborTemplate[] = [
    createLaborTemplate({
      name: 'Lead carpenter',
      description: 'Skilled carpentry labor',
      defaultUnit: 'hr',
      defaultRateCents: 8500,
      defaultMarkupPercent: 20,
    }),
    createLaborTemplate({
      name: 'Painter',
      description: 'Interior paint labor',
      defaultUnit: 'hr',
      defaultRateCents: 5500,
      defaultMarkupPercent: 15,
    }),
  ];

  const materialTemplates: MaterialTemplate[] = [
    createMaterialTemplate({
      name: 'Primer and paint',
      description: 'Interior paint allowance',
      defaultUnit: 'gal',
      defaultCostCents: 5200,
      defaultMarkupPercent: 18,
    }),
    createMaterialTemplate({
      name: 'Deck boards',
      description: 'Pressure-treated deck boards',
      defaultUnit: 'ea',
      defaultCostCents: 1850,
      defaultMarkupPercent: 25,
    }),
  ];

  const lineItems: EstimateLineItem[] = [
    calculateLineItemTotal({
      id: `demo_li_${suffix}_1`,
      type: 'labor',
      name: 'Lead carpenter',
      description: 'Cabinet layout and install planning',
      quantity: 10,
      unit: 'hr',
      unitCostCents: 8500,
      markupPercent: 20,
      sortOrder: 0,
      taxable: true,
    }),
    calculateLineItemTotal({
      id: `demo_li_${suffix}_2`,
      type: 'material',
      name: 'Finish materials allowance',
      description: 'Trim, fasteners, and consumables',
      quantity: 1,
      unit: 'allowance',
      unitCostCents: 67500,
      markupPercent: 15,
      sortOrder: 1,
      taxable: true,
    }),
  ];

  const estimate = createEstimate({
    jobId: jobOneId,
    title: 'Kitchen remodel planning estimate',
    status: 'Ready',
    lineItems,
    markup: { type: 'percent', value: 10 },
    discount: { type: 'fixed', value: 5000 },
    taxPercent: 7.5,
    taxable: true,
    adjustments: [{ id: `demo_adj_${suffix}`, label: 'Site protection', amountCents: 12500 }],
    notes: 'Includes planning labor and an allowance for finish materials.',
    terms: defaultSettings.defaultTerms,
  });
  const quote = createQuoteFromEstimate({
    customer: customers[0],
    estimate,
    job: jobs[0],
    quoteNumber: `${defaultSettings.quotePrefix}-${defaultSettings.quoteStartingNumber}`,
    settings: defaultSettings,
    version: 1,
  });
  const readyQuote = { ...quote, status: 'Ready' as const, updatedAt: now };

  return {
    ...existingSnapshot,
    customers: [...customers, ...existingSnapshot.customers],
    jobs: [...jobs, ...existingSnapshot.jobs],
    estimates: [estimate, ...existingSnapshot.estimates],
    quotes: [readyQuote, ...existingSnapshot.quotes],
    laborTemplates: [...laborTemplates, ...existingSnapshot.laborTemplates],
    materialTemplates: [...materialTemplates, ...existingSnapshot.materialTemplates],
  };
}

export function RecordsProvider({ children, repository = asyncStorageRecordsRepository }: RecordsProviderProps) {
  const [snapshot, setSnapshot] = useState<LocalSnapshot>(() => createEmptySnapshot());
  const [isLoading, setIsLoading] = useState(true);
  const [storageError, setStorageError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadRecords() {
      try {
        const loadedSnapshot = await repository.loadSnapshot();

        if (isMounted) {
          setSnapshot(loadedSnapshot);
          setStorageError('');
        }
      } catch {
        if (isMounted) {
          setSnapshot(createEmptySnapshot());
          setStorageError('Saved records could not be loaded. You can continue with a fresh local workspace.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadRecords();

    return () => {
      isMounted = false;
    };
  }, [repository]);

  const commitSnapshot = useCallback(
    async (nextSnapshot: LocalSnapshot, successMessage: string) => {
      setSnapshot(nextSnapshot);

      try {
        await repository.saveSnapshot(nextSnapshot);
        setStorageError('');
        setNotice(successMessage);
      } catch {
        setStorageError('Records changed for this session, but QuoteForge could not save them on this device.');
      }
    },
    [repository],
  );

  const addCustomer = useCallback(
    async (draft: CustomerDraft) => {
      const customer = createCustomer(draft);
      await commitSnapshot({ ...snapshot, customers: [customer, ...snapshot.customers] }, `${customer.name} was saved.`);
      return customer;
    },
    [commitSnapshot, snapshot],
  );

  const updateCustomer = useCallback(
    async (id: string, draft: CustomerDraft) => {
      const existingCustomer = snapshot.customers.find((customer) => customer.id === id);

      if (!existingCustomer) throw new Error('Customer not found.');

      const customer = updateCustomerRecord(existingCustomer, draft);
      await commitSnapshot(
        {
          ...snapshot,
          customers: snapshot.customers.map((currentCustomer) =>
            currentCustomer.id === id ? customer : currentCustomer,
          ),
        },
        `${customer.name} was updated.`,
      );
      return customer;
    },
    [commitSnapshot, snapshot],
  );

  const deleteCustomer = useCallback(
    async (id: string) => {
      const hasJobs = snapshot.jobs.some((job) => job.customerId === id);
      const hasQuotes = snapshot.quotes.some((quote) => quote.customerSnapshot.id === id);

      if (hasJobs || hasQuotes) {
        throw new Error('Customer has linked jobs or quotes and cannot be deleted safely.');
      }

      await commitSnapshot(
        { ...snapshot, customers: snapshot.customers.filter((customer) => customer.id !== id) },
        'Customer was deleted.',
      );
    },
    [commitSnapshot, snapshot],
  );

  const addJob = useCallback(
    async (draft: JobDraft) => {
      const job = createJob(draft);
      await commitSnapshot({ ...snapshot, jobs: [job, ...snapshot.jobs] }, `${job.title} was added to the job queue.`);
      return job;
    },
    [commitSnapshot, snapshot],
  );

  const updateJob = useCallback(
    async (id: string, draft: JobDraft) => {
      const existingJob = snapshot.jobs.find((job) => job.id === id);

      if (!existingJob) throw new Error('Job not found.');

      const job = updateJobRecord(existingJob, draft);
      await commitSnapshot(
        { ...snapshot, jobs: snapshot.jobs.map((currentJob) => (currentJob.id === id ? job : currentJob)) },
        `${job.title} was updated.`,
      );
      return job;
    },
    [commitSnapshot, snapshot],
  );

  const updateJobStatus = useCallback(
    async (id: string, status: Job['status']) => {
      const existingJob = snapshot.jobs.find((job) => job.id === id);

      if (!existingJob) throw new Error('Job not found.');

      const job = { ...existingJob, status, updatedAt: new Date().toISOString() };
      await commitSnapshot(
        { ...snapshot, jobs: snapshot.jobs.map((currentJob) => (currentJob.id === id ? job : currentJob)) },
        `${job.title} moved to ${status}.`,
      );
      return job;
    },
    [commitSnapshot, snapshot],
  );

  const deleteJob = useCallback(
    async (id: string) => {
      const hasEstimates = snapshot.estimates.some((estimate) => estimate.jobId === id);
      const hasQuotes = snapshot.quotes.some((quote) => quote.jobId === id);

      if (hasEstimates || hasQuotes) {
        throw new Error('Job has estimates or quotes and cannot be deleted safely.');
      }

      await commitSnapshot({ ...snapshot, jobs: snapshot.jobs.filter((job) => job.id !== id) }, 'Job was deleted.');
    },
    [commitSnapshot, snapshot],
  );

  const saveEstimate = useCallback(
    async (id: string | undefined, draft: EstimateDraft) => {
      const normalizedDraft = normalizeEstimateDraft(draft);
      const estimate = id
        ? updateEstimateRecord(
            snapshot.estimates.find((currentEstimate) => currentEstimate.id === id) ?? createEstimate(normalizedDraft),
            normalizedDraft,
          )
        : createEstimate(normalizedDraft);
      const nextEstimates = id
        ? snapshot.estimates.map((currentEstimate) => (currentEstimate.id === id ? estimate : currentEstimate))
        : [estimate, ...snapshot.estimates];

      await commitSnapshot({ ...snapshot, estimates: nextEstimates }, `${estimate.title} was saved.`);
      return estimate;
    },
    [commitSnapshot, snapshot],
  );

  const duplicateEstimate = useCallback(
    async (id: string) => {
      const estimate = snapshot.estimates.find((currentEstimate) => currentEstimate.id === id);

      if (!estimate) throw new Error('Estimate not found.');

      const duplicate = duplicateEstimateRecord(estimate);
      await commitSnapshot({ ...snapshot, estimates: [duplicate, ...snapshot.estimates] }, `${duplicate.title} was created.`);
      return duplicate;
    },
    [commitSnapshot, snapshot],
  );

  const saveEstimateAndCreateQuote = useCallback(
    async (id: string | undefined, draft: EstimateDraft) => {
      const normalizedDraft = normalizeEstimateDraft(draft);
      const existingEstimate = id ? snapshot.estimates.find((currentEstimate) => currentEstimate.id === id) : undefined;
      const estimate = existingEstimate
        ? updateEstimateRecord(existingEstimate, normalizedDraft)
        : createEstimate(normalizedDraft);
      const job = snapshot.jobs.find((currentJob) => currentJob.id === estimate.jobId);
      if (!job) throw new Error('Job not found.');
      const customer = snapshot.customers.find((currentCustomer) => currentCustomer.id === job.customerId);
      if (!customer) throw new Error('Customer not found.');

      const quote = createQuoteFromEstimate({
        customer,
        estimate,
        job,
        quoteNumber: getNextQuoteNumber(snapshot.quotes, snapshot.settings),
        settings: snapshot.settings,
        version: 1,
      });
      const now = new Date().toISOString();
      const quotedEstimate = { ...estimate, status: 'Quoted' as const, updatedAt: now };
      const quotedJob = { ...job, status: 'Quote Ready' as const, updatedAt: now };
      const nextEstimates = existingEstimate
        ? snapshot.estimates.map((currentEstimate) =>
            currentEstimate.id === existingEstimate.id ? quotedEstimate : currentEstimate,
          )
        : [quotedEstimate, ...snapshot.estimates];

      await commitSnapshot(
        {
          ...snapshot,
          estimates: nextEstimates,
          jobs: snapshot.jobs.map((currentJob) => (currentJob.id === quotedJob.id ? quotedJob : currentJob)),
          quotes: [quote, ...snapshot.quotes],
        },
        `${quote.quoteNumber} v${quote.version} was created.`,
      );

      return { estimate: quotedEstimate, quote };
    },
    [commitSnapshot, snapshot],
  );

  const deleteEstimate = useCallback(
    async (id: string) => {
      const hasQuotes = snapshot.quotes.some((quote) => quote.estimateId === id);

      if (hasQuotes) {
        throw new Error('Estimate has quote versions and cannot be deleted safely.');
      }

      await commitSnapshot(
        { ...snapshot, estimates: snapshot.estimates.filter((estimate) => estimate.id !== id) },
        'Draft estimate was deleted.',
      );
    },
    [commitSnapshot, snapshot],
  );

  const createQuote = useCallback(
    async (estimateId: string) => {
      const estimate = snapshot.estimates.find((currentEstimate) => currentEstimate.id === estimateId);
      if (!estimate) throw new Error('Estimate not found.');
      const job = snapshot.jobs.find((currentJob) => currentJob.id === estimate.jobId);
      if (!job) throw new Error('Job not found.');
      const customer = snapshot.customers.find((currentCustomer) => currentCustomer.id === job.customerId);
      if (!customer) throw new Error('Customer not found.');

      const quote = createQuoteFromEstimate({
        customer,
        estimate,
        job,
        quoteNumber: getNextQuoteNumber(snapshot.quotes, snapshot.settings),
        settings: snapshot.settings,
        version: 1,
      });
      const nextEstimate = { ...estimate, status: 'Quoted' as const, updatedAt: new Date().toISOString() };
      const nextJob = { ...job, status: 'Quote Ready' as const, updatedAt: new Date().toISOString() };

      await commitSnapshot(
        {
          ...snapshot,
          estimates: snapshot.estimates.map((currentEstimate) =>
            currentEstimate.id === estimate.id ? nextEstimate : currentEstimate,
          ),
          jobs: snapshot.jobs.map((currentJob) => (currentJob.id === job.id ? nextJob : currentJob)),
          quotes: [quote, ...snapshot.quotes],
        },
        `${quote.quoteNumber} v${quote.version} was created.`,
      );
      return quote;
    },
    [commitSnapshot, snapshot],
  );

  const reviseQuote = useCallback(
    async (quoteId: string) => {
      const quote = snapshot.quotes.find((currentQuote) => currentQuote.id === quoteId);
      if (!quote) throw new Error('Quote not found.');
      const estimate = snapshot.estimates.find((currentEstimate) => currentEstimate.id === quote.estimateId);
      const job = snapshot.jobs.find((currentJob) => currentJob.id === quote.jobId);
      const customer = job ? snapshot.customers.find((currentCustomer) => currentCustomer.id === job.customerId) : undefined;
      const newQuote =
        estimate && job && customer
          ? createQuoteFromEstimate({
              customer,
              estimate,
              job,
              quoteNumber: quote.quoteNumber,
              settings: snapshot.settings,
              version: getNextQuoteVersion(snapshot.quotes, quote.quoteNumber),
            })
          : {
              ...quote,
              id: `quo_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
              version: getNextQuoteVersion(snapshot.quotes, quote.quoteNumber),
              status: 'Draft' as const,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              approvedAt: undefined,
              rejectedAt: undefined,
              sentAt: undefined,
            };

      await commitSnapshot(
        {
          ...snapshot,
          quotes: [
            newQuote,
            ...snapshot.quotes.map((currentQuote) =>
              currentQuote.id === quote.id ? setQuoteStatus(currentQuote, 'Superseded') : currentQuote,
            ),
          ],
        },
        `${newQuote.quoteNumber} v${newQuote.version} was created.`,
      );
      return newQuote;
    },
    [commitSnapshot, snapshot],
  );

  const updateQuoteStatus = useCallback(
    async (id: string, status: QuoteStatus) => {
      const existingQuote = snapshot.quotes.find((quote) => quote.id === id);
      if (!existingQuote) throw new Error('Quote not found.');
      const quote = setQuoteStatus(existingQuote, status);
      const nextJobs =
        status === 'Sent'
          ? snapshot.jobs.map((job) =>
              job.id === quote.jobId ? { ...job, status: 'Sent' as const, updatedAt: new Date().toISOString() } : job,
            )
          : snapshot.jobs;

      await commitSnapshot(
        {
          ...snapshot,
          jobs: nextJobs,
          quotes: snapshot.quotes.map((currentQuote) => (currentQuote.id === id ? quote : currentQuote)),
        },
        `${quote.quoteNumber} is now ${status}.`,
      );
      return quote;
    },
    [commitSnapshot, snapshot],
  );

  const approveQuote = useCallback(
    async (draft: ApprovalDraft) => {
      const quote = snapshot.quotes.find((currentQuote) => currentQuote.id === draft.quoteId);
      if (!quote) throw new Error('Quote not found.');
      if (!draft.acceptedTerms) throw new Error('Terms must be accepted.');
      const approval = createApproval(draft.quoteId, draft.signerName);
      const approvedQuote = setQuoteStatus(quote, 'Approved');
      const nextJobs = snapshot.jobs.map((job) =>
        job.id === quote.jobId ? { ...job, status: 'Won' as const, updatedAt: new Date().toISOString() } : job,
      );

      await commitSnapshot(
        {
          ...snapshot,
          jobs: nextJobs,
          approvals: [approval, ...snapshot.approvals.filter((item) => item.quoteId !== draft.quoteId)],
          quotes: snapshot.quotes.map((currentQuote) => (currentQuote.id === draft.quoteId ? approvedQuote : currentQuote)),
        },
        `${quote.quoteNumber} was approved.`,
      );
      return approval;
    },
    [commitSnapshot, snapshot],
  );

  const rejectQuote = useCallback(
    async (id: string) => {
      const quote = snapshot.quotes.find((currentQuote) => currentQuote.id === id);
      if (!quote) throw new Error('Quote not found.');
      const rejectedQuote = setQuoteStatus(quote, 'Rejected');

      await commitSnapshot(
        {
          ...snapshot,
          quotes: snapshot.quotes.map((currentQuote) => (currentQuote.id === id ? rejectedQuote : currentQuote)),
        },
        `${quote.quoteNumber} was rejected.`,
      );
      return rejectedQuote;
    },
    [commitSnapshot, snapshot],
  );

  const resetQuoteApproval = useCallback(
    async (id: string) => {
      const quote = snapshot.quotes.find((currentQuote) => currentQuote.id === id);
      if (!quote) throw new Error('Quote not found.');
      const resetQuote = { ...quote, status: 'Ready' as const, approvedAt: undefined, updatedAt: new Date().toISOString() };

      await commitSnapshot(
        {
          ...snapshot,
          approvals: snapshot.approvals.filter((approval) => approval.quoteId !== id),
          quotes: snapshot.quotes.map((currentQuote) => (currentQuote.id === id ? resetQuote : currentQuote)),
        },
        `${quote.quoteNumber} approval was reset.`,
      );
    },
    [commitSnapshot, snapshot],
  );

  const saveLaborTemplate = useCallback(
    async (id: string | undefined, draft: LaborTemplateDraft) => {
      const template = id
        ? updateLaborTemplateRecord(
            snapshot.laborTemplates.find((currentTemplate) => currentTemplate.id === id) ?? createLaborTemplate(draft),
            draft,
          )
        : createLaborTemplate(draft);
      const templates = id
        ? snapshot.laborTemplates.map((currentTemplate) => (currentTemplate.id === id ? template : currentTemplate))
        : [template, ...snapshot.laborTemplates];

      await commitSnapshot({ ...snapshot, laborTemplates: templates }, `${template.name} was saved.`);
      return template;
    },
    [commitSnapshot, snapshot],
  );

  const duplicateLaborTemplate = useCallback(
    async (id: string) => {
      const template = snapshot.laborTemplates.find((currentTemplate) => currentTemplate.id === id);
      if (!template) throw new Error('Template not found.');
      const duplicate = duplicateLaborTemplateRecord(template);
      await commitSnapshot({ ...snapshot, laborTemplates: [duplicate, ...snapshot.laborTemplates] }, `${duplicate.name} was created.`);
      return duplicate;
    },
    [commitSnapshot, snapshot],
  );

  const deleteLaborTemplate = useCallback(
    async (id: string) => {
      await commitSnapshot(
        { ...snapshot, laborTemplates: snapshot.laborTemplates.filter((template) => template.id !== id) },
        'Labor template was deleted.',
      );
    },
    [commitSnapshot, snapshot],
  );

  const saveMaterialTemplate = useCallback(
    async (id: string | undefined, draft: MaterialTemplateDraft) => {
      const template = id
        ? updateMaterialTemplateRecord(
            snapshot.materialTemplates.find((currentTemplate) => currentTemplate.id === id) ??
              createMaterialTemplate(draft),
            draft,
          )
        : createMaterialTemplate(draft);
      const templates = id
        ? snapshot.materialTemplates.map((currentTemplate) => (currentTemplate.id === id ? template : currentTemplate))
        : [template, ...snapshot.materialTemplates];

      await commitSnapshot({ ...snapshot, materialTemplates: templates }, `${template.name} was saved.`);
      return template;
    },
    [commitSnapshot, snapshot],
  );

  const duplicateMaterialTemplate = useCallback(
    async (id: string) => {
      const template = snapshot.materialTemplates.find((currentTemplate) => currentTemplate.id === id);
      if (!template) throw new Error('Template not found.');
      const duplicate = duplicateMaterialTemplateRecord(template);
      await commitSnapshot(
        { ...snapshot, materialTemplates: [duplicate, ...snapshot.materialTemplates] },
        `${duplicate.name} was created.`,
      );
      return duplicate;
    },
    [commitSnapshot, snapshot],
  );

  const deleteMaterialTemplate = useCallback(
    async (id: string) => {
      await commitSnapshot(
        { ...snapshot, materialTemplates: snapshot.materialTemplates.filter((template) => template.id !== id) },
        'Material template was deleted.',
      );
    },
    [commitSnapshot, snapshot],
  );

  const updateSettings = useCallback(
    async (draft: AppSettings) => {
      await commitSnapshot({ ...snapshot, settings: { ...draft } }, 'Settings were saved.');
    },
    [commitSnapshot, snapshot],
  );

  const importSnapshotString = useCallback(
    async (value: string) => {
      const importedSnapshot = validateImportedSnapshot(JSON.parse(value));
      await commitSnapshot(importedSnapshot, 'Imported QuoteForge backup.');
      return importedSnapshot;
    },
    [commitSnapshot],
  );

  const clearAllData = useCallback(async () => {
    const emptySnapshot = createEmptySnapshot();
    setSnapshot(emptySnapshot);
    await repository.clearSnapshot();
    setNotice('Local QuoteForge data was cleared.');
  }, [repository]);

  const loadDemoData = useCallback(async () => {
    await commitSnapshot(createDemoSnapshot(snapshot), 'Demo records were added.');
  }, [commitSnapshot, snapshot]);

  const value = useMemo<RecordsContextValue>(() => {
    const activeJobs = snapshot.jobs.filter((job) => !['Won', 'Lost', 'Archived'].includes(job.status));
    const recentJobs = sortByUpdatedAt(snapshot.jobs).slice(0, 5);
    const recentQuotes = sortByUpdatedAt(snapshot.quotes).slice(0, 5);
    const customerNameById = snapshot.customers.reduce<Record<string, string>>((names, customer) => {
      names[customer.id] = customer.name;
      return names;
    }, {});
    const jobCountByCustomerId = snapshot.jobs.reduce<Record<string, number>>((counts, job) => {
      counts[job.customerId] = (counts[job.customerId] ?? 0) + 1;
      return counts;
    }, {});

    return {
      activeJobs,
      approvals: snapshot.approvals,
      customerNameById,
      customers: snapshot.customers,
      estimates: snapshot.estimates,
      isLoading,
      jobCountByCustomerId,
      jobs: snapshot.jobs,
      laborTemplates: snapshot.laborTemplates,
      materialTemplates: snapshot.materialTemplates,
      notice,
      quotes: snapshot.quotes,
      recentJobs,
      recentQuotes,
      settings: snapshot.settings,
      storageError,
      addCustomer,
      updateCustomer,
      deleteCustomer,
      addJob,
      updateJob,
      updateJobStatus,
      deleteJob,
      saveEstimate,
      saveEstimateAndCreateQuote,
      duplicateEstimate,
      deleteEstimate,
      createQuote,
      reviseQuote,
      updateQuoteStatus,
      approveQuote,
      rejectQuote,
      resetQuoteApproval,
      saveLaborTemplate,
      duplicateLaborTemplate,
      deleteLaborTemplate,
      saveMaterialTemplate,
      duplicateMaterialTemplate,
      deleteMaterialTemplate,
      updateSettings,
      exportSnapshotString: () => JSON.stringify(snapshot, null, 2),
      importSnapshotString,
      clearAllData,
      loadDemoData,
      dismissNotice: () => setNotice(''),
      clearStorageError: () => setStorageError(''),
    };
  }, [
    addCustomer,
    addJob,
    approveQuote,
    clearAllData,
    createQuote,
    deleteCustomer,
    deleteEstimate,
    deleteJob,
    deleteLaborTemplate,
    deleteMaterialTemplate,
    duplicateEstimate,
    duplicateLaborTemplate,
    duplicateMaterialTemplate,
    importSnapshotString,
    isLoading,
    loadDemoData,
    notice,
    rejectQuote,
    resetQuoteApproval,
    reviseQuote,
    saveEstimate,
    saveEstimateAndCreateQuote,
    saveLaborTemplate,
    saveMaterialTemplate,
    snapshot,
    storageError,
    updateCustomer,
    updateJob,
    updateJobStatus,
    updateQuoteStatus,
    updateSettings,
  ]);

  return <RecordsContext.Provider value={value}>{children}</RecordsContext.Provider>;
}

export function useRecords() {
  const context = useContext(RecordsContext);

  if (!context) {
    throw new Error('useRecords must be used inside RecordsProvider.');
  }

  return context;
}
