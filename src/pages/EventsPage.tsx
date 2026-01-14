import { useMemo, useState } from 'react';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Select from '../components/Select';
import Textarea from '../components/Textarea';
import { fmtDateShort } from '../lib/date';
import { uid } from '../lib/id';
import type { EventItem, EventSource } from '../lib/types';
import { useAppStore } from '../state/store';
import { schulhelferGetEvents } from '../lib/api/schulhelferClient';

function toLocalDatetime(iso: string): string {
  try {
    const d = new Date(iso);
    // yyyy-MM-ddTHH:mm (local)
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
  } catch {
    return '';
  }
}

export default function EventsPage() {
  const { state, actions } = useAppStore();
  const year = state.settings.activeSchoolYear;

  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);

  const events = useMemo(() => {
    return state.entities.events
      .filter((e) => e.schuljahr === year)
      .slice()
      .sort((a, b) => (a.start > b.start ? 1 : -1));
  }, [state.entities.events, year]);

  const [draft, setDraft] = useState<EventItem>(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0);
    const t = new Date().toISOString();
    return {
      id: uid(),
      schuljahr: year,
      titel: '',
      beschreibung: '',
      start: start.toISOString(),
      ende: end.toISOString(),
      ort: '',
      quelle: 'lokal',
      createdAt: t,
      updatedAt: t
    };
  });

  const onSave = () => {
    setStatusMsg(null);
    if (!draft.titel.trim()) {
      setStatusMsg('Titel fehlt');
      return;
    }
    actions.upsertEvent({ ...draft, schuljahr: year });
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 20, 0, 0);
    const t = new Date().toISOString();
    setDraft({
      id: uid(),
      schuljahr: year,
      titel: '',
      beschreibung: '',
      start: start.toISOString(),
      ende: end.toISOString(),
      ort: '',
      quelle: 'lokal',
      createdAt: t,
      updatedAt: t
    });
    setStatusMsg('Gespeichert');
  };

  const onDelete = (id: string) => actions.deleteEvent(id);

  const onSync = async () => {
    setSyncMsg(null);
    try {
      const remote = await schulhelferGetEvents(state.settings.schulhelfer);
      // Map remote events into internal events with quelle=schulhelfer.
      const mapped: EventItem[] = remote.map((r) => {
        const existing = state.entities.events.find((e) => e.externalId === r.id && e.quelle === 'schulhelfer');
        const baseId = existing?.id ?? uid();
        const t = new Date().toISOString();
        return {
          id: baseId,
          schuljahr: year,
          titel: r.title,
          beschreibung: r.description ?? '',
          start: r.start,
          ende: r.end,
          ort: r.location ?? '',
          quelle: 'schulhelfer',
          externalId: r.id,
          createdAt: existing?.createdAt ?? t,
          updatedAt: t
        };
      });

      // Replace all existing schulhelfer events for the active year
      const existingRemote = state.entities.events.filter(
        (e) => e.schuljahr === year && e.quelle === 'schulhelfer'
      );
      for (const e of existingRemote) actions.deleteEvent(e.id);
      for (const e of mapped) actions.upsertEvent(e);
      setSyncMsg(`Sync ok: ${mapped.length} Events übernommen`);
    } catch (e: any) {
      setSyncMsg(e?.message ?? 'Sync fehlgeschlagen');
    }
  };

  return (
    <div className="space-y-4">
      <Card title="Neuer Event" actions={<Button size="sm" onClick={onSave}>Speichern</Button>}>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-primary-700">Titel</label>
            <Input value={draft.titel} onChange={(e) => setDraft((p) => ({ ...p, titel: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-primary-700">Quelle</label>
            <Select
              value={draft.quelle}
              onChange={(e) => setDraft((p) => ({ ...p, quelle: e.target.value as EventSource }))}
            >
              <option value="lokal">lokal</option>
              <option value="schulhelfer">schulhelfer</option>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-primary-700">Start</label>
            <Input
              type="datetime-local"
              value={toLocalDatetime(draft.start)}
              onChange={(e) => setDraft((p) => ({ ...p, start: new Date(e.target.value).toISOString() }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-primary-700">Ende</label>
            <Input
              type="datetime-local"
              value={toLocalDatetime(draft.ende)}
              onChange={(e) => setDraft((p) => ({ ...p, ende: new Date(e.target.value).toISOString() }))}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-primary-700">Ort</label>
            <Input value={draft.ort ?? ''} onChange={(e) => setDraft((p) => ({ ...p, ort: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-primary-700">Beschreibung</label>
            <Textarea value={draft.beschreibung ?? ''} onChange={(e) => setDraft((p) => ({ ...p, beschreibung: e.target.value }))} />
          </div>
        </div>
        {statusMsg ? <div className="mt-2 text-xs text-primary-600">{statusMsg}</div> : null}
      </Card>

      <Card
        title={`Events · ${year}`}
        actions={
          state.settings.schulhelfer.enabled ? (
            <Button size="sm" variant="secondary" onClick={onSync}>
              Schulhelfer sync
            </Button>
          ) : (
            <Badge variant="warning">Schulhelfer deaktiviert</Badge>
          )
        }
      >
        {syncMsg ? <div className="mb-3 text-xs text-primary-600">{syncMsg}</div> : null}
        {events.length ? (
          <div className="divide-y divide-primary-200">
            {events.map((e) => (
              <div key={e.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-medium">{e.titel}</div>
                    <Badge>{e.quelle}</Badge>
                    {e.quelle === 'schulhelfer' ? <Badge variant="neutral">extern</Badge> : null}
                  </div>
                  <div className="mt-0.5 text-xs text-primary-600">
                    {fmtDateShort(e.start)} · {e.ort || '—'}
                  </div>
                  {e.beschreibung ? <div className="mt-1 text-sm text-primary-700">{e.beschreibung}</div> : null}
                </div>
                <Button size="sm" variant="destructive" onClick={() => onDelete(e.id)}>
                  Löschen
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-primary-600">Noch keine Events.</div>
        )}
      </Card>

      <Card title="Hinweis">
        <div className="text-sm text-primary-700">
          Schulhelfer-Sync erwartet ein JSON-Array mit Feldern: <span className="font-mono">id, title, start, end</span>.
          Falls das Backend anders liefert, Mapping in <span className="font-mono">src/lib/api/schulhelferClient.ts</span> anpassen.
        </div>
      </Card>
    </div>
  );
}
