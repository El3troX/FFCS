// ─── Storage Layer ───
// IndexedDB persistence using the `idb` library

import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';
import type { SavedTimetable, AppSettings } from '../types';

// ─── Database Schema ───

interface TimetableGenDB extends DBSchema {
  'saved-timetables': {
    key: string;
    value: SavedTimetable;
    indexes: {
      'by-number': number;
      'by-savedAt': number;
    };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

const DB_NAME = 'timetablegen-db';
const DB_VERSION = 1;

const DEFAULT_SETTINGS: AppSettings = {
  darkMode: false,
  savedCounter: 0,
};

// ─── DB Connection ───

let dbPromise: Promise<IDBPDatabase<TimetableGenDB>> | null = null;

function getDB(): Promise<IDBPDatabase<TimetableGenDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TimetableGenDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // Create saved-timetables store
        if (!db.objectStoreNames.contains('saved-timetables')) {
          const ttStore = db.createObjectStore('saved-timetables', { keyPath: 'id' });
          ttStore.createIndex('by-number', 'number');
          ttStore.createIndex('by-savedAt', 'savedAt');
        }

        // Create settings store
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings');
        }
      },
    });
  }
  return dbPromise;
}

// ─── Saved Timetables ───

/**
 * Save (or update) a timetable.
 */
export async function saveTimetable(saved: SavedTimetable): Promise<void> {
  const db = await getDB();
  await db.put('saved-timetables', saved);
}

/**
 * Get all saved timetables, sorted by number ascending.
 */
export async function getSavedTimetables(): Promise<SavedTimetable[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('saved-timetables', 'by-number');
  return all;
}

/**
 * Delete a saved timetable by ID.
 */
export async function deleteTimetable(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('saved-timetables', id);
}

// ─── Settings ───

const SETTINGS_KEY = 'app-settings';

/**
 * Get the current app settings.
 * Returns defaults if no settings have been saved yet.
 */
export async function getSettings(): Promise<AppSettings> {
  const db = await getDB();
  const settings = await db.get('settings', SETTINGS_KEY);
  return settings ?? { ...DEFAULT_SETTINGS };
}

/**
 * Update app settings (partial merge).
 */
export async function updateSettings(partial: Partial<AppSettings>): Promise<void> {
  const db = await getDB();
  const existing = await db.get('settings', SETTINGS_KEY);
  const merged: AppSettings = {
    ...DEFAULT_SETTINGS,
    ...existing,
    ...partial,
  };
  await db.put('settings', merged, SETTINGS_KEY);
}

// ─── Helpers ───

/**
 * Get the next saved timetable number (for zero-padded naming).
 * Reads the savedCounter from settings, increments it, and saves back.
 */
export async function getNextSavedNumber(): Promise<number> {
  const settings = await getSettings();
  const next = settings.savedCounter + 1;
  await updateSettings({ savedCounter: next });
  return next;
}
