import type { ElternratBackendSettings } from '../types';

type ApiOk<T> = { ok: true; data: T };
type ApiErr = { ok: false; error: string };
export type ApiResponse<T> = ApiOk<T> | ApiErr;

async function callBackend<T>(settings: ElternratBackendSettings, action: string, payload: Record<string, any>): Promise<T> {
  if (!settings.enabled) throw new Error('Backend ist deaktiviert');
  if (!settings.apiUrl) throw new Error('Backend-URL fehlt');

  const body = JSON.stringify({
    action,
    apiKey: settings.apiKey || '',
    ...payload
  });

  const res = await fetch(settings.apiUrl, {
    method: 'POST',
    redirect: 'follow',
    body
  });

  const txt = await res.text();
  let json: any;
  try {
    json = JSON.parse(txt);
  } catch {
    throw new Error('Ungültige Antwort (kein JSON)');
  }

  const r = json as ApiResponse<T>;
  if (r.ok) return r.data;
  throw new Error((r as ApiErr).error || 'Backend Fehler');
}

export async function backendPing(settings: ElternratBackendSettings): Promise<{ version: string }> {
  return callBackend(settings, 'ping', {});
}

export type UploadResult = {
  fileId: string;
  webViewLink: string;
  name: string;
  mimeType?: string;
  size?: number;
};

export async function backendUploadBase64(params: {
  settings: ElternratBackendSettings;
  fileName: string;
  mimeType: string;
  base64: string;
}): Promise<UploadResult> {
  const { settings, fileName, mimeType, base64 } = params;
  return callBackend(settings, 'uploadBase64', {
    fileName,
    mimeType,
    base64,
    folderId: settings.driveRootFolderId || '',
    autoShareLink: settings.autoShareLink
  });
}

export type SendEmailResult = { messageId?: string; sent: number };

export async function backendSendEmail(params: {
  settings: ElternratBackendSettings;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  sendMode?: 'single' | 'bcc';
}): Promise<SendEmailResult> {
  const { settings, ...rest } = params;
  return callBackend(settings, 'sendEmail', rest);
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = String(reader.result || '');
      // Data URL: data:<mime>;base64,<data>
      const idx = res.indexOf('base64,');
      if (idx === -1) return reject(new Error('Kein base64 gefunden'));
      resolve(res.slice(idx + 'base64,'.length));
    };
    reader.onerror = () => reject(new Error('Datei konnte nicht gelesen werden'));
    reader.readAsDataURL(file);
  });
}
