import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Select from '../components/Select';
import Textarea from '../components/Textarea';
import { fmtDateShort } from '../lib/date';
import { uid } from '../lib/id';
import type { Beschluss, Meeting, Pendenz, Traktandum } from '../lib/types';
import { useAppStore } from '../state/store';

function generateProtocol(m: Meeting, memberName: (id: string) => string): string {
  const lines: string[] = [];
  lines.push(`Protokoll Elternrat – ${fmtDateShort(m.datum)}`);
  lines.push('');
  lines.push(`Ort: ${m.ort || '—'}`);
  lines.push(`Zeit: ${m.start ?? '—'}–${m.ende ?? '—'}`);
  lines.push('');
  if (m.teilnehmendeIds.length) {
    lines.push('Teilnehmende:');
    for (const id of m.teilnehmendeIds) lines.push(`- ${memberName(id)}`);
    lines.push('');
  }
  if (m.traktanden.length) {
    lines.push('Traktanden:');
    for (const t of m.traktanden) {
      lines.push(`- ${t.titel}`);
      if (t.beschreibung) lines.push(`  ${t.beschreibung}`);
      if (t.verantwortlich) lines.push(`  Verantwortlich: ${t.verantwortlich}`);
      if (t.status) lines.push(`  Status: ${t.status}`);
    }
    lines.push('');
  }
  if (m.beschluesse.length) {
    lines.push('Beschlüsse:');
    for (const b of m.beschluesse) {
      lines.push(`- ${b.text}`);
      if (b.verantwortlich) lines.push(`  Verantwortlich: ${b.verantwortlich}`);
      if (b.frist) lines.push(`  Frist: ${fmtDateShort(b.frist)}`);
    }
    lines.push('');
  }
  if (m.pendenzen.length) {
    lines.push('Pendenzen:');
    for (const p of m.pendenzen) {
      const due = p.dueDate ? ` (bis ${fmtDateShort(p.dueDate)})` : '';
      lines.push(`- ${p.task}${due} – ${p.status}${p.owner ? ` · ${p.owner}` : ''}`);
    }
    lines.push('');
  }
  return lines.join('\n').trim();
}

export default function SitzungDetailPage() {
  const { id } = useParams();
  const { state, actions } = useAppStore();
  const nav = useNavigate();

  const meeting = state.entities.meetings.find((m) => m.id === id);

  const memberName = useMemo(() => {
    const map = new Map(state.entities.members.map((m) => [m.id, m.name] as const));
    return (mid: string) => map.get(mid) ?? mid;
  }, [state.entities.members]);

  if (!meeting) {
    return (
      <Card title="Sitzung nicht gefunden">
        <div className="text-sm text-primary-700">Die Sitzung existiert nicht (mehr).</div>
        <div className="mt-3">
          <Link to="/sitzungen">
            <Button size="sm">Zur Übersicht</Button>
          </Link>
        </div>
      </Card>
    );
  }

  const update = (patch: Partial<Meeting>) => {
    actions.upsertMeeting({ ...meeting, ...patch });
  };

  const toggleTeilnehmer = (memberId: string) => {
    const has = meeting.teilnehmendeIds.includes(memberId);
    const next = has
      ? meeting.teilnehmendeIds.filter((x) => x !== memberId)
      : [...meeting.teilnehmendeIds, memberId];
    update({ teilnehmendeIds: next });
  };

  const addTraktandum = () => {
    const t: Traktandum = { id: uid(), titel: '', beschreibung: '', verantwortlich: '', status: 'Offen' };
    update({ traktanden: [...meeting.traktanden, t] });
  };

  const updTraktandum = (tid: string, patch: Partial<Traktandum>) => {
    update({
      traktanden: meeting.traktanden.map((t) => (t.id === tid ? { ...t, ...patch } : t))
    });
  };

  const delTraktandum = (tid: string) => {
    update({ traktanden: meeting.traktanden.filter((t) => t.id !== tid) });
  };

  const addBeschluss = () => {
    const b: Beschluss = { id: uid(), text: '', verantwortlich: '', frist: '' };
    update({ beschluesse: [...meeting.beschluesse, b] });
  };

  const updBeschluss = (bid: string, patch: Partial<Beschluss>) => {
    update({
      beschluesse: meeting.beschluesse.map((b) => (b.id === bid ? { ...b, ...patch } : b))
    });
  };

  const delBeschluss = (bid: string) => {
    update({ beschluesse: meeting.beschluesse.filter((b) => b.id !== bid) });
  };

  const addPendenz = () => {
    const p: Pendenz = { id: uid(), task: '', owner: '', dueDate: '', status: 'Offen' };
    update({ pendenzen: [...meeting.pendenzen, p] });
  };

  const updPendenz = (pid: string, patch: Partial<Pendenz>) => {
    update({
      pendenzen: meeting.pendenzen.map((p) => (p.id === pid ? { ...p, ...patch } : p))
    });
  };

  const delPendenz = (pid: string) => {
    update({ pendenzen: meeting.pendenzen.filter((p) => p.id !== pid) });
  };

  const onGenerate = () => {
    update({ protokoll: generateProtocol(meeting, memberName) });
  };

  const onToggleFinal = () => {
    update({ status: meeting.status === 'Final' ? 'Entwurf' : 'Final' });
  };

  const onDelete = () => {
    actions.deleteMeeting(meeting.id);
    nav('/sitzungen');
  };

  const copyProtocol = async () => {
    try {
      await navigator.clipboard.writeText(meeting.protokoll || '');
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-4">
      <Card
        title={fmtDateShort(meeting.datum)}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant={meeting.status === 'Final' ? 'success' : 'neutral'}>{meeting.status}</Badge>
            <Button size="sm" variant="ghost" onClick={onToggleFinal}>
              {meeting.status === 'Final' ? 'Wieder Entwurf' : 'Finalisieren'}
            </Button>
            <Button size="sm" variant="destructive" onClick={onDelete}>
              Löschen
            </Button>
          </div>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-primary-700">Datum</label>
            <Input type="date" value={meeting.datum} onChange={(e) => update({ datum: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-primary-700">Ort</label>
            <Input value={meeting.ort ?? ''} onChange={(e) => update({ ort: e.target.value })} placeholder="Rittergasse ..." />
          </div>
          <div>
            <label className="text-xs font-medium text-primary-700">Start</label>
            <Input type="time" value={meeting.start ?? ''} onChange={(e) => update({ start: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-primary-700">Ende</label>
            <Input type="time" value={meeting.ende ?? ''} onChange={(e) => update({ ende: e.target.value })} />
          </div>
        </div>
      </Card>

      <Card
        title="Teilnehmende"
        actions={
          <div className="text-xs text-primary-600">
            {meeting.teilnehmendeIds.length} ausgewählt
          </div>
        }
      >
        {state.entities.members.length ? (
          <div className="grid gap-2 md:grid-cols-2">
            {state.entities.members
              .filter((m) => (m.aktivBis ? m.aktivBis >= meeting.datum : true))
              .map((m) => {
                const checked = meeting.teilnehmendeIds.includes(m.id);
                return (
                  <label key={m.id} className="flex items-center gap-2 rounded-xl border border-primary-200 px-3 py-2">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleTeilnehmer(m.id)}
                      className="h-4 w-4"
                    />
                    <div className="min-w-0">
                      <div className="truncate text-sm">{m.name}</div>
                      <div className="truncate text-xs text-primary-600">{m.rolle}{m.klasse ? ` · ${m.klasse}` : ''}</div>
                    </div>
                  </label>
                );
              })}
          </div>
        ) : (
          <div className="text-sm text-primary-600">Noch keine Mitglieder erfasst.</div>
        )}
      </Card>

      <Card title="Traktanden" actions={<Button size="sm" onClick={addTraktandum}>Traktandum hinzufügen</Button>}>
        <div className="space-y-3">
          {meeting.traktanden.map((t) => (
            <div key={t.id} className="rounded-xl border border-primary-200 p-3">
              <div className="grid gap-2 md:grid-cols-2">
                <div>
                  <label className="text-xs font-medium text-primary-700">Titel</label>
                  <Input value={t.titel} onChange={(e) => updTraktandum(t.id, { titel: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-primary-700">Verantwortlich</label>
                  <Input value={t.verantwortlich ?? ''} onChange={(e) => updTraktandum(t.id, { verantwortlich: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-primary-700">Beschreibung</label>
                  <Textarea value={t.beschreibung ?? ''} onChange={(e) => updTraktandum(t.id, { beschreibung: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-primary-700">Status</label>
                  <Select value={t.status ?? 'Offen'} onChange={(e) => updTraktandum(t.id, { status: e.target.value as any })}>
                    <option value="Offen">Offen</option>
                    <option value="In Arbeit">In Arbeit</option>
                    <option value="Erledigt">Erledigt</option>
                  </Select>
                </div>
                <div className="flex items-end justify-end">
                  <Button size="sm" variant="destructive" onClick={() => delTraktandum(t.id)}>
                    Entfernen
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {!meeting.traktanden.length ? <div className="text-sm text-primary-600">Keine Traktanden.</div> : null}
        </div>
      </Card>

      <Card title="Beschlüsse" actions={<Button size="sm" onClick={addBeschluss}>Beschluss hinzufügen</Button>}>
        <div className="space-y-3">
          {meeting.beschluesse.map((b) => (
            <div key={b.id} className="rounded-xl border border-primary-200 p-3">
              <div className="grid gap-2 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-primary-700">Text</label>
                  <Textarea value={b.text} onChange={(e) => updBeschluss(b.id, { text: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-primary-700">Verantwortlich</label>
                  <Input value={b.verantwortlich ?? ''} onChange={(e) => updBeschluss(b.id, { verantwortlich: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-primary-700">Frist</label>
                  <Input type="date" value={b.frist ?? ''} onChange={(e) => updBeschluss(b.id, { frist: e.target.value })} />
                </div>
                <div className="flex items-end justify-end md:col-span-2">
                  <Button size="sm" variant="destructive" onClick={() => delBeschluss(b.id)}>
                    Entfernen
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {!meeting.beschluesse.length ? <div className="text-sm text-primary-600">Keine Beschlüsse.</div> : null}
        </div>
      </Card>

      <Card title="Pendenzen" actions={<Button size="sm" onClick={addPendenz}>Pendenz hinzufügen</Button>}>
        <div className="space-y-3">
          {meeting.pendenzen.map((p) => (
            <div key={p.id} className="rounded-xl border border-primary-200 p-3">
              <div className="grid gap-2 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="text-xs font-medium text-primary-700">Task</label>
                  <Input value={p.task} onChange={(e) => updPendenz(p.id, { task: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-primary-700">Owner</label>
                  <Input value={p.owner ?? ''} onChange={(e) => updPendenz(p.id, { owner: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-primary-700">Fällig</label>
                  <Input type="date" value={p.dueDate ?? ''} onChange={(e) => updPendenz(p.id, { dueDate: e.target.value })} />
                </div>
                <div>
                  <label className="text-xs font-medium text-primary-700">Status</label>
                  <Select value={p.status} onChange={(e) => updPendenz(p.id, { status: e.target.value as any })}>
                    <option value="Offen">Offen</option>
                    <option value="In Arbeit">In Arbeit</option>
                    <option value="Erledigt">Erledigt</option>
                  </Select>
                </div>
                <div className="flex items-end justify-end">
                  <Button size="sm" variant="destructive" onClick={() => delPendenz(p.id)}>
                    Entfernen
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {!meeting.pendenzen.length ? <div className="text-sm text-primary-600">Keine Pendenzen.</div> : null}
        </div>
      </Card>

      <Card
        title="Protokoll"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={onGenerate}>
              Protokoll erzeugen
            </Button>
            <Button size="sm" variant="ghost" onClick={copyProtocol}>
              Kopieren
            </Button>
          </div>
        }
      >
        <Textarea
          value={meeting.protokoll}
          onChange={(e) => update({ protokoll: e.target.value })}
          placeholder="Protokolltext..."
          className="min-h-[220px]"
        />
        <div className="mt-2 text-xs text-primary-600">
          Hinweis: Dieser Button nutzt eine lokale Vorlage. Für echte AI-Protokolle braucht es ein Backend.
        </div>
      </Card>

      <div>
        <Link to="/sitzungen">
          <Button variant="ghost">Zur Übersicht</Button>
        </Link>
      </div>
    </div>
  );
}
