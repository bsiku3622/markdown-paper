import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomUUID, createHash, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { googleKeys, verifyGoogleToken } from './google.mjs';
import { createCollab } from './collab.mjs';

const derive = promisify(scrypt);
const hash = value => createHash('sha256').update(value).digest('hex');
const sessionMs = 30 * 86400_000;
const UUID = '[a-f0-9-]{36}';
class Failure extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = (status, message) => { throw new Failure(status, message); };
const USERNAME = /^[a-z0-9][a-z0-9_.-]{2,31}$/;
function documentValue(d) {
  if (!d || typeof d !== 'object' || d.version !== 1 || typeof d.title !== 'string' || typeof d.markdown !== 'string' || !d.settings || typeof d.settings !== 'object') fail(400, '올바른 문서가 아닙니다.');
  if (d.title.length > 200) fail(400, '문서 이름은 200자 이내로 입력해주세요.');
  if (d.content && d.content.type !== 'doc') fail(400, '문서 내용을 확인해주세요.');
  return d;
}
function nicknameValue(value) {
  const nickname = typeof value === 'string' ? value.normalize('NFC').trim() : '';
  if (!nickname || Array.from(nickname).length > 30 || /[\p{Cc}\p{Cf}]/u.test(nickname)) fail(400, '닉네임은 1~30자로 입력해주세요.');
  return nickname;
}
async function body(req, limit = 20_000_000) {
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > limit) fail(413, '파일 또는 문서가 너무 큽니다.');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}
async function jsonBody(req, limit) {
  if (req.headers['content-type']?.split(';')[0] !== 'application/json') fail(415, 'JSON 요청이 필요합니다.');
  try { return JSON.parse((await body(req, limit)).toString()); }
  catch (e) { if (e instanceof Failure) throw e; fail(400, '요청 형식이 올바르지 않습니다.'); }
}
function imageMime(data) {
  if (data.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png';
  if (data[0] === 255 && data[1] === 216 && data[2] === 255) return 'image/jpeg';
  if (['GIF87a','GIF89a'].includes(data.subarray(0,6).toString())) return 'image/gif';
  if (data.subarray(0,4).toString() === 'RIFF' && data.subarray(8,12).toString() === 'WEBP') return 'image/webp';
  fail(415, 'PNG, JPEG, GIF, WebP 이미지만 올려주세요.');
}
export function createApi({ dataDir, origins = ['https://paperdown.bsiku.dev'], secure = true, publicUrl = 'https://paperdown-api.bsiku.dev', trustProxy = false, googleClientId = '', googleKeySource = googleKeys() } = {}) {
  mkdirSync(join(dataDir, 'files'), { recursive: true, mode: 0o700 });
  mkdirSync(join(dataDir, 'avatars'), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(join(dataDir, 'paperdown.sqlite'));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, created INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS notes(id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, document TEXT NOT NULL, title TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1, updated INTEGER NOT NULL, deleted INTEGER);
    CREATE INDEX IF NOT EXISTS notes_owner ON notes(user_id,deleted,updated);
    CREATE TABLE IF NOT EXISTS files(id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, mime TEXT NOT NULL, size INTEGER NOT NULL, created INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires);`);
  // Additive migrations: existing accounts, notes, and files keep working unchanged.
  const addColumn = (table, column, type) => {
    if (!db.prepare(`PRAGMA table_info(${table})`).all().some(c => c.name === column)) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
  };
  addColumn('users', 'nickname', 'TEXT');
  addColumn('users', 'avatar', 'TEXT');
  addColumn('users', 'avatar_mime', 'TEXT');
  addColumn('users', 'avatar_url', 'TEXT');
  addColumn('users', 'google_sub', 'TEXT');
  addColumn('notes', 'ydoc', 'BLOB');
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS users_google ON users(google_sub) WHERE google_sub IS NOT NULL;
    CREATE TABLE IF NOT EXISTS note_members(note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, role TEXT NOT NULL CHECK(role IN ('editor','viewer')), added INTEGER NOT NULL, PRIMARY KEY(note_id,user_id));
    CREATE INDEX IF NOT EXISTS note_members_user ON note_members(user_id);
    CREATE TABLE IF NOT EXISTS note_files(note_id TEXT NOT NULL REFERENCES notes(id) ON DELETE CASCADE, file_id TEXT NOT NULL REFERENCES files(id) ON DELETE CASCADE, PRIMARY KEY(note_id,file_id));
    CREATE INDEX IF NOT EXISTS note_files_file ON note_files(file_id);`);
  const cookieName = secure ? '__Host-paperdown' : 'paperdown-session';
  const cookie = (value, age) => `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${secure ? '; Secure' : ''}`;
  const tokenFromCookie = header => (header || '').split(';').map(s => s.trim()).find(s => s.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  const avatarUrl = user => user.avatar ? `${publicUrl}/avatars/${user.id}?v=${user.avatar}` : user.avatar_url || null;
  const publicView = user => ({ id: user.id, username: user.username, nickname: user.nickname || user.username, avatar: avatarUrl(user) });
  const userView = user => ({ ...publicView(user), google: !!user.google_sub, hasPassword: !!user.password });
  const rate = new Map();
  function limit(req, prefix, max, interval = 15 * 60_000) {
    const ip = trustProxy ? req.headers['cf-connecting-ip'] || req.socket.remoteAddress : req.socket.remoteAddress;
    const key = `${prefix}:${ip}`; const now = Date.now();
    if (rate.size > 10000) for (const [key, entry] of rate) if (entry.until < now) rate.delete(key);
    let entry = rate.get(key);
    if (!entry || entry.until < now) { entry = { count:0, until:now+interval }; rate.set(key,entry); }
    if (++entry.count > max) fail(429, '요청이 많습니다. 잠시 후 다시 시도해주세요.');
  }
  function sessionUser(cookieHeader) {
    const token = tokenFromCookie(cookieHeader);
    return token ? db.prepare('SELECT users.* FROM sessions JOIN users ON users.id=sessions.user_id WHERE token=? AND expires>?').get(hash(token), Date.now()) : undefined;
  }
  function auth(req) {
    const user = sessionUser(req.headers.cookie);
    if (!user) fail(401, '로그인이 필요합니다.');
    return user;
  }
  function startSession(res, user) {
    db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());
    const token = randomBytes(32).toString('base64url');
    db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash(token),user.id,Date.now()+sessionMs);
    res.setHeader('Set-Cookie',cookie(token,sessionMs/1000));
  }
  // owner, editor, viewer, or null. A deleted note grants nothing.
  function roleFor(noteId, userId) {
    const row = db.prepare('SELECT n.user_id AS owner,m.role FROM notes n LEFT JOIN note_members m ON m.note_id=n.id AND m.user_id=? WHERE n.id=? AND n.deleted IS NULL').get(userId, noteId);
    return !row ? null : row.owner === userId ? 'owner' : row.role || null;
  }
  function noteQuota(owner, document, excluded = '') {
    const used = db.prepare('SELECT coalesce(sum(length(CAST(document AS BLOB))),0) AS n FROM notes WHERE user_id=? AND id!=?').get(owner,excluded).n;
    if (used + Buffer.byteLength(JSON.stringify(document)) > 100_000_000) fail(413,'노트 저장 공간(100MB)이 부족합니다. 이미지는 업로드 기능을 사용해주세요.');
  }
  // Images uploaded by the owner or a member become readable to everyone on the note.
  function linkFiles(noteId, document) {
    const ids = new Set(Array.from(JSON.stringify(document.content || {}).matchAll(new RegExp(`/files/(${UUID})`, 'g')), m => m[1]));
    const link = db.prepare(`INSERT OR IGNORE INTO note_files(note_id,file_id) SELECT n.id,f.id FROM notes n JOIN files f ON f.id=?
      WHERE n.id=? AND (f.user_id=n.user_id OR f.user_id IN (SELECT user_id FROM note_members WHERE note_id=n.id))`);
    for (const id of ids) link.run(id, noteId);
  }
  function members(noteId) {
    return db.prepare('SELECT users.*,m.role FROM note_members m JOIN users ON users.id=m.user_id WHERE m.note_id=? ORDER BY m.added').all(noteId).map(u => ({ ...publicView(u), role: u.role }));
  }
  const collab = createCollab({ db, userFromCookie: sessionUser, roleFor, stored: linkFiles });
  const server = createServer(async (req,res) => {
    res.setHeader('Cache-Control','private, no-store');
    res.setHeader('X-Content-Type-Options','nosniff');
    const origin = req.headers.origin;
    if (origin && origins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin',origin);
      res.setHeader('Access-Control-Allow-Credentials','true');
      res.setHeader('Vary','Origin');
    }
    const send = (status,value) => { res.writeHead(status, {'Content-Type':'application/json; charset=utf-8'}); res.end(JSON.stringify(value)); };
    try {
      const url = new URL(req.url, 'http://localhost');
      const path = url.pathname;
      const method = req.method;
      if (origin && !origins.includes(origin)) fail(403,'허용되지 않은 요청입니다.');
      if (method === 'OPTIONS') {
        if (!origin) fail(403,'허용되지 않은 요청입니다.');
        res.writeHead(204,{'Access-Control-Allow-Methods':'GET,POST,PUT,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600'}); res.end(); return;
      }
      if (!['GET','HEAD'].includes(method) && !origins.includes(origin)) fail(403,'요청 출처를 확인하지 못했습니다.');
      if (path === '/health' && method === 'GET') { db.prepare('SELECT 1').get(); return send(200,{ok:true}); }
      limit(req,'api',600,60_000);
      if (path === '/auth/config' && method === 'GET') return send(200,{google:googleClientId || null});
      if (path === '/exports/pdf' && method === 'POST') {
        limit(req,'pdf',12,60_000);
        const input = await jsonBody(req,45_000_000);
        const {validatePdf,renderPdf} = await import('./pdf.mjs');
        try {validatePdf(input);} catch(e) {fail(400,e.message);}
        let bytes;
        try {bytes = await renderPdf(input);} catch(e) {console.error('PDF export failed:',e.message);fail(e.status || 503,e.status?e.message:'PDF를 만들지 못했습니다. 잠시 후 다시 시도해주세요.');}
        res.writeHead(200,{'Content-Type':'application/pdf','Content-Disposition':"attachment; filename=paperdown.pdf"});res.end(bytes);return;
      }
      if (['/auth/register','/auth/login'].includes(path) && method === 'POST') {
        limit(req,'auth',30);
        if (path.endsWith('register')) limit(req,'register',10,3600_000);
        const {username:raw,password} = await jsonBody(req,4096);
        const username = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
        if (!USERNAME.test(username)) fail(400,'아이디는 영문·숫자·._- 조합으로 3~32자입니다.');
        if (typeof password !== 'string' || password.length < 10 || Buffer.byteLength(password) > 256) fail(400,'비밀번호는 10자 이상, 256바이트 이하로 입력해주세요.');
        let user = db.prepare('SELECT * FROM users WHERE username=?').get(username);
        const options = {N:32768,r:8,p:1,maxmem:64*1024*1024};
        if (path.endsWith('register')) {
          if (user) fail(409,'이미 사용 중인 아이디입니다.');
          const salt = randomBytes(16).toString('hex');
          const key = await derive(password,salt,64,options);
          const id = randomUUID();
          try { db.prepare('INSERT INTO users(id,username,password,created) VALUES(?,?,?,?)').run(id,username,`${salt}:${key.toString('hex')}`,Date.now()); }
          catch(e) { if (e.message.includes('UNIQUE')) fail(409,'이미 사용 중인 아이디입니다.'); throw e; }
          user = db.prepare('SELECT * FROM users WHERE id=?').get(id);
        } else {
          // Google-only accounts have no password; they compare against the same dummy hash.
          const [salt,stored] = (user?.password || `${'0'.repeat(32)}:${'0'.repeat(128)}`).split(':');
          const key = await derive(password,salt,64,options);
          if (!user?.password || !timingSafeEqual(key,Buffer.from(stored,'hex'))) fail(401,'아이디 또는 비밀번호가 맞지 않습니다.');
        }
        startSession(res,user);
        return send(200,{user:userView(user)});
      }
      if (path === '/auth/google' && method === 'POST') {
        limit(req,'auth',30);
        if (!googleClientId) fail(404,'Google 로그인이 설정되지 않았습니다.');
        const input = await jsonBody(req,8192);
        const google = await verifyGoogleToken(input.credential,{clientId:googleClientId,keys:googleKeySource}).catch(() => null);
        if (!google) fail(401,'Google 계정을 확인하지 못했습니다. 다시 시도해주세요.');
        let user = db.prepare('SELECT * FROM users WHERE google_sub=?').get(google.sub);
        if (!user) {
          // First Google sign-in: the client confirms a username before an account exists.
          if (input.username === undefined) {
            const base = (google.email.split('@')[0] || '').toLowerCase().replace(/[^a-z0-9_.-]/g,'').replace(/^[^a-z0-9]+/,'').slice(0,24);
            let suggestion = base.length >= 3 ? base : `writer${randomBytes(2).toString('hex')}`;
            for (let i = 2; db.prepare('SELECT 1 FROM users WHERE username=?').get(suggestion); i++) suggestion = `${base.slice(0,24) || 'writer'}${i}`;
            return send(200,{signup:{username:suggestion,nickname:google.name.slice(0,30)}});
          }
          limit(req,'register',10,3600_000);
          const username = typeof input.username === 'string' ? input.username.trim().toLowerCase() : '';
          if (!USERNAME.test(username)) fail(400,'아이디는 영문·숫자·._- 조합으로 3~32자입니다.');
          const nickname = input.nickname ? nicknameValue(input.nickname) : null;
          const picture = /^https:\/\/lh3\.googleusercontent\.com\/[\w\-./=~%]+$/.test(google.picture) ? google.picture : null;
          const id = randomUUID();
          try { db.prepare('INSERT INTO users(id,username,password,created,nickname,avatar_url,google_sub) VALUES(?,?,?,?,?,?,?)').run(id,username,'',Date.now(),nickname,picture,google.sub); }
          catch(e) { if (e.message.includes('UNIQUE')) fail(409,'이미 사용 중인 아이디입니다.'); throw e; }
          user = db.prepare('SELECT * FROM users WHERE id=?').get(id);
        }
        startSession(res,user);
        return send(200,{user:userView(user)});
      }
      if (path === '/auth/logout' && method === 'POST') {
        const token = tokenFromCookie(req.headers.cookie); if (token) db.prepare('DELETE FROM sessions WHERE token=?').run(hash(token));
        res.setHeader('Set-Cookie',cookie('',0)); return send(200,{ok:true});
      }
      const user = auth(req);
      if (path === '/auth/me' && method === 'GET') return send(200,{user:userView(user)});
      if (path === '/me' && method === 'PUT') {
        const input = await jsonBody(req,4096);
        db.prepare('UPDATE users SET nickname=? WHERE id=?').run(nicknameValue(input.nickname),user.id);
        return send(200,{user:userView(db.prepare('SELECT * FROM users WHERE id=?').get(user.id))});
      }
      if (path === '/me/avatar' && method === 'PUT') {
        limit(req,'avatar',30,3600_000);
        const bytes = await body(req,2_000_000); const mime = imageMime(bytes);
        writeFileSync(join(dataDir,'avatars',user.id),bytes,{mode:0o600});
        db.prepare('UPDATE users SET avatar=?,avatar_mime=? WHERE id=?').run(randomBytes(6).toString('hex'),mime,user.id);
        return send(200,{user:userView(db.prepare('SELECT * FROM users WHERE id=?').get(user.id))});
      }
      if (path === '/me/avatar' && method === 'DELETE') {
        rmSync(join(dataDir,'avatars',user.id),{force:true});
        db.prepare('UPDATE users SET avatar=NULL,avatar_mime=NULL,avatar_url=NULL WHERE id=?').run(user.id);
        return send(200,{user:userView(db.prepare('SELECT * FROM users WHERE id=?').get(user.id))});
      }
      if (path === '/me/google' && method === 'POST') {
        limit(req,'auth',30);
        if (!googleClientId) fail(404,'Google 로그인이 설정되지 않았습니다.');
        const google = await verifyGoogleToken((await jsonBody(req,8192)).credential,{clientId:googleClientId,keys:googleKeySource}).catch(() => null);
        if (!google) fail(401,'Google 계정을 확인하지 못했습니다. 다시 시도해주세요.');
        const linked = db.prepare('SELECT id FROM users WHERE google_sub=?').get(google.sub);
        if (linked && linked.id !== user.id) fail(409,'이 Google 계정은 다른 Paperdown 계정에 연결되어 있습니다.');
        db.prepare('UPDATE users SET google_sub=? WHERE id=?').run(google.sub,user.id);
        return send(200,{user:userView(db.prepare('SELECT * FROM users WHERE id=?').get(user.id))});
      }
      if (path === '/me/google' && method === 'DELETE') {
        if (!user.password) fail(400,'비밀번호가 없는 계정은 Google 연결을 해제할 수 없습니다.');
        db.prepare('UPDATE users SET google_sub=NULL WHERE id=?').run(user.id);
        return send(200,{user:userView(db.prepare('SELECT * FROM users WHERE id=?').get(user.id))});
      }
      const avatarMatch = path.match(new RegExp(`^/avatars/(${UUID})$`));
      if (avatarMatch && method === 'GET') {
        const owner = db.prepare('SELECT id,avatar,avatar_mime FROM users WHERE id=?').get(avatarMatch[1]);
        if (!owner?.avatar) fail(404,'아바타가 없습니다.');
        const bytes = readFileSync(join(dataDir,'avatars',owner.id));
        res.writeHead(200,{'Content-Type':owner.avatar_mime,'Content-Length':bytes.length,'Cache-Control':'private, max-age=86400','Cross-Origin-Resource-Policy':'same-site'}); res.end(bytes); return;
      }
      if (path === '/notes' && method === 'GET') {
        const rows = db.prepare(`SELECT n.id,n.title,n.revision,n.updated AS updatedAt,n.user_id AS ownerId,m.role,
            EXISTS(SELECT 1 FROM note_members x WHERE x.note_id=n.id) AS shared
          FROM notes n LEFT JOIN note_members m ON m.note_id=n.id AND m.user_id=?
          WHERE n.deleted IS NULL AND (n.user_id=? OR m.user_id IS NOT NULL) ORDER BY n.updated DESC`).all(user.id,user.id);
        const owners = new Map();
        const ownerOf = id => { if (!owners.has(id)) owners.set(id,publicView(db.prepare('SELECT * FROM users WHERE id=?').get(id))); return owners.get(id); };
        return send(200,{notes:rows.map(({ownerId,role,shared,...note}) => ({...note,role:ownerId===user.id?'owner':role,shared:!!shared,...(ownerId===user.id?{}:{owner:ownerOf(ownerId)})}))});
      }
      if (path === '/notes' && method === 'POST') {
        const d = documentValue((await jsonBody(req)).document);
        if (db.prepare('SELECT count(*) AS n FROM notes WHERE user_id=? AND deleted IS NULL').get(user.id).n >= 1000) fail(400,'계정당 1,000개의 노트를 저장할 수 있습니다.'); noteQuota(user.id,d); const id = randomUUID(); const now = Date.now();
        db.prepare('INSERT INTO notes(id,user_id,document,title,updated) VALUES(?,?,?,?,?)').run(id,user.id,JSON.stringify(d),d.title,now);
        linkFiles(id,d);
        return send(201,{note:{id,document:d,title:d.title,revision:1,updatedAt:now,role:'owner',shared:false}});
      }
      const memberMatch = path.match(new RegExp(`^/notes/(${UUID})/members(?:/(${UUID}))?$`));
      if (memberMatch) {
        const [, id, memberId] = memberMatch;
        const role = roleFor(id,user.id);
        if (!role) fail(404,'노트를 찾을 수 없습니다.');
        if (!memberId && method === 'POST') {
          if (role !== 'owner') fail(403,'노트 주인만 공유할 수 있습니다.');
          limit(req,'share',120);
          const input = await jsonBody(req,4096);
          const target = db.prepare('SELECT * FROM users WHERE username=?').get(typeof input.username === 'string' ? input.username.trim().replace(/^@/,'').toLowerCase() : '');
          if (!target) fail(404,'그 아이디의 사용자를 찾을 수 없습니다.');
          if (target.id === user.id) fail(400,'노트 주인은 이미 편집할 수 있습니다.');
          if (!['editor','viewer'].includes(input.role)) fail(400,'권한을 선택해주세요.');
          if (db.prepare('SELECT count(*) AS n FROM note_members WHERE note_id=?').get(id).n >= 50) fail(400,'노트 하나에 50명까지 공유할 수 있습니다.');
          db.prepare('INSERT INTO note_members(note_id,user_id,role,added) VALUES(?,?,?,?) ON CONFLICT(note_id,user_id) DO UPDATE SET role=excluded.role').run(id,target.id,input.role,Date.now());
          collab.reconnect(id);
          return send(200,{members:members(id)});
        }
        if (memberId && method === 'PUT') {
          if (role !== 'owner') fail(403,'노트 주인만 권한을 바꿀 수 있습니다.');
          const input = await jsonBody(req,4096);
          if (!['editor','viewer'].includes(input.role)) fail(400,'권한을 선택해주세요.');
          if (!db.prepare('UPDATE note_members SET role=? WHERE note_id=? AND user_id=?').run(input.role,id,memberId).changes) fail(404,'공유 대상을 찾을 수 없습니다.');
          collab.reconnect(id);
          return send(200,{members:members(id)});
        }
        if (memberId && method === 'DELETE') {
          if (role !== 'owner' && memberId !== user.id) fail(403,'노트 주인만 공유를 해제할 수 있습니다.');
          db.prepare('DELETE FROM note_members WHERE note_id=? AND user_id=?').run(id,memberId);
          collab.reconnect(id);
          return send(200,{members:members(id)});
        }
      }
      const noteMatch = path.match(new RegExp(`^/notes/(${UUID})$`));
      if (noteMatch) {
        const id = noteMatch[1]; const role = roleFor(id,user.id);
        const note = role && db.prepare('SELECT * FROM notes WHERE id=? AND deleted IS NULL').get(id);
        if (!note) fail(404,'노트를 찾을 수 없습니다.');
        if (method === 'GET') return send(200,{note:{id,title:note.title,document:JSON.parse(note.document),revision:note.revision,updatedAt:note.updated,role,shared:!!db.prepare('SELECT 1 FROM note_members WHERE note_id=?').get(id),owner:publicView(db.prepare('SELECT * FROM users WHERE id=?').get(note.user_id)),members:members(id)}});
        if (method === 'PUT') {
          // Whole-document saves predate live editing; a note opened live is only saved through it.
          if (role !== 'owner') fail(404,'노트를 찾을 수 없습니다.');
          if (note.ydoc) fail(409,'이 노트는 실시간 편집으로 바뀌었습니다. 새로고침해주세요.');
          const input = await jsonBody(req); const d = documentValue(input.document); noteQuota(user.id,d,id);
          if (!Number.isSafeInteger(input.revision)) fail(400,'노트 버전이 필요합니다.');
          const now = Date.now();
          const result = db.prepare('UPDATE notes SET document=?,title=?,revision=revision+1,updated=? WHERE id=? AND user_id=? AND revision=? AND deleted IS NULL AND ydoc IS NULL').run(JSON.stringify(d),d.title,now,id,user.id,input.revision);
          if (!result.changes) fail(409,'다른 탭이나 기기에서 수정됐습니다. 로컬 초안을 보관했습니다.');
          linkFiles(id,d);
          return send(200,{revision:input.revision+1,updatedAt:now});
        }
        if (method === 'DELETE') {
          // Owners delete the note for everyone; members only leave it.
          if (role === 'owner') db.prepare('UPDATE notes SET deleted=? WHERE id=? AND user_id=?').run(Date.now(),id,user.id);
          else db.prepare('DELETE FROM note_members WHERE note_id=? AND user_id=?').run(id,user.id);
          collab.reconnect(id);
          return send(200,{ok:true});
        }
      }
      if (path === '/files' && method === 'POST') {
        limit(req,'upload',60,3600_000);
        const noteId = url.searchParams.get('note');
        if (noteId && !['owner','editor'].includes(roleFor(noteId,user.id))) fail(403,'이 노트에 이미지를 넣을 권한이 없습니다.');
        const bytes = await body(req,15_000_000); const mime = imageMime(bytes);
        const size = db.prepare('SELECT coalesce(sum(size),0) AS n FROM files WHERE user_id=?').get(user.id).n;
        if (size + bytes.length > 500_000_000) fail(413,'이미지 저장 공간이 부족합니다.');
        const id = randomUUID(); const directory = join(dataDir,'files',user.id);
        mkdirSync(directory,{recursive:true,mode:0o700});
        writeFileSync(join(directory,id),bytes,{mode:0o600,flag:'wx'});
        db.prepare('INSERT INTO files VALUES(?,?,?,?,?)').run(id,user.id,mime,bytes.length,Date.now());
        if (noteId) db.prepare('INSERT OR IGNORE INTO note_files(note_id,file_id) VALUES(?,?)').run(noteId,id);
        return send(201,{id,url:`${publicUrl}/files/${id}`});
      }
      const fileMatch = path.match(new RegExp(`^/files/(${UUID})$`));
      if (fileMatch && method === 'GET') {
        const file = db.prepare(`SELECT f.* FROM files f WHERE f.id=? AND (f.user_id=? OR EXISTS(
            SELECT 1 FROM note_files l JOIN notes n ON n.id=l.note_id LEFT JOIN note_members m ON m.note_id=n.id AND m.user_id=?
            WHERE l.file_id=f.id AND n.deleted IS NULL AND (n.user_id=? OR m.user_id IS NOT NULL)))`).get(fileMatch[1],user.id,user.id,user.id);
        if (!file) fail(404,'이미지를 찾을 수 없습니다.');
        const bytes = readFileSync(join(dataDir,'files',file.user_id,file.id));
        res.writeHead(200,{'Content-Type':file.mime,'Content-Length':bytes.length,'Cross-Origin-Resource-Policy':'same-site'}); res.end(bytes); return;
      }
      fail(404,'요청을 찾을 수 없습니다.');
    } catch(e) {
      if (!res.headersSent) send(e instanceof Failure ? e.status : 500,{error:e instanceof Failure ? e.message : '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'});
      else res.end();
      if (!(e instanceof Failure)) console.error('Paperdown request failed:',e.message);
    }
  });
  // Live editing shares the API origin; the cookie session and frontend origin are checked here.
  server.on('upgrade', (req, socket, head) => {
    try {
      if (new URL(req.url, 'http://localhost').pathname !== '/collab') fail(404,'not found');
      if (!origins.includes(req.headers.origin)) fail(403,'forbidden');
      limit(req,'collab',120,60_000);
      collab.handleUpgrade(req, socket, head).catch(() => socket.destroy());
    } catch(e) {
      socket.end(`HTTP/1.1 ${e instanceof Failure ? e.status : 400} Rejected\r\nConnection: close\r\nContent-Length: 0\r\n\r\n`);
    }
  });
  server.requestTimeout = 30_000;
  server.headersTimeout = 15_000;
  // Flush pending live edits before the database closes.
  let closing;
  server.shutdown = () => (closing ??= collab.close());
  server.on('close',()=>{ void server.shutdown().finally(()=>db.close()); });
  return server;
}
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const server = createApi({dataDir:process.env.DATA_DIR || './backend/data',origins:(process.env.ALLOWED_ORIGINS || 'https://paperdown.bsiku.dev').split(','),publicUrl:process.env.PUBLIC_URL || 'https://paperdown-api.bsiku.dev',secure:process.env.COOKIE_SECURE !== 'false',trustProxy:process.env.TRUST_PROXY === 'true',googleClientId:process.env.GOOGLE_CLIENT_ID || ''});
  server.listen(Number(process.env.PORT || 8792),'127.0.0.1',()=>console.log('Paperdown API listening on loopback'));
  for (const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>{ void server.shutdown().finally(()=>server.close(()=>process.exit(0))); });
}
