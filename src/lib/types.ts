export type ID = string;

export type Schuljahr = string; // z.B. "2025/26"

export type MemberRole = 'Vorstand' | 'Delegierte' | 'Weitere';

export type Member = {
  id: ID;
  name: string;
  rolle: MemberRole;
  klasse?: string;
  email?: string;
  telefon?: string;
  aktivSeit?: string; // ISO
  aktivBis?: string; // ISO
  notizen?: string;
};

export type MeetingStatus = 'Entwurf' | 'Final';

export type Traktandum = {
  id: ID;
  titel: string;
  beschreibung?: string;
  verantwortlich?: string;
  status?: 'Offen' | 'In Arbeit' | 'Erledigt';
};

export type Beschluss = {
  id: ID;
  text: string;
  verantwortlich?: string;
  frist?: string; // ISO date
};

export type Pendenz = {
  id: ID;
  task: string;
  owner?: string;
  dueDate?: string; // ISO date
  status: 'Offen' | 'In Arbeit' | 'Erledigt';
};

export type Meeting = {
  id: ID;
  schuljahr: Schuljahr;
  datum: string; // ISO date
  start?: string; // HH:mm
  ende?: string; // HH:mm
  ort?: string;
  teilnehmendeIds: ID[];
  traktanden: Traktandum[];
  beschluesse: Beschluss[];
  pendenzen: Pendenz[];
  protokoll: string; // plain text
  status: MeetingStatus;
  createdAt: string;
  updatedAt: string;
};

export type ProposalStatus = 'Offen' | 'In Abstimmung' | 'Angenommen' | 'Abgelehnt' | 'Erledigt';

export type ProposalVote = 'Ja' | 'Nein' | 'Enthaltung';

export type Proposal = {
  id: ID;
  schuljahr: Schuljahr;
  titel: string;
  beschreibung?: string;
  status: ProposalStatus;
  abstimmungBis?: string; // ISO date
  votesByMemberId: Record<ID, ProposalVote>;
  createdAt: string;
  updatedAt: string;
};

export type EventSource = 'lokal' | 'schulhelfer';

export type EventItem = {
  id: ID;
  schuljahr: Schuljahr;
  titel: string;
  beschreibung?: string;
  start: string; // ISO datetime
  ende: string; // ISO datetime
  ort?: string;
  quelle: EventSource;
  externalId?: string;
  createdAt: string;
  updatedAt: string;
};

export type DocumentCategory =
  | 'Allgemein'
  | 'Sitzungen'
  | 'Finanzen'
  | 'Kommunikation'
  | 'Events'
  | 'Vorlagen';

export type DriveRef = {
  fileId: string;
  name: string;
  mimeType?: string;
  size?: number;
  webViewLink: string;
};

export type DocumentItem = {
  id: ID;
  schuljahr: Schuljahr;
  titel: string;
  kategorie: DocumentCategory;
  datum?: string; // ISO date
  tags: string[];
  notizen?: string;
  storage: 'link' | 'drive';
  linkUrl?: string;
  drive?: DriveRef;
  createdAt: string;
  updatedAt: string;
};

export type EmailTemplate = {
  id: ID;
  name: string;
  betreff: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};

export type Announcement = {
  id: ID;
  titel: string;
  text: string;
  datum: string; // ISO date
  createdAt: string;
  updatedAt: string;
};

export type SchulhelferSettings = {
  enabled: boolean;
  apiUrl: string; // Apps Script Web App URL
  apiKey: string; // optional
};

export type ElternratBackendSettings = {
  enabled: boolean;
  apiUrl: string; // Apps Script Web App URL
  apiKey: string; // shared secret
  driveRootFolderId: string;
  autoShareLink: boolean;
  maxUploadMB: number;
};

export type Settings = {
  schoolName: string;
  activeSchoolYear: Schuljahr;
  readOnly: boolean;
  timezone: string;
  schulhelfer: SchulhelferSettings;
  backend: ElternratBackendSettings;
};

export type Entities = {
  members: Member[];
  meetings: Meeting[];
  proposals: Proposal[];
  events: EventItem[];
  documents: DocumentItem[];
  emailTemplates: EmailTemplate[];
  announcements: Announcement[];
};

export type PersistedState = {
  schemaVersion: 1;
  settings: Settings;
  entities: Entities;
};
