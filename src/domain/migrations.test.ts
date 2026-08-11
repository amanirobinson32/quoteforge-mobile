import assert from 'node:assert/strict';
import test from 'node:test';

import { migrateSnapshot, validateImportedSnapshot } from './migrations';
import { SNAPSHOT_VERSION } from './types';

test('migrates Task 1 snapshot data into the current local snapshot shape', () => {
  const migrated = migrateSnapshot({
    version: 1,
    customers: [
      {
        id: 'cus_1',
        name: 'Ridgeview Homes',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: 'bad_customer',
      },
    ],
    jobs: [
      {
        id: 'job_1',
        customerId: 'cus_1',
        title: 'Kitchen remodel',
        status: 'Not a real status',
      },
    ],
  });

  assert.equal(migrated.version, SNAPSHOT_VERSION);
  assert.equal(migrated.customers.length, 1);
  assert.equal(migrated.customers[0].name, 'Ridgeview Homes');
  assert.equal(migrated.customers[0].phone, '');
  assert.equal(migrated.jobs.length, 1);
  assert.equal(migrated.jobs[0].status, 'New');
  assert.deepEqual(migrated.estimates, []);
  assert.deepEqual(migrated.quotes, []);
  assert.equal(migrated.settings.quotePrefix, 'QF');
});

test('validates current snapshot imports and fills missing settings defaults', () => {
  const imported = validateImportedSnapshot({
    version: SNAPSHOT_VERSION,
    customers: [],
    jobs: [],
    settings: {
      businessName: 'Field Crew LLC',
      quoteStartingNumber: 2500,
    },
  });

  assert.equal(imported.settings.businessName, 'Field Crew LLC');
  assert.equal(imported.settings.quoteStartingNumber, 2500);
  assert.equal(imported.settings.defaultMarkupPercent, 15);
  assert.deepEqual(imported.materialTemplates, []);
});

test('rejects unsupported local snapshot versions', () => {
  assert.throws(() => migrateSnapshot({ version: 999 }), /Unsupported local QuoteForge snapshot version/);
});
