import crossws from 'crossws/adapters/node';
import { Hocuspocus } from '@hocuspocus/server';
import * as Y from 'yjs';
import * as decoding from 'lib0/decoding';
import { getSchema } from '@tiptap/core';
import { MarkdownManager } from '@tiptap/markdown';
import { prosemirrorJSONToYXmlFragment, yXmlFragmentToProsemirrorJSON } from '@tiptap/y-tiptap';
import { documentExtensions } from '../src/extensions.ts';
import { normalize, SHARED_SETTINGS } from '../src/document.ts';

const UUID = /^[a-f0-9-]{36}$/;
// Live edits bypass the REST quota, so one note's shared state is capped instead.
export const NOTE_LIMIT = 50_000_000;
const reset = connection => connection.webSocket.close(4205, 'Reset Connection');
// True for messages that would change the document (sync step 2 or update), false for
// reads and presence. Unparseable messages count as writes.
function writes(message) {
  try {
    const decoder = decoding.createDecoder(message);
    decoding.readVarString(decoder);
    const type = decoding.readVarUint(decoder);
    return (type === 0 || type === 4) && decoding.readVarUint(decoder) !== 0;
  } catch { return true; }
}
// The same schema as the editor, so server-side conversion matches what clients render.
const extensions = documentExtensions();
const schema = getSchema(extensions);
const markdown = new MarkdownManager({ extensions });

function validContent(value) {
  try { schema.nodeFromJSON(value).check(); return true; } catch { return false; }
}

// Converts a stored JSON note into its first Yjs state. Runs once per note, on the server,
// so two people opening a note for the first time cannot both insert the same content.
export function seedDocument(ydoc, value) {
  const d = normalize(value);
  let content = d.content && validContent(d.content) ? d.content : undefined;
  if (!content) {
    try { content = markdown.parse(d.markdown); } catch { content = undefined; }
    if (!content || !validContent(content)) content = { type: 'doc', content: [{ type: 'paragraph' }] };
  }
  ydoc.transact(() => {
    prosemirrorJSONToYXmlFragment(schema, content, ydoc.getXmlFragment('default'));
    ydoc.getMap('meta').set('title', d.title);
    const settings = ydoc.getMap('settings');
    for (const key of SHARED_SETTINGS) settings.set(key, d.settings[key]);
  });
}

// The JSON snapshot kept beside the Yjs state powers the note list, exports, backups, and quotas.
export function snapshot(ydoc, previous) {
  const base = normalize(previous);
  const content = yXmlFragmentToProsemirrorJSON(ydoc.getXmlFragment('default'));
  const title = ydoc.getMap('meta').get('title');
  const shared = ydoc.getMap('settings');
  const settings = { ...base.settings };
  for (const key of SHARED_SETTINGS) if (shared.get(key) !== undefined) settings[key] = shared.get(key);
  let text = '';
  try { text = markdown.serialize(content); } catch { text = base.markdown; }
  return normalize({ version: 1, title: typeof title === 'string' ? title.slice(0, 200) : base.title, markdown: text, content, settings, updatedAt: Date.now() });
}

export function createCollab({ db, userFromCookie, roleFor, stored = () => {}, noteLimit = NOTE_LIMIT }) {
  const sizes = new Map();
  const hocuspocus = new Hocuspocus({
    name: 'paperdown',
    quiet: true,
    debounce: 1500,
    maxDebounce: 10_000,
    async onAuthenticate({ requestHeaders, documentName, connectionConfig }) {
      if (!UUID.test(documentName)) throw null;
      const user = userFromCookie(requestHeaders.get('cookie') || '');
      const role = user ? roleFor(documentName, user.id) : null;
      if (!role) throw null; // an empty rejection denies access without logging
      // Viewers receive updates and share presence, but the server drops their edits.
      connectionConfig.readOnly = role === 'viewer';
      return { userId: user.id, session: user.session, role };
    },
    // Access can change while a document is loading; re-check once the connection is live.
    async connected({ connection, documentName, context }) {
      const role = roleFor(documentName, context.userId);
      if (!role || (role === 'viewer') !== connection.readOnly) reset(connection);
    },
    async beforeHandleMessage({ documentName, update }) {
      if ((sizes.get(documentName) || 0) > noteLimit && writes(update)) throw Object.assign(new Error('note-too-large'), { reason: 'note-too-large' });
    },
    async onChange({ documentName, update }) {
      sizes.set(documentName, (sizes.get(documentName) || 0) + update.length);
    },
    async afterUnloadDocument({ documentName }) {
      sizes.delete(documentName);
    },
    async onLoadDocument({ documentName, document }) {
      const row = db.prepare('SELECT ydoc,document FROM notes WHERE id=? AND deleted IS NULL').get(documentName);
      if (!row) throw new Error('not-found');
      if (row.ydoc) Y.applyUpdate(document, row.ydoc);
      else {
        seedDocument(document, JSON.parse(row.document));
        // The pre-live JSON is kept once, in case conversion ever needs to be checked or redone.
        db.prepare('UPDATE notes SET ydoc=?,legacy=document WHERE id=? AND ydoc IS NULL').run(Y.encodeStateAsUpdate(document), documentName);
      }
      sizes.set(documentName, Y.encodeStateAsUpdate(document).length);
      return document;
    },
    async onStoreDocument({ documentName, document }) {
      const row = db.prepare('SELECT document FROM notes WHERE id=? AND deleted IS NULL').get(documentName);
      if (!row) return;
      const state = Y.encodeStateAsUpdate(document);
      sizes.set(documentName, state.length);
      let d;
      try { d = snapshot(document, JSON.parse(row.document)); }
      catch (e) {
        // Keep persisting the live state even if a malformed tree cannot be turned into JSON.
        console.error('Paperdown snapshot failed:', documentName, e?.message);
        db.prepare('UPDATE notes SET ydoc=? WHERE id=? AND deleted IS NULL').run(state, documentName);
        return;
      }
      db.prepare('UPDATE notes SET ydoc=?,document=?,title=?,revision=revision+1,updated=? WHERE id=? AND deleted IS NULL')
        .run(state, JSON.stringify(d), d.title, d.updatedAt, documentName);
      stored(documentName, d);
    },
  });
  const ws = crossws({
    serverOptions: { maxPayload: 16 * 1024 * 1024 },
    hooks: {
      open(peer) {
        const connection = hocuspocus.handleConnection(peer.websocket, peer.request);
        peer._hocuspocus = connection;
        peer.websocket.on?.('pong', () => connection.touch());
      },
      message(peer, message) { peer._hocuspocus?.handleMessage(message.uint8Array()); },
      close(peer, event) { peer._hocuspocus?.handleClose({ code: event.code, reason: event.reason }); },
      error(_peer, error) { console.error('Paperdown collaboration socket failed:', error?.message || error); },
    },
  });
  return {
    handleUpgrade: (req, socket, head) => ws.handleUpgrade(req, socket, head),
    // Closing the sockets makes clients reconnect and authenticate again, which applies
    // role changes and removals. (A document-level close leaves clients idle instead.)
    reconnect(name) {
      for (const connection of hocuspocus.documents.get(name)?.getConnections() || []) reset(connection);
    },
    // A logged-out session must not keep editing through an open socket.
    endSession(session) {
      for (const document of hocuspocus.documents.values()) for (const connection of document.getConnections()) if (connection.context?.session === session) reset(connection);
    },
    async close() {
      const settle = () => new Promise(resolve => setTimeout(resolve, 100));
      hocuspocus.flushPendingStores();
      await settle();
      hocuspocus.closeConnections();
      ws.closeAll(1001, 'shutdown', true);
      // Closing the last connection can run one more store; let it finish before the database closes.
      await settle();
    },
  };
}
