import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import * as Y from 'yjs';
import { HocuspocusProvider } from '@hocuspocus/provider';
import { createApi } from './server.mjs';

const origin = 'http://localhost:4325';
const until = async (check, ms = 5000) => {
  const end = Date.now() + ms;
  while (!(await check())) { if (Date.now() > end) throw new Error('timed out'); await new Promise(r => setTimeout(r, 25)); }
};
test('live notes: shared editing, read-only viewers, removal, and JSON snapshots', async () => {
  const dir = mkdtempSync(join(process.env.TEST_TMPDIR || tmpdir(), 'paperdown-collab-'));
  const app = createApi({ dataDir: dir, origins: [origin], secure: false, publicUrl: 'http://localhost' });
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
  const url = `http://127.0.0.1:${app.address().port}`;
  const providers = [];
  async function call(path, { method = 'GET', data, cookie } = {}) {
    const r = await fetch(url + path, { method, headers: { Origin: origin, ...(cookie ? { Cookie: cookie } : {}), ...(data ? { 'Content-Type': 'application/json' } : {}) }, body: data ? JSON.stringify(data) : undefined });
    return { status: r.status, cookie: r.headers.get('set-cookie')?.split(';')[0], data: await r.json() };
  }
  // Browsers send the session cookie and page origin with the upgrade request.
  function connect(name, cookie, from = origin) {
    const document = new Y.Doc();
    const events = { failed: false, synced: false };
    const WebSocketPolyfill = class extends WebSocket { constructor(target) { super(target, { headers: { cookie, origin: from } }); } };
    const provider = new HocuspocusProvider({ url: `${url.replace('http', 'ws')}/collab`, name, document, WebSocketPolyfill,
      onAuthenticationFailed: () => { events.failed = true; }, onSynced: () => { events.synced = true; } });
    providers.push(provider);
    return { document, provider, events };
  }
  const paragraph = text => { const p = new Y.XmlElement('paragraph'); const t = new Y.XmlText(); t.insert(0, text); p.insert(0, [t]); return p; };
  const text = document => JSON.stringify(document.getXmlFragment('default').toJSON());
  try {
    const [alpha, beta, gamma, delta] = await Promise.all(['alpha', 'beta', 'gamma', 'delta'].map(async name =>
      (await call('/auth/register', { method: 'POST', data: { username: name, password: `long password ${name}` } })).cookie));
    const made = await call('/notes', { method: 'POST', cookie: alpha, data: { document: { version: 1, title: '함께 쓰는 노트', markdown: '# 함께 쓰는 노트\n\n처음 문장', settings: { paper: 'a5', font: 'sans' }, updatedAt: 1 } } });
    const id = made.data.note.id;
    assert.equal((await call(`/notes/${id}/members`, { method: 'POST', cookie: beta, data: { username: 'gamma', role: 'editor' } })).status, 404);
    assert.equal((await call(`/notes/${id}/members`, { method: 'POST', cookie: alpha, data: { username: 'nobody', role: 'editor' } })).status, 404);
    assert.equal((await call(`/notes/${id}/members`, { method: 'POST', cookie: alpha, data: { username: '@beta', role: 'editor' } })).status, 200);
    const shared = await call(`/notes/${id}/members`, { method: 'POST', cookie: alpha, data: { username: 'gamma', role: 'viewer' } });
    assert.deepEqual(shared.data.members.map(m => [m.username, m.role]), [['beta', 'editor'], ['gamma', 'viewer']]);
    const listed = (await call('/notes', { cookie: beta })).data.notes;
    assert.equal(listed.length, 1);
    assert.equal(listed[0].role, 'editor');
    assert.equal(listed[0].owner.username, 'alpha');

    // The first connection seeds the live document from the stored JSON exactly once.
    const a = connect(id, alpha), b = connect(id, beta), g = connect(id, gamma);
    await until(() => a.events.synced && b.events.synced && g.events.synced);
    assert.match(text(a.document), /처음 문장/);
    assert.equal(text(a.document).match(/처음 문장/g).length, 1);
    assert.equal(b.document.getMap('meta').get('title'), '함께 쓰는 노트');
    assert.equal(b.document.getMap('settings').get('paper'), 'a5');

    b.document.getXmlFragment('default').push([paragraph('베타가 쓴 문장')]);
    b.document.getMap('settings').set('margin', 30);
    await until(() => text(a.document).includes('베타가 쓴 문장') && text(g.document).includes('베타가 쓴 문장'));
    assert.equal(a.document.getMap('settings').get('margin'), 30);

    // A viewer's local edit never reaches the server or other people.
    g.document.getXmlFragment('default').push([paragraph('보기 권한의 수정')]);
    await new Promise(r => setTimeout(r, 300));
    assert.ok(!text(a.document).includes('보기 권한의 수정'));

    // Strangers and foreign origins cannot join.
    const d = connect(id, delta);
    await until(() => d.events.failed);
    const rejected = await new Promise(resolve => { const ws = new WebSocket(`${url.replace('http', 'ws')}/collab`, { headers: { cookie: alpha, origin: 'https://evil.test' } }); ws.onerror = () => resolve(true); ws.onopen = () => resolve(false); });
    assert.ok(rejected);

    // Stored snapshots keep the note list, exports, and page settings current.
    await until(async () => (await call(`/notes/${id}`, { cookie: alpha })).data.note.document.markdown.includes('베타가 쓴 문장'), 8000);
    const stored = (await call(`/notes/${id}`, { cookie: gamma })).data.note;
    assert.equal(stored.role, 'viewer');
    assert.equal(stored.document.settings.margin, 30);
    assert.equal(stored.document.settings.font, 'myeongjo');
    assert.ok(!stored.document.markdown.includes('보기 권한의 수정'));
    assert.equal((await call(`/notes/${id}`, { method: 'PUT', cookie: alpha, data: { document: stored.document, revision: stored.revision } })).status, 409);

    // Removing a member disconnects them; reconnecting fails authentication.
    assert.equal((await call(`/notes/${id}/members/${shared.data.members[0].id}`, { method: 'DELETE', cookie: alpha })).status, 200);
    await until(() => b.events.failed, 8000);
    assert.equal((await call(`/notes/${id}`, { cookie: beta })).status, 404);
    // A viewer can leave on their own; owners delete for everyone.
    assert.equal((await call(`/notes/${id}`, { method: 'DELETE', cookie: gamma })).status, 200);
    assert.equal((await call('/notes', { cookie: gamma })).data.notes.length, 0);
    assert.equal((await call(`/notes/${id}`, { method: 'DELETE', cookie: alpha })).status, 200);
    assert.equal((await call('/notes', { cookie: alpha })).data.notes.length, 0);
  } finally {
    for (const provider of providers) provider.destroy();
    await new Promise(resolve => app.close(resolve));
  }
});
