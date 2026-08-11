import { LocalSnapshot } from '@/src/domain/types';

export interface RecordsRepository {
  clearSnapshot(): Promise<void>;
  loadSnapshot(): Promise<LocalSnapshot>;
  saveSnapshot(snapshot: LocalSnapshot): Promise<void>;
}
