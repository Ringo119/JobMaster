import { db } from '../../db';
import { defaultSettings, SETTINGS_ID, type Settings } from '../../models/settings';
import type { SettingsRepository } from '../types';

export class DexieSettingsRepository implements SettingsRepository {
  async get(): Promise<Settings> {
    const existing = await db.settings.get(SETTINGS_ID);
    if (existing) return existing;
    await db.settings.put(defaultSettings);
    return defaultSettings;
  }

  async update(patch: Partial<Settings>): Promise<Settings> {
    const current = await this.get();
    const next: Settings = { ...current, ...patch, id: SETTINGS_ID };
    await db.settings.put(next);
    return next;
  }

  /** Atomically read and increment the next job number. */
  async nextJobNumber(): Promise<number> {
    return db.transaction('rw', db.settings, async () => {
      const current = await this.get();
      const number = current.nextJobNumber;
      await db.settings.update(SETTINGS_ID, { nextJobNumber: number + 1 });
      return number;
    });
  }
}
