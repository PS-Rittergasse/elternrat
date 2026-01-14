import type { PersistedState } from './types';
import { currentSchuljahr } from './schuljahr';

const STORAGE_KEY = 'elternrat:v1';

export function defaultState(): PersistedState {
  const schuljahr = currentSchuljahr();
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    settings: {
      schoolName: 'Primarstufe Rittergasse',
      activeSchoolYear: schuljahr,
      readOnly: false,
      timezone: 'Europe/Zurich',
      schulhelfer: {
        enabled: false,
        apiUrl: '',
        apiKey: ''
      },
      backend: {
        enabled: false,
        apiUrl: '',
        apiKey: '',
        driveRootFolderId: '',
        autoShareLink: false,
        maxUploadMB: 8
      }
    },
    entities: {
      members: [],
      meetings: [],
      proposals: [],
      events: [],
      documents: [],
      emailTemplates: [
        {
          id: 'tpl_einladung_sitzung',
          name: 'Einladung Sitzung',
          betreff: 'Einladung Elternrat – {{datum}}',
          body:
            'Hallo\n\nHiermit lade ich zur Elternrat-Sitzung ein.\n\nDatum: {{datum}}\nZeit: {{zeit}}\nOrt: {{ort}}\n\nTraktanden:\n{{traktanden}}\n\nFreundliche Grüsse\nElternrat',
          createdAt: now,
          updatedAt: now
        }
      ],
      announcements: []
    }
  };
}

export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState();
    const parsed = JSON.parse(raw) as PersistedState;
    if (!parsed || parsed.schemaVersion !== 1) {
      return defaultState();
    }
    return parsed;
  } catch {
    return defaultState();
  }
}

export function saveState(state: PersistedState) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function exportState(state: PersistedState): string {
  return JSON.stringify(state, null, 2);
}

export function importState(raw: string): PersistedState {
  const parsed = JSON.parse(raw) as PersistedState;
  if (!parsed || parsed.schemaVersion !== 1) {
    throw new Error('Ungültiges Format oder Schema-Version');
  }
  return parsed;
}

export function storageKey(): string {
  return STORAGE_KEY;
}
