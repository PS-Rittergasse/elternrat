import type { SchulhelferSettings } from '../types';

export type SchulhelferEvent = {
  id: string;
  title: string;
  start: string; // ISO
  end: string; // ISO
  location?: string;
  description?: string;
};

type ApiResponse<T> = { ok: true; data: T } | { ok: false; error: string };

function buildUrl(base: string, action: string, apiKey?: string) {
  const u = new URL(base);
  u.searchParams.set('action', action);
  if (apiKey) u.searchParams.set('apiKey', apiKey);
  return u.toString();
}

export async function schulhelferGetEvents(settings: SchulhelferSettings): Promise<SchulhelferEvent[]> {
  if (!settings.enabled) throw new Error('Schulhelfer ist deaktiviert');
  if (!settings.apiUrl) throw new Error('Schulhelfer-URL fehlt');

  const url = buildUrl(settings.apiUrl, 'getEvents', settings.apiKey || undefined);
  const res = await fetch(url, { method: 'GET', redirect: 'follow' });
  const txt = await res.text();
  let json: any;
  try {
    json = JSON.parse(txt);
  } catch {
    throw new Error('Ungültige Antwort (kein JSON)');
  }

  // akzeptiere entweder { ok, data } oder direkt ein Array
  if (Array.isArray(json)) return json as SchulhelferEvent[];
  const r = json as ApiResponse<SchulhelferEvent[]>;
  if ('ok' in r && r.ok) return r.data;
  if ('ok' in r && !r.ok) throw new Error(r.error || 'Schulhelfer Fehler');
  throw new Error('Unbekanntes Format');
}

export async function schulhelferWrite(settings: SchulhelferSettings, action: 'createEvent' | 'updateEvent' | 'deleteEvent', payload: any) {
  if (!settings.enabled) throw new Error('Schulhelfer ist deaktiviert');
  if (!settings.apiUrl) throw new Error('Schulhelfer-URL fehlt');

  const res = await fetch(settings.apiUrl, {
    method: 'POST',
    redirect: 'follow',
    body: JSON.stringify({ action, apiKey: settings.apiKey || '', ...payload })
  });
  const txt = await res.text();
  try {
    return JSON.parse(txt);
  } catch {
    return txt;
  }
}
