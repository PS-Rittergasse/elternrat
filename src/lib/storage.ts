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
        apiUrl: 'https://script.google.com/macros/s/AKfycbzeyNTd8C1rmas-Nk5sF--Aa2Ck6ugw-wd6ts2slxpaVV8M9JzmKZW7GzipXYRsDbEf/exec',
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
    return applyDefaults(parsed);
  } catch {
    return defaultState();
  }
}

function applyDefaults(state: PersistedState): PersistedState {
  const defaults = defaultState();
  const schulhelferDefaults = defaults.settings.schulhelfer;
  const schulhelferState = state.settings?.schulhelfer ?? ({} as PersistedState['settings']['schulhelfer']);
  const apiUrl = (schulhelferState.apiUrl || '').trim();

  return {
    ...defaults,
    ...state,
    settings: {
      ...defaults.settings,
      ...state.settings,
      schulhelfer: {
        ...schulhelferDefaults,
        ...schulhelferState,
        apiUrl: apiUrl ? schulhelferState.apiUrl : schulhelferDefaults.apiUrl
      },
      backend: {
        ...defaults.settings.backend,
        ...state.settings?.backend
      }
    },
    entities: {
      ...defaults.entities,
      ...state.entities
    }
  };
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
