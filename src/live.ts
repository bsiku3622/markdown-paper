import { useEffect, useState } from "react";
import * as Y from "yjs";
import { HocuspocusProvider } from "@hocuspocus/provider";
import { IndexeddbPersistence } from "y-indexeddb";
import { Extension } from "@tiptap/core";
import { Plugin } from "@tiptap/pm/state";
import { isChangeOrigin } from "@tiptap/extension-collaboration";
import { COLLAB_URL } from "./cloud";

// StarterKit's trailing paragraph also reacts to remote changes, so every open copy would
// append its own blank paragraph. Only the person whose edit ended the note adds one.
export const LiveTrailingNode = Extension.create({
  name: "liveTrailingNode",
  addProseMirrorPlugins() {
    return [
      new Plugin({
        appendTransaction: (transactions, _, state) => {
          if (!transactions.some((tr) => tr.docChanged) || transactions.some((tr) => isChangeOrigin(tr))) return;
          if (state.doc.lastChild?.type.name === "paragraph") return;
          return state.tr.insert(state.doc.content.size, state.schema.nodes.paragraph.create());
        },
      }),
    ];
  },
});

const COLORS = ["#c80020", "#1c55d4", "#00763d", "#8d5300", "#7a2fbf", "#c2410c", "#0e7490", "#be185d"];
export function userColor(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return COLORS[h % COLORS.length];
}

export type LiveSession = {
  ydoc: Y.Doc;
  provider: HocuspocusProvider;
  local: IndexeddbPersistence;
  destroy: () => void;
};
export function openSession(noteId: string, userId: string): LiveSession {
  const ydoc = new Y.Doc();
  // Unsynced edits survive a closed tab and merge when the note reconnects.
  const local = new IndexeddbPersistence(`paperdown-live:${userId}:${noteId}`, ydoc);
  // The session cookie authenticates the socket; no token travels in the page.
  const provider = new HocuspocusProvider({ url: COLLAB_URL, name: noteId, document: ydoc });
  return {
    ydoc,
    provider,
    local,
    destroy() {
      provider.destroy();
      void local.destroy();
      ydoc.destroy();
    },
  };
}

export type LiveStatus = { connected: boolean; synced: boolean; unsynced: number; denied: boolean };
export function useLiveStatus(session: LiveSession | undefined): LiveStatus {
  const [state, setState] = useState<LiveStatus>({ connected: false, synced: false, unsynced: 0, denied: false });
  useEffect(() => {
    if (!session) return;
    const { provider } = session;
    const update = () =>
      setState((s) => ({
        ...s,
        connected: provider.configuration.websocketProvider.status === "connected",
        synced: provider.isSynced,
        unsynced: provider.unsyncedChanges,
      }));
    const denied = () => setState((s) => ({ ...s, denied: true }));
    const allowed = () => setState((s) => ({ ...s, denied: false }));
    provider.on("status", update);
    provider.on("synced", update);
    provider.on("unsyncedChanges", update);
    provider.on("authenticationFailed", denied);
    provider.on("authenticated", allowed);
    update();
    return () => {
      provider.off("status", update);
      provider.off("synced", update);
      provider.off("unsyncedChanges", update);
      provider.off("authenticationFailed", denied);
      provider.off("authenticated", allowed);
    };
  }, [session]);
  return state;
}

// User IDs of the other people currently in the note, from shared presence.
export function useOnline(session: LiveSession | undefined, me: string) {
  const [ids, setIds] = useState<string[]>([]);
  useEffect(() => {
    const awareness = session?.provider.awareness;
    if (!awareness) return;
    const update = () =>
      setIds([...new Set([...awareness.getStates().values()].map((s) => s.user?.id).filter((id): id is string => typeof id === "string" && id !== me))]);
    awareness.on("change", update);
    update();
    return () => awareness.off("change", update);
  }, [session, me]);
  return ids;
}
