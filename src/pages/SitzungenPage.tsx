import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Card from '../components/Card';
import Badge from '../components/Badge';
import { fmtDateShort } from '../lib/date';
import { uid } from '../lib/id';
import { useAppStore } from '../state/store';
import type { Meeting } from '../lib/types';

export default function SitzungenPage() {
  const { state, actions } = useAppStore();
  const nav = useNavigate();
  const year = state.settings.activeSchoolYear;

  const meetings = state.entities.meetings
    .filter((m) => m.schuljahr === year)
    .sort((a, b) => (a.datum < b.datum ? 1 : -1));

  const onNew = () => {
    const id = uid();
    const now = new Date().toISOString();
    const today = new Date().toISOString().slice(0, 10);
    const meeting: Meeting = {
      id,
      schuljahr: year,
      datum: today,
      start: '19:30',
      ende: '21:00',
      ort: '',
      teilnehmendeIds: [],
      traktanden: [],
      beschluesse: [],
      pendenzen: [],
      protokoll: '',
      status: 'Entwurf',
      createdAt: now,
      updatedAt: now
    };
    actions.upsertMeeting(meeting);
    nav(`/sitzungen/${id}`);
  };

  return (
    <div className="space-y-4">
      <Card
        title={`Sitzungen · ${year}`}
        actions={
          <Button size="sm" onClick={onNew}>
            Neue Sitzung
          </Button>
        }
      >
        {meetings.length ? (
          <div className="divide-y divide-primary-200">
            {meetings.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-medium">{fmtDateShort(m.datum)}</div>
                    <Badge variant={m.status === 'Final' ? 'success' : 'neutral'}>{m.status}</Badge>
                  </div>
                  <div className="mt-0.5 text-xs text-primary-600">
                    {m.ort ? m.ort : '—'} · {m.start ?? '—'}–{m.ende ?? '—'}
                  </div>
                </div>
                <Link to={`/sitzungen/${m.id}`}>
                  <Button size="sm" variant="secondary">
                    Öffnen
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-primary-600">Noch keine Sitzungen im Schuljahr.</div>
        )}
      </Card>

      <Card title="Protokoll (AI)" >
        <div className="text-sm text-primary-700">
          Protokoll-Generierung ist im MVP lokal (Vorlage). Falls ihr später ein internes KI-Backend wollt,
          kann der Button in der Detailansicht auf einen Server-Endpunkt umgestellt werden.
        </div>
      </Card>
    </div>
  );
}
