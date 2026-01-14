import { useState } from 'react';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import { backendPing, backendSendEmail } from '../lib/api/elternratBackend';
import { schulhelferGetEvents } from '../lib/api/schulhelferClient';
import { availableSchoolYears } from '../lib/schuljahr';
import type { Settings } from '../lib/types';
import { useAppStore } from '../state/store';

function downloadText(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function EinstellungenPage() {
  const { state, actions } = useAppStore();

  const [msg, setMsg] = useState<string | null>(null);
  const [testTo, setTestTo] = useState('');
  const [busy, setBusy] = useState(false);

  const years = availableSchoolYears(6);

  const setSettings = (patch: Partial<Settings>) => actions.setSettings(patch);

  const onExport = () => {
    const json = JSON.stringify(state, null, 2);
    downloadText(`elternrat-export-${new Date().toISOString().slice(0, 10)}.json`, json, 'application/json;charset=utf-8');
  };

  const onImportFile = async (file: File) => {
    setMsg(null);
    try {
      const text = await file.text();
      actions.importStateJson(text);
      setMsg('Import ok');
    } catch (e: any) {
      setMsg(e?.message ?? 'Import fehlgeschlagen');
    }
  };

  const onReset = () => {
    actions.resetAll();
    setMsg('Zurückgesetzt');
  };

  const testSchulhelfer = async () => {
    setMsg(null);
    setBusy(true);
    try {
      const events = await schulhelferGetEvents(state.settings.schulhelfer);
      setMsg(`Schulhelfer ok: ${events.length} Events`);
    } catch (e: any) {
      setMsg(e?.message ?? 'Schulhelfer Test fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  };

  const testBackendPing = async () => {
    setMsg(null);
    setBusy(true);
    try {
      const r = await backendPing(state.settings.backend);
      setMsg(`Backend ok: v${r.version}`);
    } catch (e: any) {
      setMsg(e?.message ?? 'Backend Test fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  };

  const testBackendMail = async () => {
    setMsg(null);
    if (!testTo.trim()) {
      setMsg('Test-Empfänger fehlt');
      return;
    }
    setBusy(true);
    try {
      const r = await backendSendEmail({
        settings: state.settings.backend,
        to: [testTo.trim()],
        subject: 'Elternrat Tool – Test',
        body: `Testmail vom Elternrat Tool (${new Date().toISOString()})`,
        sendMode: 'single'
      });
      setMsg(`Mail ok: ${r.sent} gesendet`);
    } catch (e: any) {
      setMsg(e?.message ?? 'Mail Test fehlgeschlagen');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card title="Basis">
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-primary-700">Schule</label>
            <Input value={state.settings.schoolName} onChange={(e) => setSettings({ schoolName: e.target.value })} />
          </div>
          <div>
            <label className="text-xs font-medium text-primary-700">Aktives Schuljahr</label>
            <select
              value={state.settings.activeSchoolYear}
              onChange={(e) => setSettings({ activeSchoolYear: e.target.value })}
              className="w-full rounded-xl border border-primary-200 bg-primary-50 px-3 py-2 text-sm"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={state.settings.readOnly}
                onChange={(e) => setSettings({ readOnly: e.target.checked })}
                className="h-4 w-4"
              />
              Nur-Lese-Modus (verhindert Mutationen)
            </label>
          </div>
        </div>
      </Card>

      <Card
        title="Schulhelfer Integration"
        actions={state.settings.schulhelfer.enabled ? <Badge variant="success">aktiv</Badge> : <Badge variant="neutral">aus</Badge>}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={state.settings.schulhelfer.enabled}
                onChange={(e) => setSettings({ schulhelfer: { ...state.settings.schulhelfer, enabled: e.target.checked } })}
                className="h-4 w-4"
              />
              Aktiv
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-primary-700">API URL (Apps Script Web App)</label>
            <Input
              value={state.settings.schulhelfer.apiUrl}
              onChange={(e) => setSettings({ schulhelfer: { ...state.settings.schulhelfer, apiUrl: e.target.value } })}
              placeholder="https://script.google.com/macros/s/.../exec"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-primary-700">API Key (optional)</label>
            <Input
              value={state.settings.schulhelfer.apiKey}
              onChange={(e) => setSettings({ schulhelfer: { ...state.settings.schulhelfer, apiKey: e.target.value } })}
              placeholder="optional"
            />
          </div>
          <div className="md:col-span-2 flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={testSchulhelfer} disabled={busy}>
              Test: getEvents
            </Button>
          </div>
        </div>
      </Card>

      <Card
        title="Backend (Gmail + Drive)"
        actions={state.settings.backend.enabled ? <Badge variant="success">aktiv</Badge> : <Badge variant="neutral">aus</Badge>}
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={state.settings.backend.enabled}
                onChange={(e) => setSettings({ backend: { ...state.settings.backend, enabled: e.target.checked } })}
                className="h-4 w-4"
              />
              Aktiv
            </label>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-primary-700">Backend URL (Apps Script Web App)</label>
            <Input
              value={state.settings.backend.apiUrl}
              onChange={(e) => setSettings({ backend: { ...state.settings.backend, apiUrl: e.target.value } })}
              placeholder="https://script.google.com/macros/s/.../exec"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-primary-700">API Key</label>
            <Input
              value={state.settings.backend.apiKey}
              onChange={(e) => setSettings({ backend: { ...state.settings.backend, apiKey: e.target.value } })}
              placeholder="(empfohlen)"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-primary-700">Max Upload (MB)</label>
            <Input
              type="number"
              value={state.settings.backend.maxUploadMB}
              onChange={(e) => setSettings({ backend: { ...state.settings.backend, maxUploadMB: Number(e.target.value || 0) } })}
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-primary-700">Drive Root Folder ID</label>
            <Input
              value={state.settings.backend.driveRootFolderId}
              onChange={(e) => setSettings({ backend: { ...state.settings.backend, driveRootFolderId: e.target.value } })}
              placeholder="1AbC..."
            />
            <div className="mt-1 text-xs text-primary-600">
              Optional. Wenn leer, wird im Root von Drive gespeichert (nicht empfohlen).
            </div>
          </div>
          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={state.settings.backend.autoShareLink}
                onChange={(e) => setSettings({ backend: { ...state.settings.backend, autoShareLink: e.target.checked } })}
                className="h-4 w-4"
              />
              Dateien automatisch "Jeder mit Link" teilen
            </label>
          </div>
          <div className="md:col-span-2 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" onClick={testBackendPing} disabled={busy}>
              Test: ping
            </Button>
            <Input value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="Test-Empfänger E-Mail" className="max-w-sm" />
            <Button size="sm" variant="secondary" onClick={testBackendMail} disabled={busy}>
              Test: Mail
            </Button>
          </div>
        </div>

        <div className="mt-3 rounded-xl border border-primary-200 p-3 text-sm text-primary-700">
          Ziel: keine OAuth-Auth im Frontend. Backend läuft im Elternrat-Gmail (Apps Script). API-Key ist optional, aber empfohlen.
        </div>
      </Card>

      <Card title="Daten" actions={<div className="flex items-center gap-2"><Button size="sm" variant="secondary" onClick={onExport}>Export</Button><Button size="sm" variant="destructive" onClick={onReset}>Reset</Button></div>}>
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-primary-700">Import (JSON)</label>
            <Input
              type="file"
              accept="application/json"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void onImportFile(f);
              }}
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-primary-700">Schema / Debug</label>
            <Textarea
              readOnly
              value={JSON.stringify({ schemaVersion: state.schemaVersion, counts: {
                members: state.entities.members.length,
                meetings: state.entities.meetings.length,
                proposals: state.entities.proposals.length,
                events: state.entities.events.length,
                documents: state.entities.documents.length,
                templates: state.entities.emailTemplates.length
              } }, null, 2)}
              className="min-h-[160px] font-mono"
            />
          </div>
        </div>
        {msg ? <div className="mt-2 text-xs text-primary-600">{msg}</div> : null}
      </Card>

      <Card title="Import/Export Hinweise">
        <div className="text-sm text-primary-700 space-y-2">
          <div>• Daten liegen lokal im Browser (localStorage). Export ist der Weg für Backup/Übergabe.</div>
          <div>• Drive-Dateien liegen nicht in der App; nur Links/IDs.</div>
          <div>• Für mehrere Geräte: Export/Import oder später Sync über ein Backend (Sheets/DB).</div>
        </div>
      </Card>
    </div>
  );
}
