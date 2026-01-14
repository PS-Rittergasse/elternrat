import { useMemo, useState } from 'react';
import Card from '../components/Card';
import Select from '../components/Select';
import Badge from '../components/Badge';
import { fmtDateShort } from '../lib/date';
import { useAppStore } from '../state/store';

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export default function ArchivPage() {
  const { state } = useAppStore();
  const years = useMemo(() => {
    const y = [
      ...state.entities.meetings.map((m) => m.schuljahr),
      ...state.entities.events.map((e) => e.schuljahr),
      ...state.entities.documents.map((d) => d.schuljahr)
    ];
    const list = uniq(y).sort().reverse();
    return list.length ? list : [state.settings.activeSchoolYear];
  }, [state.entities.documents, state.entities.events, state.entities.meetings, state.settings.activeSchoolYear]);

  const [year, setYear] = useState<string>(state.settings.activeSchoolYear);

  const meetings = state.entities.meetings
    .filter((m) => m.schuljahr === year)
    .slice()
    .sort((a, b) => (a.datum < b.datum ? 1 : -1));

  const events = state.entities.events
    .filter((e) => e.schuljahr === year)
    .slice()
    .sort((a, b) => (a.start < b.start ? 1 : -1));

  const docs = state.entities.documents
    .filter((d) => d.schuljahr === year)
    .slice()
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));

  return (
    <div className="space-y-4">
      <Card title="Archiv" actions={<div className="w-44"><Select value={year} onChange={(e) => setYear(e.target.value)}>{years.map((y) => (<option key={y} value={y}>{y}</option>))}</Select></div>}>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-xs text-primary-600">Sitzungen</div>
            <div className="text-2xl font-semibold">{meetings.length}</div>
          </div>
          <div>
            <div className="text-xs text-primary-600">Events</div>
            <div className="text-2xl font-semibold">{events.length}</div>
          </div>
          <div>
            <div className="text-xs text-primary-600">Dokumente</div>
            <div className="text-2xl font-semibold">{docs.length}</div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Sitzungen">
          {meetings.length ? (
            <div className="space-y-2">
              {meetings.slice(0, 12).map((m) => (
                <div key={m.id} className="flex items-center justify-between gap-2">
                  <div className="text-sm">{fmtDateShort(m.datum)}</div>
                  <Badge>{m.status}</Badge>
                </div>
              ))}
              {meetings.length > 12 ? <div className="text-xs text-primary-600">+{meetings.length - 12}</div> : null}
            </div>
          ) : (
            <div className="text-sm text-primary-600">Keine Sitzungen.</div>
          )}
        </Card>

        <Card title="Events">
          {events.length ? (
            <div className="space-y-2">
              {events.slice(0, 12).map((e) => (
                <div key={e.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0 truncate text-sm">{e.titel}</div>
                  <div className="text-xs text-primary-600">{fmtDateShort(e.start)}</div>
                </div>
              ))}
              {events.length > 12 ? <div className="text-xs text-primary-600">+{events.length - 12}</div> : null}
            </div>
          ) : (
            <div className="text-sm text-primary-600">Keine Events.</div>
          )}
        </Card>

        <Card title="Dokumente">
          {docs.length ? (
            <div className="space-y-2">
              {docs.slice(0, 12).map((d) => (
                <div key={d.id} className="flex items-center justify-between gap-2">
                  <div className="min-w-0 truncate text-sm">{d.titel}</div>
                  <Badge>{d.kategorie}</Badge>
                </div>
              ))}
              {docs.length > 12 ? <div className="text-xs text-primary-600">+{docs.length - 12}</div> : null}
            </div>
          ) : (
            <div className="text-sm text-primary-600">Keine Dokumente.</div>
          )}
        </Card>
      </div>
    </div>
  );
}
