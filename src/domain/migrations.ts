import {
  Customer,
  Job,
  jobStatuses,
  LocalSnapshot,
  SNAPSHOT_VERSION,
} from './types';
import { createEmptySnapshot, defaultSettings } from './records';

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

function sanitizeCustomer(value: unknown): Customer | undefined {
  const customer = value as Partial<Customer>;

  if (!customer || !isString(customer.id) || !isString(customer.name)) {
    return undefined;
  }

  const now = new Date().toISOString();

  return {
    id: customer.id,
    name: customer.name,
    phone: isString(customer.phone) ? customer.phone : '',
    email: isString(customer.email) ? customer.email : '',
    address: isString(customer.address) ? customer.address : '',
    notes: isString(customer.notes) ? customer.notes : '',
    createdAt: isString(customer.createdAt) ? customer.createdAt : now,
    updatedAt: isString(customer.updatedAt) ? customer.updatedAt : isString(customer.createdAt) ? customer.createdAt : now,
  };
}

function sanitizeJob(value: unknown): Job | undefined {
  const job = value as Partial<Job>;

  if (!job || !isString(job.id) || !isString(job.customerId) || !isString(job.title)) {
    return undefined;
  }

  const now = new Date().toISOString();
  const status = job.status && jobStatuses.includes(job.status) ? job.status : 'New';

  return {
    id: job.id,
    customerId: job.customerId,
    title: job.title,
    jobAddress: isString(job.jobAddress) ? job.jobAddress : '',
    description: isString(job.description) ? job.description : '',
    status,
    createdAt: isString(job.createdAt) ? job.createdAt : now,
    updatedAt: isString(job.updatedAt) ? job.updatedAt : isString(job.createdAt) ? job.createdAt : now,
  };
}

export function migrateSnapshot(value: unknown): LocalSnapshot {
  const snapshot = value as {
    approvals?: unknown;
    customers?: unknown;
    estimates?: unknown;
    jobs?: unknown;
    laborTemplates?: unknown;
    materialTemplates?: unknown;
    quotes?: unknown;
    settings?: Record<string, unknown>;
    version?: unknown;
  };

  if (!snapshot || typeof snapshot !== 'object') {
    throw new Error('Saved QuoteForge records are not readable.');
  }

  const version = isNumber(snapshot.version) ? snapshot.version : undefined;

  if (version === 1) {
    return {
      ...createEmptySnapshot(),
      customers: Array.isArray(snapshot.customers) ? snapshot.customers.map(sanitizeCustomer).filter(isDefined) : [],
      jobs: Array.isArray(snapshot.jobs) ? snapshot.jobs.map(sanitizeJob).filter(isDefined) : [],
    } as LocalSnapshot;
  }

  if (version !== SNAPSHOT_VERSION) {
    throw new Error('Unsupported local QuoteForge snapshot version.');
  }

  return {
    version: SNAPSHOT_VERSION,
    customers: Array.isArray(snapshot.customers) ? snapshot.customers.map(sanitizeCustomer).filter(isDefined) : [],
    jobs: Array.isArray(snapshot.jobs) ? snapshot.jobs.map(sanitizeJob).filter(isDefined) : [],
    estimates: Array.isArray(snapshot.estimates) ? snapshot.estimates : [],
    quotes: Array.isArray(snapshot.quotes) ? snapshot.quotes : [],
    laborTemplates: Array.isArray(snapshot.laborTemplates) ? snapshot.laborTemplates : [],
    materialTemplates: Array.isArray(snapshot.materialTemplates) ? snapshot.materialTemplates : [],
    approvals: Array.isArray(snapshot.approvals) ? snapshot.approvals : [],
    settings: {
      ...defaultSettings,
      ...(snapshot.settings && typeof snapshot.settings === 'object' ? snapshot.settings : {}),
      defaultTaxPercent: isNumber(snapshot.settings?.defaultTaxPercent)
        ? snapshot.settings.defaultTaxPercent
        : defaultSettings.defaultTaxPercent,
      defaultMarkupPercent: isNumber(snapshot.settings?.defaultMarkupPercent)
        ? snapshot.settings.defaultMarkupPercent
        : defaultSettings.defaultMarkupPercent,
      quoteStartingNumber: isNumber(snapshot.settings?.quoteStartingNumber)
        ? snapshot.settings.quoteStartingNumber
        : defaultSettings.quoteStartingNumber,
    },
  } satisfies LocalSnapshot;
}

export function validateImportedSnapshot(value: unknown): LocalSnapshot {
  const snapshot = migrateSnapshot(value);

  if (!Array.isArray(snapshot.customers) || !Array.isArray(snapshot.jobs)) {
    throw new Error('Imported file is not a QuoteForge backup.');
  }

  return snapshot;
}
