import { useEffect, useMemo, useState } from 'react';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Select from '../components/Select';
import Textarea from '../components/Textarea';
import { fmtDateShort } from '../lib/date';
import { uid } from '../lib/id';
import type { Announcement, EmailTemplate } from '../lib/types';
import { backendSendEmail } from '../lib/api/elternratBackend';
import { useAppStore } from '../state/store';

function applyVars(text: string, vars: Record<string, string>) {
  return text.replace(/\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g, (_, key) => {
    return vars[key] ?? '';
  });
}

function splitEmails(raw: string): string[] {
  return raw
    .split(/[,;\n]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function KommunikationPage() {
  const { state, actions } = useAppStore();

  // Templates
  const templates = state.entities.emailTemplates.slice().sort((a, b) => a.name.localeCompare(b.name));
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(() => templates[0]?.id ?? '');

  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) ?? templates[0];

  const [tplDraft, setTplDraft] = useState<EmailTemplate | null>(selectedTemplate ?? null);

  // keep draft in sync when selection changes
  useEffect(() => {
    setTplDraft(selectedTemplate ?? null);
  }, [selectedTemplate]);

  const saveTemplate = () => {
    if (!tplDraft) return;
    if (!tplDraft.name.trim()) return;
    actions.upsertTemplate(tplDraft);
  };

  const newTemplate = () => {
    const now = new Date().toISOString();
    const t: EmailTemplate = {
      id: uid(),
      name: 'Neue Vorlage',
      betreff: '',
      body: '',
      createdAt: now,
      updatedAt: now
    };
    actions.upsertTemplate(t);
    setSelectedTemplateId(t.id);
  };

  // Send
  const memberEmails = useMemo(() => {
    return state.entities.members
      .filter((m) => !!m.email)
      .map((m) => ({ id: m.id, name: m.name, email: String(m.email) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [state.entities.members]);

  const [manualTo, setManualTo] = useState('');
  const [pickedMemberIds, setPickedMemberIds] = useState<string[]>([]);
  const [sendMode, setSendMode] = useState<'single' | 'bcc'>('single');
  const [visibleTo, setVisibleTo] = useState('');

  const [varDatum, setVarDatum] = useState(() => new Date().toISOString().slice(0, 10));
  const [varZeit, setVarZeit] = useState('');
  const [varOrt, setVarOrt] = useState('');
  const [varTraktanden, setVarTraktanden] = useState('');

  const vars = useMemo(() => {
    return {
      datum: varDatum ? fmtDateShort(varDatum) : '',
      zeit: varZeit,
      ort: varOrt,
      traktanden: varTraktanden,
      schuljahr: state.settings.activeSchoolYear
    };
  }, [state.settings.activeSchoolYear, varDatum, varOrt, varTraktanden, varZeit]);

  const rendered = useMemo(() => {
    const subj = applyVars(tplDraft?.betreff ?? '', vars);
    const body = applyVars(tplDraft?.body ?? '', vars);
    return { subj, body };
  }, [tplDraft, vars]);

  const recipients = useMemo(() => {
    const fromManual = splitEmails(manualTo);
    const fromMembers = memberEmails
      .filter((m) => pickedMemberIds.includes(m.id))
      .map((m) => m.email);
    return Array.from(new Set([...fromManual, ...fromMembers]));
  }, [manualTo, memberEmails, pickedMemberIds]);

  const [sendMsg, setSendMsg] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const onSend = async () => {
    setSendMsg(null);
    if (!state.settings.backend.enabled) {
      setSendMsg('Backend deaktiviert (Einstellungen > Backend)');
      return;
    }
    if (!rendered.subj.trim()) {
      setSendMsg('Betreff fehlt');
      return;
    }
    if (!rendered.body.trim()) {
      setSendMsg('Text fehlt');
      return;
    }
    if (!recipients.length) {
      setSendMsg('Keine Empfänger');
      return;
    }
    if (sendMode === 'bcc' && !visibleTo.trim()) {
      setSendMsg('Bei BCC-Modus braucht es eine sichtbare To-Adresse');
      return;
    }

    setSending(true);
    try {
      const r = await backendSendEmail({
        settings: state.settings.backend,
        to: sendMode === 'bcc' ? [visibleTo.trim()] : recipients,
        bcc: sendMode === 'bcc' ? recipients : undefined,
        subject: rendered.subj,
        body: rendered.body,
        sendMode
      });
      setSendMsg(`OK: ${r.sent} gesendet`);
    } catch (e: any) {
      setSendMsg(e?.message ?? 'Fehler');
    } finally {
      setSending(false);
    }
  };

  // Announcements
  const announcements = state.entities.announcements.slice().sort((a, b) => (a.datum < b.datum ? 1 : -1));
  const [aDraft, setADraft] = useState<Announcement>(() => {
    const now = new Date().toISOString();
    return {
      id: uid(),
      titel: '',
      text: '',
      datum: now.slice(0, 10),
      createdAt: now,
      updatedAt: now
    };
  });

  const saveAnnouncement = () => {
    if (!aDraft.titel.trim()) return;
    actions.upsertAnnouncement(aDraft);
    const now = new Date().toISOString();
    setADraft({
      id: uid(),
      titel: '',
      text: '',
      datum: now.slice(0, 10),
      createdAt: now,
      updatedAt: now
    });
  };

  return (
    <div className="space-y-4">
      <Card
        title="E-Mail Vorlagen"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={newTemplate}>
              Neue Vorlage
            </Button>
            <Button size="sm" onClick={saveTemplate}>
              Speichern
            </Button>
          </div>
        }
      >
        {templates.length ? (
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-primary-700">Vorlage</label>
              <Select value={selectedTemplateId} onChange={(e) => setSelectedTemplateId(e.target.value)}>
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-primary-700">Name</label>
              <Input
                value={tplDraft?.name ?? ''}
                onChange={(e) => setTplDraft((p) => (p ? { ...p, name: e.target.value } : p))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-primary-700">Betreff</label>
              <Input
                value={tplDraft?.betreff ?? ''}
                onChange={(e) => setTplDraft((p) => (p ? { ...p, betreff: e.target.value } : p))}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-primary-700">Text</label>
              <Textarea
                value={tplDraft?.body ?? ''}
                onChange={(e) => setTplDraft((p) => (p ? { ...p, body: e.target.value } : p))}
                className="min-h-[200px]"
              />
              <div className="mt-2 text-xs text-primary-600">
                Platzhalter: <span className="font-mono">{'{{datum}}'}</span>, <span className="font-mono">{'{{zeit}}'}</span>,{' '}
                <span className="font-mono">{'{{ort}}'}</span>, <span className="font-mono">{'{{traktanden}}'}</span>,{' '}
                <span className="font-mono">{'{{schuljahr}}'}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-primary-600">Keine Vorlagen.</div>
        )}
      </Card>

      <Card
        title="E-Mail senden"
        actions={
          state.settings.backend.enabled ? (
            <Badge variant="success">Backend aktiv</Badge>
          ) : (
            <Badge variant="warning">Backend deaktiviert</Badge>
          )
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-primary-700">Versandmodus</label>
            <Select value={sendMode} onChange={(e) => setSendMode(e.target.value as any)}>
              <option value="single">Einzelversand (empfohlen)</option>
              <option value="bcc">Ein Mail mit BCC</option>
            </Select>
          </div>
          {sendMode === 'bcc' ? (
            <div>
              <label className="text-xs font-medium text-primary-700">To-Adresse (sichtbar)</label>
              <Input value={visibleTo} onChange={(e) => setVisibleTo(e.target.value)} placeholder="elternrat@..." />
            </div>
          ) : (
            <div>
              <label className="text-xs font-medium text-primary-700">Empfänger (manuell)</label>
              <Input
                value={manualTo}
                onChange={(e) => setManualTo(e.target.value)}
                placeholder="a@b.ch, c@d.ch"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-primary-700">Datum</label>
            <Input type="date" value={varDatum} onChange={(e) => setVarDatum(e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-medium text-primary-700">Zeit</label>
            <Input value={varZeit} onChange={(e) => setVarZeit(e.target.value)} placeholder="19:30–21:00" />
          </div>
          <div>
            <label className="text-xs font-medium text-primary-700">Ort</label>
            <Input value={varOrt} onChange={(e) => setVarOrt(e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-primary-700">Traktanden</label>
            <Textarea value={varTraktanden} onChange={(e) => setVarTraktanden(e.target.value)} />
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-medium text-primary-700">Empfänger aus Mitgliederliste</label>
            {memberEmails.length ? (
              <div className="grid gap-2 md:grid-cols-2">
                {memberEmails.map((m) => {
                  const checked = pickedMemberIds.includes(m.id);
                  return (
                    <label key={m.id} className="flex items-center gap-2 rounded-xl border border-primary-200 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setPickedMemberIds((prev) =>
                            prev.includes(m.id) ? prev.filter((x) => x !== m.id) : [...prev, m.id]
                          )
                        }
                        className="h-4 w-4"
                      />
                      <div className="min-w-0">
                        <div className="truncate text-sm">{m.name}</div>
                        <div className="truncate text-xs text-primary-600">{m.email}</div>
                      </div>
                    </label>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-primary-600">Keine Mitglieder mit E-Mail.</div>
            )}
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-primary-200 p-3">
          <div className="text-xs font-medium text-primary-700">Vorschau</div>
          <div className="mt-2 text-sm font-medium">{rendered.subj || '—'}</div>
          <pre className="mt-2 whitespace-pre-wrap text-sm text-primary-800">{rendered.body || '—'}</pre>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <Button onClick={onSend} disabled={sending}>
            Senden ({recipients.length})
          </Button>
          {sendMsg ? <div className="text-xs text-primary-600">{sendMsg}</div> : null}
        </div>
      </Card>

      <Card title="Ankündigungen" actions={<Button size="sm" onClick={saveAnnouncement}>Speichern</Button>}>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-primary-700">Datum</label>
            <Input type="date" value={aDraft.datum} onChange={(e) => setADraft((p) => ({ ...p, datum: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-primary-700">Titel</label>
            <Input value={aDraft.titel} onChange={(e) => setADraft((p) => ({ ...p, titel: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-primary-700">Text</label>
            <Textarea value={aDraft.text} onChange={(e) => setADraft((p) => ({ ...p, text: e.target.value }))} />
          </div>
        </div>

        {announcements.length ? (
          <div className="mt-4 divide-y divide-primary-200">
            {announcements.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium">{a.titel}</div>
                  <div className="mt-0.5 text-xs text-primary-600">{fmtDateShort(a.datum)}</div>
                  {a.text ? <div className="mt-1 text-sm text-primary-700">{a.text}</div> : null}
                </div>
                <Button size="sm" variant="destructive" onClick={() => actions.deleteAnnouncement(a.id)}>
                  Löschen
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 text-sm text-primary-600">Noch keine Ankündigungen.</div>
        )}
      </Card>
    </div>
  );
}
