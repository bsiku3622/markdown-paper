import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomUUID, createHash, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const derive = promisify(scrypt);
const hash = value => createHash('sha256').update(value).digest('hex');
const sessionMs = 30 * 86400_000;
class Failure extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
const fail = (status, message) => { throw new Failure(status, message); };
const userView = user => ({ id: user.id, username: user.username });
function documentValue(d) {
  if (!d || typeof d !== 'object' || d.version !== 1 || typeof d.title !== 'string' || typeof d.markdown !== 'string' || !d.settings || typeof d.settings !== 'object') fail(400, '올바른 문서가 아닙니다.');
  if (d.title.length > 200) fail(400, '문서 이름은 200자 이내로 입력해주세요.');
  if (d.content && d.content.type !== 'doc') fail(400, '문서 내용을 확인해주세요.');
  return d;
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
export function createApi({ dataDir, origins = ['https://paperdown.bsiku.dev'], secure = true, publicUrl = 'https://paperdown-api.bsiku.dev', trustProxy = false } = {}) {
  mkdirSync(join(dataDir, 'files'), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(join(dataDir, 'paperdown.sqlite'));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000;
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, created INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS notes(id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, document TEXT NOT NULL, title TEXT NOT NULL, revision INTEGER NOT NULL DEFAULT 1, updated INTEGER NOT NULL, deleted INTEGER);
    CREATE INDEX IF NOT EXISTS notes_owner ON notes(user_id,deleted,updated);
    CREATE TABLE IF NOT EXISTS files(id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, mime TEXT NOT NULL, size INTEGER NOT NULL, created INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires);`);
  const cookieName = secure ? '__Host-paperdown' : 'paperdown-session';
  const cookie = (value, age) => `${cookieName}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${age}${secure ? '; Secure' : ''}`;
  const tokenFrom = req => (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  const rate = new Map();
  function limit(req, prefix, max, interval = 15 * 60_000) {
    const ip = trustProxy ? req.headers['cf-connecting-ip'] || req.socket.remoteAddress : req.socket.remoteAddress;
    const key = `${prefix}:${ip}`; const now = Date.now();
    if (rate.size > 10000) for (const [key, entry] of rate) if (entry.until < now) rate.delete(key);
    let entry = rate.get(key);
    if (!entry || entry.until < now) { entry = { count:0, until:now+interval }; rate.set(key,entry); }
    if (++entry.count > max) fail(429, '요청이 많습니다. 잠시 후 다시 시도해주세요.');
  }
  function auth(req) {
    const token = tokenFrom(req);
    const user = token && db.prepare('SELECT users.id,users.username FROM sessions JOIN users ON users.id=sessions.user_id WHERE token=? AND expires>?').get(hash(token), Date.now());
    if (!user) fail(401, '로그인이 필요합니다.');
    return user;
  }
  function noteQuota(owner, document, excluded = '') {
    const used = db.prepare('SELECT coalesce(sum(length(CAST(document AS BLOB))),0) AS n FROM notes WHERE user_id=? AND id!=?').get(owner,excluded).n;
    if (used + Buffer.byteLength(JSON.stringify(document)) > 100_000_000) fail(413,'노트 저장 공간(100MB)이 부족합니다. 이미지는 업로드 기능을 사용해주세요.');
  }
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
      const path = new URL(req.url, 'http://localhost').pathname;
      const method = req.method;
      if (origin && !origins.includes(origin)) fail(403,'허용되지 않은 요청입니다.');
      if (method === 'OPTIONS') {
        if (!origin) fail(403,'허용되지 않은 요청입니다.');
        res.writeHead(204,{'Access-Control-Allow-Methods':'GET,POST,PUT,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600'}); res.end(); return;
      }
      if (!['GET','HEAD'].includes(method) && !origins.includes(origin)) fail(403,'요청 출처를 확인하지 못했습니다.');
      if (path === '/health' && method === 'GET') { db.prepare('SELECT 1').get(); return send(200,{ok:true}); }
      limit(req,'api',600,60_000);
      if (['/auth/register','/auth/login'].includes(path) && method === 'POST') {
        limit(req,'auth',30);
        if (path.endsWith('register')) limit(req,'register',10,3600_000);
        const {username:raw,password} = await jsonBody(req,4096);
        const username = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
        if (!/^[a-z0-9][a-z0-9_.-]{2,31}$/.test(username)) fail(400,'아이디는 영문·숫자·._- 조합으로 3~32자입니다.');
        if (typeof password !== 'string' || password.length < 10 || Buffer.byteLength(password) > 256) fail(400,'비밀번호는 10자 이상, 256바이트 이하로 입력해주세요.');
        let user = db.prepare('SELECT * FROM users WHERE username=?').get(username);
        const options = {N:32768,r:8,p:1,maxmem:64*1024*1024};
        if (path.endsWith('register')) {
          if (user) fail(409,'이미 사용 중인 아이디입니다.');
          const salt = randomBytes(16).toString('hex');
          const key = await derive(password,salt,64,options);
          const id = randomUUID();
          try { db.prepare('INSERT INTO users VALUES(?,?,?,?)').run(id,username,`${salt}:${key.toString('hex')}`,Date.now()); }
          catch(e) { if (e.message.includes('UNIQUE')) fail(409,'이미 사용 중인 아이디입니다.'); throw e; }
          user = {id,username};
        } else {
          const [salt,stored] = (user?.password || `${'0'.repeat(32)}:${'0'.repeat(128)}`).split(':');
          const key = await derive(password,salt,64,options);
          if (!user || !timingSafeEqual(key,Buffer.from(stored,'hex'))) fail(401,'아이디 또는 비밀번호가 맞지 않습니다.');
        }
        db.prepare('DELETE FROM sessions WHERE expires<?').run(Date.now());
        const token = randomBytes(32).toString('base64url');
        db.prepare('INSERT INTO sessions VALUES(?,?,?)').run(hash(token),user.id,Date.now()+sessionMs);
        res.setHeader('Set-Cookie',cookie(token,sessionMs/1000));
        return send(200,{user:userView(user)});
      }
      if (path === '/auth/logout' && method === 'POST') {
        const token = tokenFrom(req); if (token) db.prepare('DELETE FROM sessions WHERE token=?').run(hash(token));
        res.setHeader('Set-Cookie',cookie('',0)); return send(200,{ok:true});
      }
      const user = auth(req);
      if (path === '/auth/me' && method === 'GET') return send(200,{user:userView(user)});
      if (path === '/notes' && method === 'GET') return send(200,{notes:db.prepare('SELECT id,title,revision,updated AS updatedAt FROM notes WHERE user_id=? AND deleted IS NULL ORDER BY updated DESC').all(user.id)});
      if (path === '/notes' && method === 'POST') {
        const d = documentValue((await jsonBody(req)).document);
        if (db.prepare('SELECT count(*) AS n FROM notes WHERE user_id=? AND deleted IS NULL').get(user.id).n >= 1000) fail(400,'계정당 1,000개의 노트를 저장할 수 있습니다.'); noteQuota(user.id,d); const id = randomUUID(); const now = Date.now();
        db.prepare('INSERT INTO notes(id,user_id,document,title,updated) VALUES(?,?,?,?,?)').run(id,user.id,JSON.stringify(d),d.title,now);
        return send(201,{note:{id,document:d,title:d.title,revision:1,updatedAt:now}});
      }
      const noteMatch = path.match(/^\/notes\/([a-f0-9-]{36})$/);
      if (noteMatch) {
        const id = noteMatch[1]; const note = db.prepare('SELECT * FROM notes WHERE id=? AND user_id=? AND deleted IS NULL').get(id,user.id);
        if (!note) fail(404,'노트를 찾을 수 없습니다.');
        if (method === 'GET') return send(200,{note:{id,title:note.title,document:JSON.parse(note.document),revision:note.revision,updatedAt:note.updated}});
        if (method === 'PUT') {
          const input = await jsonBody(req); const d = documentValue(input.document); noteQuota(user.id,d,id);
          if (!Number.isSafeInteger(input.revision)) fail(400,'노트 버전이 필요합니다.');
          const now = Date.now();
          const result = db.prepare('UPDATE notes SET document=?,title=?,revision=revision+1,updated=? WHERE id=? AND user_id=? AND revision=? AND deleted IS NULL').run(JSON.stringify(d),d.title,now,id,user.id,input.revision);
          if (!result.changes) fail(409,'다른 탭이나 기기에서 수정됐습니다. 로컬 초안을 보관했습니다.');
          return send(200,{revision:input.revision+1,updatedAt:now});
        }
        if (method === 'DELETE') {
          db.prepare('UPDATE notes SET deleted=? WHERE id=? AND user_id=?').run(Date.now(),id,user.id);
          return send(200,{ok:true});
        }
      }
      if (path === '/files' && method === 'POST') {
        limit(req,'upload',60,3600_000);
        const bytes = await body(req,15_000_000); const mime = imageMime(bytes);
        const size = db.prepare('SELECT coalesce(sum(size),0) AS n FROM files WHERE user_id=?').get(user.id).n;
        if (size + bytes.length > 500_000_000) fail(413,'이미지 저장 공간이 부족합니다.');
        const id = randomUUID(); const directory = join(dataDir,'files',user.id);
        mkdirSync(directory,{recursive:true,mode:0o700});
        writeFileSync(join(directory,id),bytes,{mode:0o600,flag:'wx'});
        db.prepare('INSERT INTO files VALUES(?,?,?,?,?)').run(id,user.id,mime,bytes.length,Date.now());
        return send(201,{id,url:`${publicUrl}/files/${id}`});
      }
      const fileMatch = path.match(/^\/files\/([a-f0-9-]{36})$/);
      if (fileMatch && method === 'GET') {
        const file = db.prepare('SELECT * FROM files WHERE id=? AND user_id=?').get(fileMatch[1],user.id);
        if (!file) fail(404,'이미지를 찾을 수 없습니다.');
        const bytes = readFileSync(join(dataDir,'files',user.id,file.id));
        res.writeHead(200,{'Content-Type':file.mime,'Content-Length':bytes.length,'Cross-Origin-Resource-Policy':'same-site'}); res.end(bytes); return;
      }
      fail(404,'요청을 찾을 수 없습니다.');
    } catch(e) {
      if (!res.headersSent) send(e instanceof Failure ? e.status : 500,{error:e instanceof Failure ? e.message : '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'});
      else res.end();
      if (!(e instanceof Failure)) console.error('Paperdown request failed:',e.message);
    }
  });
  server.requestTimeout = 30_000;
  server.headersTimeout = 15_000;
  server.on('close',()=>db.close());
  return server;
}
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  const server = createApi({dataDir:process.env.DATA_DIR || './backend/data',origins:(process.env.ALLOWED_ORIGINS || 'https://paperdown.bsiku.dev').split(','),publicUrl:process.env.PUBLIC_URL || 'https://paperdown-api.bsiku.dev',secure:process.env.COOKIE_SECURE !== 'false',trustProxy:process.env.TRUST_PROXY === 'true'});
  server.listen(Number(process.env.PORT || 8792),'127.0.0.1',()=>console.log('Paperdown API listening on loopback'));
  for (const signal of ['SIGINT','SIGTERM']) process.on(signal,()=>server.close(()=>process.exit(0)));
}
