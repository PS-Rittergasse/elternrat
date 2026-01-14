import { useMemo, useState } from 'react';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Select from '../components/Select';
import Textarea from '../components/Textarea';
import { uid } from '../lib/id';
import type { Member, MemberRole } from '../lib/types';
import { useAppStore } from '../state/store';

const roles: MemberRole[] = ['Vorstand', 'Delegierte', 'Weitere'];

export default function MitgliederPage() {
  const { state, actions } = useAppStore();
  const year = state.settings.activeSchoolYear;

  const [filter, setFilter] = useState('');

  const members = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const list = state.entities.members.slice().sort((a, b) => a.name.localeCompare(b.name));
    if (!q) return list;
    return list.filter((m) =>
      [m.name, m.rolle, m.klasse, m.email].filter(Boolean).join(' ').toLowerCase().includes(q)
    );
  }, [filter, state.entities.members]);

  const [draft, setDraft] = useState<Member>(() => ({
    id: uid(),
    name: '',
    rolle: 'Delegierte'
  }));

  const onSave = () => {
    if (!draft.name.trim()) return;
    actions.upsertMember({ ...draft });
    setDraft({ id: uid(), name: '', rolle: 'Delegierte' });
  };

  const onDelete = (id: string) => {
    actions.deleteMember(id);
  };

  return (
    <div className="space-y-4">
      <Card title="Mitglieder" actions={<div className="text-xs text-primary-600">Schuljahr {year}</div>}>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-primary-700">Suche</label>
            <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Name, Klasse, Rolle..." />
          </div>
        </div>
      </Card>

      <Card title="Neu erfassen" actions={<Button size="sm" onClick={onSave}>Speichern</Button>}>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-primary-700">Name</label>
            <Input value={draft.name} onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-primary-700">Rolle</label>
            <Select
              value={draft.rolle}
              onChange={(e) => setDraft((p) => ({ ...p, rolle: e.target.value as MemberRole }))}
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-primary-700">Klasse</label>
            <Input value={draft.klasse ?? ''} onChange={(e) => setDraft((p) => ({ ...p, klasse: e.target.value }))} placeholder="z.B. 3a" />
          </div>
          <div>
            <label className="text-xs font-medium text-primary-700">E-Mail</label>
            <Input value={draft.email ?? ''} onChange={(e) => setDraft((p) => ({ ...p, email: e.target.value }))} placeholder="name@example.com" />
          </div>
          <div>
            <label className="text-xs font-medium text-primary-700">Telefon</label>
            <Input value={draft.telefon ?? ''} onChange={(e) => setDraft((p) => ({ ...p, telefon: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-primary-700">Aktiv bis</label>
            <Input type="date" value={draft.aktivBis ?? ''} onChange={(e) => setDraft((p) => ({ ...p, aktivBis: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-primary-700">Notizen</label>
            <Textarea value={draft.notizen ?? ''} onChange={(e) => setDraft((p) => ({ ...p, notizen: e.target.value }))} />
          </div>
        </div>
      </Card>

      <Card title={`Liste (${members.length})`}>
        {members.length ? (
          <div className="divide-y divide-primary-200">
            {members.map((m) => (
              <div key={m.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-medium">{m.name}</div>
                    <Badge>{m.rolle}</Badge>
                    {m.aktivBis ? <Badge variant="warning">bis {m.aktivBis}</Badge> : null}
                  </div>
                  <div className="mt-0.5 text-xs text-primary-600">
                    {[m.klasse, m.email, m.telefon].filter(Boolean).join(' · ') || '—'}
                  </div>
                </div>
                <Button size="sm" variant="destructive" onClick={() => onDelete(m.id)}>
                  Löschen
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-primary-600">Keine Mitglieder gefunden.</div>
        )}
      </Card>
    </div>
  );
}
