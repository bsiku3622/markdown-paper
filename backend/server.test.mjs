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
  assert.equal((await call('/exports/pdf',{method:'POST',data:{html:'x',title:'x',width:Infinity,height:297,pages:1}})).status,400);
  assert.equal((await call('/exports/pdf',{method:'POST',origin:'https://evil.test',data:{}})).status,403);
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
test('profiles, Google sign-in, and shared note images',async()=> {
 const {generateKeyPairSync,createSign}=await import('node:crypto');
 const {privateKey,publicKey}=generateKeyPairSync('rsa',{modulusLength:2048});
 const jwk={...publicKey.export({format:'jwk'}),kid:'test-key',alg:'RS256',use:'sig'};
 const token=(claims,key=privateKey)=> {
  const part=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
  const body=`${part({alg:'RS256',kid:'test-key',typ:'JWT'})}.${part({iss:'https://accounts.google.com',aud:'client.test',iat:Math.floor(Date.now()/1000),exp:Math.floor(Date.now()/1000)+3600,...claims})}`;
  return `${body}.${createSign('RSA-SHA256').update(body).sign(key).toString('base64url')}`;
 };
 const dir=mkdtempSync(join(process.env.TEST_TMPDIR||tmpdir(),'paperdown-api-'));
 const app=createApi({dataDir:dir,origins:[origin],secure:false,publicUrl:'http://localhost',googleClientId:'client.test',googleKeySource:async()=>[jwk]});
 await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 const url=`http://127.0.0.1:${app.address().port}`;
 async function call(path,{method='GET',data,cookie,binary}={}) {
  const r=await fetch(url+path,{method,headers:{Origin:origin,...(cookie?{Cookie:cookie}:{}),...(data?{'Content-Type':'application/json'}:{}),...(binary?{'Content-Type':'image/png'}:{})},body:binary|| (data?JSON.stringify(data):undefined)});
  return {status:r.status,cookie:r.headers.get('set-cookie')?.split(';')[0],type:r.headers.get('content-type'),data:r.headers.get('content-type')?.includes('json')?await r.json():await r.arrayBuffer()};
 }
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/v1cAAAAASUVORK5CYII=','base64');
 try {
  assert.deepEqual((await call('/auth/config')).data,{google:'client.test'});
  // Google: unknown accounts first confirm a username; invalid tokens are refused.
  assert.equal((await call('/auth/google',{method:'POST',data:{credential:token({sub:'g-1'},generateKeyPairSync('rsa',{modulusLength:2048}).privateKey)}})).status,401);
  assert.equal((await call('/auth/google',{method:'POST',data:{credential:token({sub:'g-1',aud:'other'})}})).status,401);
  const first=await call('/auth/google',{method:'POST',data:{credential:token({sub:'g-1',email:'Kim.Writer+x@gmail.com',email_verified:true,name:'김작가',picture:'https://lh3.googleusercontent.com/a/photo=s96-c'})}});
  assert.equal(first.status,200);assert.equal(first.cookie,undefined);
  assert.deepEqual(first.data.signup,{username:'kim.writerx',nickname:'김작가'});
  const google=await call('/auth/google',{method:'POST',data:{credential:token({sub:'g-1',picture:'https://lh3.googleusercontent.com/a/photo=s96-c'}),username:'kim',nickname:'김작가'}});
  assert.equal(google.status,200);
  assert.deepEqual({...google.data.user,id:undefined},{id:undefined,username:'kim',nickname:'김작가',avatar:'https://lh3.googleusercontent.com/a/photo=s96-c',google:true,hasPassword:false});
  assert.equal((await call('/auth/google',{method:'POST',data:{credential:token({sub:'g-1'})}})).data.user.username,'kim');
  assert.equal((await call('/auth/login',{method:'POST',data:{username:'kim',password:'any long password'}})).status,401);
  assert.equal((await call('/me/google',{method:'DELETE',cookie:google.cookie})).status,400);
  // Password accounts can link and unlink Google; one Google account maps to one Paperdown account.
  const lee=await call('/auth/register',{method:'POST',data:{username:'lee',password:'long password lee'}});
  assert.equal((await call('/me/google',{method:'POST',cookie:lee.cookie,data:{credential:token({sub:'g-1'})}})).status,409);
  assert.equal((await call('/me/google',{method:'POST',cookie:lee.cookie,data:{credential:token({sub:'g-2'})}})).data.user.google,true);
  assert.equal((await call('/auth/google',{method:'POST',data:{credential:token({sub:'g-2'})}})).data.user.username,'lee');
  assert.equal((await call('/me/google',{method:'DELETE',cookie:lee.cookie})).data.user.google,false);
  // Nicknames and avatars.
  assert.equal((await call('/me',{method:'PUT',cookie:lee.cookie,data:{nickname:'  '}})).status,400);
  assert.equal((await call('/me',{method:'PUT',cookie:lee.cookie,data:{nickname:'이 작가'}})).data.user.nickname,'이 작가');
  assert.equal((await call('/me/avatar',{method:'PUT',cookie:lee.cookie,binary:Buffer.from('<svg/>')})).status,415);
  const avatar=(await call('/me/avatar',{method:'PUT',cookie:lee.cookie,binary:png})).data.user.avatar;
  assert.match(avatar,/^http:\/\/localhost\/avatars\/[a-f0-9-]{36}\?v=[a-f0-9]{12}$/);
  const avatarPath=new URL(avatar).pathname;
  assert.equal((await call(avatarPath)).status,401);
  const served=await call(avatarPath,{cookie:google.cookie});assert.equal(served.status,200);assert.equal(served.type,'image/png');
  assert.equal((await call('/me/avatar',{method:'DELETE',cookie:lee.cookie})).data.user.avatar,null);
  assert.equal((await call(avatarPath,{cookie:google.cookie})).status,404);
  // Images in a shared note are readable by its members only.
  const note=(await call('/notes',{method:'POST',cookie:lee.cookie,data:{document:{version:1,title:'그림',markdown:'',settings:{},updatedAt:1}}})).data.note;
  assert.equal((await call(`/files?note=${note.id}`,{method:'POST',cookie:google.cookie,binary:png})).status,403);
  const image=(await call(`/files?note=${note.id}`,{method:'POST',cookie:lee.cookie,binary:png})).data;
  const loose=(await call('/files',{method:'POST',cookie:lee.cookie,binary:png})).data;
  assert.equal((await call(`/files/${image.id}`,{cookie:google.cookie})).status,404);
  assert.equal((await call(`/notes/${note.id}/members`,{method:'POST',cookie:lee.cookie,data:{username:'kim',role:'viewer'}})).status,200);
  assert.equal((await call(`/files/${image.id}`,{cookie:google.cookie})).status,200);
  assert.equal((await call(`/files/${loose.id}`,{cookie:google.cookie})).status,404);
  assert.equal((await call(`/files?note=${note.id}`,{method:'POST',cookie:google.cookie,binary:png})).status,403);
  assert.equal((await call(`/notes/${note.id}/members/${google.data.user.id}`,{method:'PUT',cookie:google.cookie,data:{role:'editor'}})).status,403);
  assert.equal((await call(`/notes/${note.id}/members/${google.data.user.id}`,{method:'PUT',cookie:lee.cookie,data:{role:'editor'}})).data.members[0].role,'editor');
  const kimImage=(await call(`/files?note=${note.id}`,{method:'POST',cookie:google.cookie,binary:png})).data;
  assert.equal((await call(`/files/${kimImage.id}`,{cookie:lee.cookie})).status,200);
  assert.equal((await call(`/notes/${note.id}`,{method:'DELETE',cookie:lee.cookie})).status,200);
  assert.equal((await call(`/files/${image.id}`,{cookie:google.cookie})).status,404);
 } finally {await new Promise(resolve=>app.close(resolve));}
});
