import { useMemo, useState } from 'react';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import Select from '../components/Select';
import Textarea from '../components/Textarea';
import { fmtDateShort } from '../lib/date';
import { uid } from '../lib/id';
import type { DocumentCategory, DocumentItem } from '../lib/types';
import { backendUploadBase64, fileToBase64 } from '../lib/api/elternratBackend';
import { useAppStore } from '../state/store';

const categories: DocumentCategory[] = [
  'Allgemein',
  'Protokolle',
  'Sitzungen',
  'Finanzen',
  'Kommunikation',
  'Events',
  'Vorlagen',
  'Sonstiges'
];

export default function DokumentePage() {
  const { state, actions } = useAppStore();
  const year = state.settings.activeSchoolYear;

  const documents = useMemo(() => {
    return state.entities.documents
      .filter((d) => d.schuljahr === year)
      .slice()
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
  }, [state.entities.documents, year]);

  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const [draft, setDraft] = useState<DocumentItem>(() => {
    const now = new Date().toISOString();
    return {
      id: uid(),
      schuljahr: year,
      titel: '',
      kategorie: 'Allgemein',
      notizen: '',
      beschreibung: '',
      storage: 'link',
      linkUrl: '',
      drive: undefined,
      tags: [],
      createdAt: now,
      updatedAt: now
    };
  });

  const resetDraft = () => {
    const now = new Date().toISOString();
    setDraft({
      id: uid(),
      schuljahr: year,
      titel: '',
      kategorie: 'Allgemein',
      notizen: '',
      beschreibung: '',
      storage: 'link',
      linkUrl: '',
      drive: undefined,
      tags: [],
      createdAt: now,
      updatedAt: now
    });
    setFile(null);
  };

  const onSave = () => {
    setStatusMsg(null);
    if (!draft.titel.trim()) {
      setStatusMsg('Titel fehlt');
      return;
    }
    const hasLink = (draft.linkUrl ?? '').trim().length > 0;
    const hasDrive = !!draft.drive?.fileId;
    if (!hasLink && !hasDrive) {
      setStatusMsg('Link oder Upload fehlt');
      return;
    }
    const storage: DocumentItem['storage'] = hasDrive ? 'drive' : 'link';
    const next: DocumentItem = {
      ...draft,
      schuljahr: year,
      storage,
      linkUrl: hasLink ? draft.linkUrl?.trim() : undefined
    };
    actions.upsertDocument(next);
    setStatusMsg('Gespeichert');
    resetDraft();
  };

  const onUpload = async () => {
    setStatusMsg(null);
    if (!file) {
      setStatusMsg('Keine Datei gewählt');
      return;
    }
    if (!state.settings.backend.enabled) {
      setStatusMsg('Backend deaktiviert (Einstellungen > Backend)');
      return;
    }

    const maxMb = state.settings.backend.maxUploadMB ?? 8;
    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > maxMb) {
      setStatusMsg(`Datei zu gross (${sizeMb.toFixed(1)} MB). Limit: ${maxMb} MB`);
      return;
    }

    setUploading(true);
    try {
      const base64 = await fileToBase64(file);
      const r = await backendUploadBase64({
        settings: state.settings.backend,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        base64
      });

      setDraft((p) => ({
        ...p,
        storage: 'drive',
        linkUrl: r.webViewLink,
        drive: {
          fileId: r.fileId,
          name: r.name,
          mimeType: r.mimeType,
          size: r.size,
          webViewLink: r.webViewLink
        }
      }));

      setStatusMsg('Upload ok');
    } catch (e: any) {
      setStatusMsg(e?.message ?? 'Upload fehlgeschlagen');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card
        title="Neues Dokument"
        actions={
          <div className="flex items-center gap-2">
            <Button size="sm" variant="secondary" onClick={onUpload} disabled={uploading}>
              Upload
            </Button>
            <Button size="sm" onClick={onSave}>
              Speichern
            </Button>
          </div>
        }
      >
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <label className="text-xs font-medium text-primary-700">Titel</label>
            <Input value={draft.titel} onChange={(e) => setDraft((p) => ({ ...p, titel: e.target.value }))} />
          </div>
          <div>
            <label className="text-xs font-medium text-primary-700">Kategorie</label>
            <Select
              value={draft.kategorie}
              onChange={(e) => setDraft((p) => ({ ...p, kategorie: e.target.value as DocumentCategory }))}
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-primary-700">Notizen</label>
            <Textarea
              value={draft.notizen ?? ''}
              onChange={(e) => setDraft((p) => ({ ...p, notizen: e.target.value }))}
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-medium text-primary-700">Link</label>
            <Input
              value={draft.linkUrl ?? ''}
              onChange={(e) => setDraft((p) => ({ ...p, linkUrl: e.target.value || undefined }))}
              placeholder="https://..."
            />
            <div className="mt-1 text-xs text-primary-600">Optional: Upload erstellt automatisch einen Drive-Link.</div>
          </div>

          <div className="md:col-span-2">
            <label className="text-xs font-medium text-primary-700">Upload (Google Drive)</label>
            <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            {state.settings.backend.enabled ? (
              <div className="mt-1 text-xs text-primary-600">
                Backend aktiv · Root-Folder: {state.settings.backend.driveRootFolderId ? 'gesetzt' : 'nicht gesetzt'}
              </div>
            ) : (
              <div className="mt-1 text-xs text-primary-600">Backend deaktiviert</div>
            )}
          </div>
        </div>

        {statusMsg ? <div className="mt-2 text-xs text-primary-600">{statusMsg}</div> : null}
      </Card>

      <Card title={`Dokumente · ${year} (${documents.length})`}>
        {documents.length ? (
          <div className="divide-y divide-primary-200">
            {documents.map((d) => (
              <div key={d.id} className="flex items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-medium">{d.titel}</div>
                    <Badge>{d.kategorie}</Badge>
                    {d.storage === 'drive' || d.drive ? <Badge variant="neutral">Drive</Badge> : null}
                  </div>
                  <div className="mt-0.5 text-xs text-primary-600">Update: {fmtDateShort(d.updatedAt)}</div>
                  {d.notizen ? <div className="mt-1 text-sm text-primary-700">{d.notizen}</div> : null}
                  {(() => {
                    const href = d.drive?.webViewLink ?? d.linkUrl;
                    if (!href) return null;
                    return (
                      <a
                        className="mt-2 inline-block text-sm underline decoration-primary-300"
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Link öffnen
                      </a>
                    );
                  })()}
                </div>
                <Button size="sm" variant="destructive" onClick={() => actions.deleteDocument(d.id)}>
                  Löschen
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-sm text-primary-600">Noch keine Dokumente.</div>
        )}
      </Card>

      <Card title="Hinweis">
        <div className="text-sm text-primary-700">
          Speicher ist absichtlich nur Links/Metadaten. Dateien bleiben in Google Drive.
        </div>
      </Card>
    </div>
  );
}
