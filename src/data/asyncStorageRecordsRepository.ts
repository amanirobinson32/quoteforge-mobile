import AsyncStorage from '@react-native-async-storage/async-storage';

import { createEmptySnapshot } from '@/src/domain/records';
import { migrateSnapshot } from '@/src/domain/migrations';
import { LocalSnapshot } from '@/src/domain/types';

import { RecordsRepository } from './recordsRepository';

const STORAGE_KEY = 'quoteforge:task1:snapshot';

export class AsyncStorageRecordsRepository implements RecordsRepository {
  async clearSnapshot(): Promise<void> {
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  async loadSnapshot(): Promise<LocalSnapshot> {
    const savedSnapshot = await AsyncStorage.getItem(STORAGE_KEY);

    if (!savedSnapshot) {
      return createEmptySnapshot();
    }

    return migrateSnapshot(JSON.parse(savedSnapshot));
  }

  async saveSnapshot(snapshot: LocalSnapshot): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }
}

export const asyncStorageRecordsRepository = new AsyncStorageRecordsRepository();
