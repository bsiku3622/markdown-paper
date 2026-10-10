import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createApi } from './server.mjs';
const origin='http://localhost:4325';
const document={version:1,title:'첫 노트',markdown:'# 첫 노트\n\n본문',settings:{font:'myeongjo'},updatedAt:1};
test('accounts, note ownership, optimistic saves, private files and session revocation',async()=> {
 const dir=mkdtempSync(join(process.env.TEST_TMPDIR||tmpdir(),'paperdown-api-'));
 const app=createApi({dataDir:dir,origins:[origin],secure:false,publicUrl:'http://localhost'});
 await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 const url=`http://127.0.0.1:${app.address().port}`;
 async function call(path,{method='GET',data,cookie,origin:from=origin,binary}={}) {
  const r=await fetch(url+path,{method,headers:{Origin:from,...(cookie?{Cookie:cookie}:{}),...(data?{'Content-Type':'application/json'}:{}),...(binary?{'Content-Type':'image/png'}:{})},body:binary|| (data?JSON.stringify(data):undefined)});
  return {status:r.status,cookie:r.headers.get('set-cookie')?.split(';')[0],data:r.headers.get('content-type')?.includes('json')?await r.json():await r.arrayBuffer()};
 }
 try {
  assert.equal((await call('/notes')).status,401);
  assert.equal((await call('/auth/register',{method:'POST',data:{username:'invalid spaces',password:'long password'}})).status,400);
  const a=await call('/auth/register',{method:'POST',data:{username:'alpha',password:'long password alpha'}});assert.equal(a.status,200);assert.match(a.cookie,/paperdown-session=/);
  assert.equal((await call('/auth/register',{method:'POST',data:{username:'ALPHA',password:'long password alpha'}})).status,409);
  const b=await call('/auth/register',{method:'POST',data:{username:'beta',password:'long password beta'}});assert.equal(b.status,200);
  const made=await call('/notes',{method:'POST',cookie:a.cookie,data:{document}});assert.equal(made.status,201);
  const id=made.data.note.id;
  assert.equal((await call(`/notes/${id}`,{cookie:b.cookie})).status,404);
  assert.equal((await call(`/notes/${id}`,{cookie:b.cookie,method:'PUT',data:{document,revision:1}})).status,404);
  assert.equal((await call(`/notes/${id}`,{cookie:a.cookie,method:'PUT',origin:'https://evil.test',data:{document,revision:1}})).status,403);
  const saved=await call(`/notes/${id}`,{cookie:a.cookie,method:'PUT',data:{document:{...document,title:'고친 제목'},revision:1}});assert.equal(saved.status,200);assert.equal(saved.data.revision,2);
  assert.equal((await call(`/notes/${id}`,{cookie:a.cookie,method:'PUT',data:{document,revision:1}})).status,409);
  assert.equal((await call(`/notes/${id}`,{cookie:a.cookie})).data.note.title,'고친 제목');
  assert.equal((await call('/files',{cookie:a.cookie,method:'POST',binary:Buffer.from('<svg onload="alert(1)">')})).status,415);
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/v1cAAAAASUVORK5CYII=','base64');
  const upload=await call('/files',{cookie:a.cookie,method:'POST',binary:png});assert.equal(upload.status,201);
  assert.equal((await call(`/files/${upload.data.id}`,{cookie:b.cookie})).status,404);
  assert.equal((await call(`/files/${upload.data.id}`,{cookie:a.cookie})).status,200);
  assert.equal((await call('/auth/login',{method:'POST',data:{username:'alpha',password:'wrong password'}})).status,401);
  assert.equal((await call('/auth/login',{method:'POST',data:{username:'alpha',password:'long password alpha'}})).status,200);
  assert.equal((await call('/auth/logout',{cookie:a.cookie,method:'POST',data:{}})).status,200);
  assert.equal((await call('/auth/me',{cookie:a.cookie})).status,401);
  assert.equal((await call('/notes',{cookie:b.cookie})).data.notes.length,0);
 } finally {await new Promise(resolve=>app.close(resolve));}
});
