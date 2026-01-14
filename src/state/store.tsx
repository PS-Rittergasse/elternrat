import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type {
  Announcement,
  DocumentItem,
  EmailTemplate,
  EventItem,
  ID,
  Meeting,
  Member,
  PersistedState,
  Proposal,
  Settings
} from '../lib/types';
import { defaultState, loadState, saveState } from '../lib/storage';

type AppStore = {
  state: PersistedState;
  actions: {
    setSettings: (patch: Partial<Settings>) => void;
    exportStateJson: () => string;
    importStateJson: (json: string) => void;
    resetAll: () => void;

    upsertMember: (m: Member) => void;
    deleteMember: (id: ID) => void;

    upsertMeeting: (m: Meeting) => void;
    deleteMeeting: (id: ID) => void;

    upsertProposal: (p: Proposal) => void;
    deleteProposal: (id: ID) => void;

    upsertEvent: (e: EventItem) => void;
    deleteEvent: (id: ID) => void;

    upsertDocument: (d: DocumentItem) => void;
    deleteDocument: (id: ID) => void;

    upsertTemplate: (t: EmailTemplate) => void;
    deleteTemplate: (id: ID) => void;

    upsertAnnouncement: (a: Announcement) => void;
    deleteAnnouncement: (id: ID) => void;
  };
};

const Ctx = createContext<AppStore | null>(null);

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(() => loadState());

  useEffect(() => {
    saveState(state);
  }, [state]);

  const canWrite = !state.settings.readOnly;
  const now = () => new Date().toISOString();

  const actions = useMemo<AppStore['actions']>(() => {
    const setSettings = (patch: Partial<Settings>) => {
      setState((prev) => ({
        ...prev,
        settings: {
          ...prev.settings,
          ...patch
        }
      }));
    };

    const exportStateJson = () => JSON.stringify(state, null, 2);

    const importStateJson = (json: string) => {
      const parsed = JSON.parse(json) as PersistedState;
      if (!parsed || parsed.schemaVersion !== 1) throw new Error('Ungültiges Format');
      setState(parsed);
    };

    const resetAll = () => setState(defaultState());

    const upsertById = <T extends { id: ID }>(list: T[], item: T): T[] => {
      const idx = list.findIndex((x) => x.id === item.id);
      if (idx === -1) return [item, ...list];
      const next = list.slice();
      next[idx] = item;
      return next;
    };

    const deleteById = <T extends { id: ID }>(list: T[], id: ID): T[] =>
      list.filter((x) => x.id !== id);

    const upsertMember = (m: Member) => {
      if (!canWrite) return;
      setState((prev) => ({
        ...prev,
        entities: {
          ...prev.entities,
          members: upsertById(prev.entities.members, m)
        }
      }));
    };

    const deleteMember = (id: ID) => {
      if (!canWrite) return;
      setState((prev) => ({
        ...prev,
        entities: {
          ...prev.entities,
          members: deleteById(prev.entities.members, id)
        }
      }));
    };

    const upsertMeeting = (m: Meeting) => {
      if (!canWrite) return;
      const t = now();
      setState((prev) => {
        const exists = prev.entities.meetings.some((x) => x.id === m.id);
        const next: Meeting = {
          ...m,
          createdAt: exists ? m.createdAt : t,
          updatedAt: t
        };
        return {
          ...prev,
          entities: {
            ...prev.entities,
            meetings: upsertById(prev.entities.meetings, next)
          }
        };
      });
    };

    const deleteMeeting = (id: ID) => {
      if (!canWrite) return;
      setState((prev) => ({
        ...prev,
        entities: {
          ...prev.entities,
          meetings: deleteById(prev.entities.meetings, id)
        }
      }));
    };

    const upsertProposal = (p: Proposal) => {
      if (!canWrite) return;
      const t = now();
      setState((prev) => {
        const exists = prev.entities.proposals.some((x) => x.id === p.id);
        const next: Proposal = {
          ...p,
          createdAt: exists ? p.createdAt : t,
          updatedAt: t
        };
        return {
          ...prev,
          entities: {
            ...prev.entities,
            proposals: upsertById(prev.entities.proposals, next)
          }
        };
      });
    };

    const deleteProposal = (id: ID) => {
      if (!canWrite) return;
      setState((prev) => ({
        ...prev,
        entities: {
          ...prev.entities,
          proposals: deleteById(prev.entities.proposals, id)
        }
      }));
    };

    const upsertEvent = (e: EventItem) => {
      if (!canWrite) return;
      const t = now();
      setState((prev) => {
        const exists = prev.entities.events.some((x) => x.id === e.id);
        const next: EventItem = {
          ...e,
          createdAt: exists ? e.createdAt : t,
          updatedAt: t
        };
        return {
          ...prev,
          entities: {
            ...prev.entities,
            events: upsertById(prev.entities.events, next)
          }
        };
      });
    };

    const deleteEvent = (id: ID) => {
      if (!canWrite) return;
      setState((prev) => ({
        ...prev,
        entities: {
          ...prev.entities,
          events: deleteById(prev.entities.events, id)
        }
      }));
    };

    const upsertDocument = (d: DocumentItem) => {
      if (!canWrite) return;
      const t = now();
      setState((prev) => {
        const exists = prev.entities.documents.some((x) => x.id === d.id);
        const next: DocumentItem = {
          ...d,
          createdAt: exists ? d.createdAt : t,
          updatedAt: t
        };
        return {
          ...prev,
          entities: {
            ...prev.entities,
            documents: upsertById(prev.entities.documents, next)
          }
        };
      });
    };

    const deleteDocument = (id: ID) => {
      if (!canWrite) return;
      setState((prev) => ({
        ...prev,
        entities: {
          ...prev.entities,
          documents: deleteById(prev.entities.documents, id)
        }
      }));
    };

    const upsertTemplate = (t: EmailTemplate) => {
      if (!canWrite) return;
      const at = now();
      setState((prev) => {
        const exists = prev.entities.emailTemplates.some((x) => x.id === t.id);
        const next: EmailTemplate = {
          ...t,
          createdAt: exists ? t.createdAt : at,
          updatedAt: at
        };
        return {
          ...prev,
          entities: {
            ...prev.entities,
            emailTemplates: upsertById(prev.entities.emailTemplates, next)
          }
        };
      });
    };

    const deleteTemplate = (id: ID) => {
      if (!canWrite) return;
      setState((prev) => ({
        ...prev,
        entities: {
          ...prev.entities,
          emailTemplates: deleteById(prev.entities.emailTemplates, id)
        }
      }));
    };

    const upsertAnnouncement = (a: Announcement) => {
      if (!canWrite) return;
      const at = now();
      setState((prev) => {
        const exists = prev.entities.announcements.some((x) => x.id === a.id);
        const next: Announcement = {
          ...a,
          createdAt: exists ? a.createdAt : at,
          updatedAt: at
        };
        return {
          ...prev,
          entities: {
            ...prev.entities,
            announcements: upsertById(prev.entities.announcements, next)
          }
        };
      });
    };

    const deleteAnnouncement = (id: ID) => {
      if (!canWrite) return;
      setState((prev) => ({
        ...prev,
        entities: {
          ...prev.entities,
          announcements: deleteById(prev.entities.announcements, id)
        }
      }));
    };

    return {
      setSettings,
      importStateJson,
      exportStateJson,
      resetAll,
      upsertMember,
      deleteMember,
      upsertMeeting,
      deleteMeeting,
      upsertProposal,
      deleteProposal,
      upsertEvent,
      deleteEvent,
      upsertDocument,
      deleteDocument,
      upsertTemplate,
      deleteTemplate,
      upsertAnnouncement,
      deleteAnnouncement
    };
  }, [canWrite, state]);

  const value = useMemo<AppStore>(() => ({ state, actions }), [state, actions]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppStore(): AppStore {
  const v = useContext(Ctx);
  if (!v) throw new Error('AppStoreProvider fehlt');
  return v;
}
