import { useMemo, useState } from 'react';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Select from '../components/Select';
import Textarea from '../components/Textarea';
import { fmtDateShort } from '../lib/date';
import { uid } from '../lib/id';
import type { Proposal, ProposalStatus, ProposalVote } from '../lib/types';
import { useAppStore } from '../state/store';

const statusOptions: ProposalStatus[] = ['Offen', 'In Abstimmung', 'Angenommen', 'Abgelehnt', 'Erledigt'];
const voteOptions: ProposalVote[] = ['Ja', 'Nein', 'Enthaltung'];

function countVotes(p: Proposal) {
  const vals = Object.values(p.votesByMemberId);
  const ja = vals.filter((v) => v === 'Ja').length;
  const nein = vals.filter((v) => v === 'Nein').length;
  const enth = vals.filter((v) => v === 'Enthaltung').length;
  return { ja, nein, enth, total: vals.length };
}

export default function VorschlaegePage() {
  const { state, actions } = useAppStore();
  const year = state.settings.activeSchoolYear;

  const proposals = useMemo(() => {
    return state.entities.proposals
      .filter((p) => p.schuljahr === year)
      .slice()
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }, [state.entities.proposals, year]);

  const [openId, setOpenId] = useState<string | null>(null);

  const [draft, setDraft] = useState<Proposal>(() => {
    const now = new Date().toISOString();
    return {
      id: uid(),
      schuljahr: year,
      titel: '',
      beschreibung: '',
      status: 'Offen',
      abstimmungBis: '',
      votesByMemberId: {},
      createdAt: now,
      updatedAt: now
    };
  });

  const onSave = () => {
    if (!draft.titel.trim()) return;
    actions.upsertProposal({ ...draft, schuljahr: year });
    const now = new Date().toISOString();
    setDraft({
      id: uid(),
      schuljahr: year,
      titel: '',
      beschreibung: '',
      status: 'Offen',
      abstimmungBis: '',
      votesByMemberId: {},
      createdAt: now,
      updatedAt: now
    });
  };

  const setVote = (proposal: Proposal, memberId: string, vote: ProposalVote | '') => {
    const next = { ...proposal.votesByMemberId };
    if (!vote) delete next[memberId];
    else next[memberId] = vote;
    actions.upsertProposal({ ...proposal, votesByMemberId: next });
  };

  return (
    <div className="space-y-4">
      <Card title={`Vorschläge · ${year}`}>
        <div className="text-sm text-primary-700">
          Abstimmung ist intern (kein Login). Stimmen werden pro Mitglied gespeichert.
        </div>
      </Card>

      <Card title="Neuer Vorschlag" actions={<Button size="sm" onClick={onSave}>Speichern</Button>}>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-primary-700">Titel</label>
            <Input value={draft.titel} onChange={(e) => setDraft((p) => ({ ...p, titel: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-primary-700">Status</label>
            <Select value={draft.status} onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value as ProposalStatus }))}>
              {statusOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-primary-700">Abstimmung bis</label>
            <Input type="date" value={draft.abstimmungBis ?? ''} onChange={(e) => setDraft((p) => ({ ...p, abstimmungBis: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-primary-700">Beschreibung</label>
            <Textarea value={draft.beschreibung ?? ''} onChange={(e) => setDraft((p) => ({ ...p, beschreibung: e.target.value }))} />
          </div>
        </div>
      </Card>

      <Card title={`Liste (${proposals.length})`}>
        {proposals.length ? (
          <div className="divide-y divide-primary-200">
            {proposals.map((p) => {
              const c = countVotes(p);
              const open = openId === p.id;
              return (
                <div key={p.id} className="py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="truncate text-sm font-medium">{p.titel}</div>
                        <Badge>{p.status}</Badge>
                        {p.abstimmungBis ? <Badge variant="warning">bis {fmtDateShort(p.abstimmungBis)}</Badge> : null}
                      </div>
                      {p.beschreibung ? <div className="mt-1 text-sm text-primary-700">{p.beschreibung}</div> : null}
                      <div className="mt-1 text-xs text-primary-600">
                        Stimmen: {c.ja} Ja · {c.nein} Nein · {c.enth} Enthaltung · {c.total} total
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="secondary" onClick={() => setOpenId(open ? null : p.id)}>
                        {open ? 'Schliessen' : 'Abstimmen'}
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => actions.deleteProposal(p.id)}>
                        Löschen
                      </Button>
                    </div>
                  </div>

                  {open ? (
                    <div className="mt-3 rounded-xl border border-primary-200 p-3">
                      {state.entities.members.length ? (
                        <div className="space-y-2">
                          {state.entities.members.map((m) => (
                            <div key={m.id} className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate text-sm">{m.name}</div>
                                <div className="truncate text-xs text-primary-600">{m.rolle}{m.klasse ? ` · ${m.klasse}` : ''}</div>
                              </div>
                              <Select
                                value={p.votesByMemberId[m.id] ?? ''}
                                onChange={(e) => setVote(p, m.id, e.target.value as any)}
                                className="w-44"
                              >
                                <option value="">—</option>
                                {voteOptions.map((v) => (
                                  <option key={v} value={v}>{v}</option>
                                ))}
                              </Select>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-sm text-primary-600">Keine Mitglieder erfasst.</div>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-sm text-primary-600">Noch keine Vorschläge.</div>
        )}
      </Card>
    </div>
  );
}
