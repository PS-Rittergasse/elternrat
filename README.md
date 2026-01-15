# Elternrat Tool (Primarstufe Rittergasse, Basel)

React/Vite Web App für den Elternrat.

## Tech
- React 18 + Vite
- Tailwind CSS (Monochrom/Grayscale + CSS Custom Properties)
- date-fns (de-CH)
- Lucide Icons
- localStorage Persistenz
- PWA (Service Worker via vite-plugin-pwa)

## Module
- Dashboard
- Kalender (Monatsansicht + iCal Export)
- Sitzungen (Traktanden, Beschlüsse, Pendenzen, Protokoll)
- Mitglieder (Vorstand & Delegierte)
- Vorschläge (Abstimmung)
- Events (lokal + optional Schulhelfer Sync)
- Kommunikation (Ankündigungen + Mailvorlagen + Versand)
- Dokumente (nur Links/Metadaten + optional Drive Upload)
- Archiv (Schuljahr-Wechsel)
- Einstellungen

## Lokaler Start
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
npm run preview
```

## Deployment (statisch)
Die App ist ein reines Static Build. Für GitHub Pages:

```bash
# Beispiel: Repo heisst elternrat-tool
VITE_BASE=/elternrat-tool/ npm run build
```

Upload `dist/` auf euren Static Host.

## Backend: Gmail + Drive (Google Apps Script)
Ziel: keine OAuth-Authentifikation im Frontend. Das Backend läuft im Elternrat-Gmail.

### 1) Apps Script Projekt erstellen
- Im Elternrat Gmail Konto `rittergassehelferliste@gmail.com` `script.google.com` öffnen
- Neues Projekt erstellen
- Dateien aus `apps-script/` übernehmen:
  - `Code.gs`
  - `appsscript.json`

### 2) Script Properties (API Key)
Optional, aber empfohlen:
- Project Settings → Script properties
- `API_KEY` setzen (z.B. ein langes Random Secret)

### 3) Deploy als Web App
- Deploy → New deployment → Web app
- Execute as: **Me**
- Who has access: **Anyone** (Link-Access) 

Kopiert die **Web App URL**.

### 4) Frontend konfigurieren
In der App: Einstellungen → Backend
- Backend URL: Web App URL
- API Key: wie in Script Properties
- Drive Root Folder ID: Zielordner (empfohlen)
- Auto-Share: optional

### Hinweise
- Upload erfolgt als base64 (geeignet für kleine/mittlere Dateien). Limit in den Einstellungen.
- Versandmodi: Einzelversand oder 1 Mail mit BCC.

## Schulhelfer Integration
In Einstellungen → Schulhelfer
- API URL setzen (Apps Script Web App des Schulhelfer Systems)
- getEvents Test ausführen

Die Mapping-Felder in `src/lib/api/schulhelferClient.ts` sind generisch und können bei Bedarf angepasst werden.
