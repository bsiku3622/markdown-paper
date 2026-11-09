import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Box, Button, Divider, Field, Floating, FormField, Grid, IconButton, Inline, SegmentControl, Spinner, Stack, Surface, Text } from '@studio-baeks/paper-ui';
import { Glyph } from './glyphs';
import { useMedia } from './hooks';
import { Avatar, Serif, Wordmark } from './chrome';
import { api, ApiError, draft, uploadImage, type User, type Note, type NoteSummary } from './cloud';
import { normalize, persistDocument, type DocumentData } from './document';
import { Home } from './Home';
import { navigate, routeFor, documentPath } from './routes';

export type AccountControls = {
  persist: (document: DocumentData) => Promise<void>;
  changed: (document: DocumentData) => void;
  create: () => void;
  home: () => void;
  upload?: (blob: Blob) => Promise<string>;
  saveLabel?: string;
  accountButton: ReactNode;
};
export function Account({ initial, children }: { initial: DocumentData; children: (document: DocumentData, key: string, controls: AccountControls) => ReactNode }) {
  const [path,setPath] = useState(location.pathname);
  const route=routeFor(path);
  const [ready,setReady] = useState(false);
  const [loadingNote,setLoadingNote] = useState(false);
  const [routeError,setRouteError] = useState('');
  const [authGeneration,setAuthGeneration] = useState(0);
  useEffect(()=>{if(route.kind==='home') document.title='Paperdown — 내 문서';else if(route.kind==='missing'||routeError) document.title='문서를 열 수 없습니다 — Paperdown';},[path,routeError]);
  const routeGeneration=useRef(0);
  useEffect(()=>{const update=()=>setPath(location.pathname);window.addEventListener('popstate',update);return ()=>window.removeEventListener('popstate',update);},[]);
  const [user,setUser] = useState<User | null>(null);
  const [notes,setNotes] = useState<NoteSummary[]>([]);
  const [active,setActive] = useState<Note | null>(null);
  const [guest,setGuest] = useState(initial);
  const [generation,setGeneration] = useState(0);
  const [authOpen,setAuthOpen] = useState(false);
  const [register,setRegister] = useState(false);
  const [search,setSearch] = useState('');
  const [open,setOpen] = useState(false);
  const [working,setWorking] = useState(false);
  const [error,setError] = useState('');
  const [status,setStatus] = useState('계정에 저장됨');
  const [conflict,setConflict] = useState(false);
  const [expired,setExpired] = useState(false);
  const firstField = useRef<HTMLInputElement>(null);
  const current = useRef<Note | null>(null);
  const userRef = useRef<User | null>(null);
  const sequence = useRef(Promise.resolve());
  const latest = useRef<DocumentData>(initial);
  const pending = useRef(false);
  const conflictRef = useRef(false);
  const retryRef = useRef<() => void>(()=>{});
  userRef.current = user;
  function select(note: Note) {
    note = {...note, document: normalize(note.document)};
    current.current = note; latest.current = note.document;
    pending.current = false; conflictRef.current = false;
    setConflict(false); setExpired(false); setGeneration(n=>n+1); setActive(note); setError('');setStatus('계정에 저장됨');
  }
  async function loadNote(owner: User, summary: NoteSummary, valid=()=>true) {
    const local = await draft(owner.id,summary.id);
    let note: Note;
    try { note = (await api<{note:Note}>(`/notes/${summary.id}`)).note; }
    catch(e) {
      if (!local || (e instanceof ApiError && e.status!==0 && e.status<500)) throw e;
      if (!valid()) return;
      note = {...summary,document:local.document,revision:local.revision};
      select(note);pending.current=local.dirty;setStatus(local.dirty ? '오프라인 · 초안 보관됨' : '이 기기에 보관됨');return;
    }
    if (!valid()) return;
    if (local?.dirty) {
      const remoteRevision = note.revision;
      note = {...note,document:local.document,revision:local.revision};select(note);pending.current=true;
      if (remoteRevision !== local.revision) { conflictRef.current=true;setConflict(true);setStatus('다른 기기와 변경 충돌'); }
      else setStatus('초안 복구됨 · 동기화 중');
    } else select(note);
  }
  async function enter(owner: User) {
    const result = await api<{notes:NoteSummary[]}>('/notes');
    setNotes(result.notes);setUser(owner);userRef.current=owner;setExpired(false);setAuthGeneration(n=>n+1);
  }

  useEffect(()=> {
    let live=true;
    void api<{user:User}>('/auth/me').then(({user})=>live?enter(user):undefined).catch(e=> {
      if (!(e instanceof ApiError) || e.status !== 401) setError('계정 연결을 확인하지 못했습니다. 로컬 문서는 계속 편집할 수 있습니다.');
    }).finally(()=>{if(live)setReady(true);});
    return ()=>{live=false;};
  },[]);
  // Serialize writes and retain each unsynced draft by account/note. Server revisions prevent lost updates.
  async function save(document: DocumentData) {
    latest.current=document;
    const owner=userRef.current, note=current.current;
    if (!owner || !note) {setGuest(document);await persistDocument(document);return;}
    if (!pending.current && document.updatedAt === note.document.updatedAt) return;
    pending.current=true;setStatus('저장 중…');
    const job = sequence.current.catch(()=>{}).then(async()=> {
      const snapshot=document;
      if (current.current?.id !== note.id || userRef.current?.id !== owner.id) return;
      const revision=current.current.revision;
      await draft(owner.id,note.id,{document:snapshot,revision,dirty:true});
      if (conflictRef.current) {setStatus('다른 기기와 변경 충돌');return;}
      try {
        const result = await api<{revision:number;updatedAt:number}>(`/notes/${note.id}`,'PUT',{document:snapshot,revision});
        if (current.current?.id !== note.id) return;
        current.current={...current.current,revision:result.revision,updatedAt:result.updatedAt,document:snapshot,title:snapshot.title};
        await draft(owner.id,note.id,{document:latest.current,revision:result.revision,dirty:latest.current.updatedAt!==snapshot.updatedAt});
        setNotes(values=>values.map(n=>n.id===note.id ? {...n,title:snapshot.title,revision:result.revision,updatedAt:result.updatedAt} : n).sort((a,b)=>b.updatedAt-a.updatedAt));
        if (latest.current.updatedAt===snapshot.updatedAt) {pending.current=false;setStatus('계정에 저장됨');setError('');}
      } catch(e) {
        if (e instanceof ApiError && e.status===409) {conflictRef.current=true;setConflict(true);setStatus('다른 기기와 변경 충돌');}
        else {if(e instanceof ApiError && e.status===401) setExpired(true);setStatus('이 기기에 보관됨 · 재시도');setError(e instanceof Error ? e.message : '자동저장을 완료하지 못했습니다.');}
      }
    });
    sequence.current=job;await job;
  }
  retryRef.current=()=> {if(pending.current && !conflictRef.current) void save(latest.current);};
  useEffect(()=> {
    const retry=()=>retryRef.current();const timer=setInterval(retry,15_000);
    const warn = (event:BeforeUnloadEvent)=> {if(pending.current) {event.preventDefault();event.returnValue='';}};
    window.addEventListener('beforeunload',warn);
    window.addEventListener('online',retry);
    return ()=> {clearInterval(timer);window.removeEventListener('online',retry);window.removeEventListener('beforeunload',warn);};
  },[]);
  async function flush() {
    await save(latest.current);
    await sequence.current;
  }
  async function go(path:string) {
    if(working) return;
    setWorking(true);
    try {await flush();navigate(path);} catch(e) {setError(e instanceof Error?e.message:'문서를 저장하지 못했습니다.');}
    finally {setWorking(false);}
  }
  async function switchNote(summary: NoteSummary) {await go(documentPath(summary.id));}
  useEffect(()=> {
    if(!ready) return;
    const generation=++routeGeneration.current;
    const valid=()=>routeGeneration.current===generation;
    setRouteError('');
    if(route.kind!=='document') {void flush().catch(e=>setError(e instanceof Error?e.message:'문서를 저장하지 못했습니다.'));setLoadingNote(false);return;}
    if(route.id==='local') {
      setLoadingNote(true);
      void flush().then(()=>{if(valid()){current.current=null;pending.current=false;conflictRef.current=false;setConflict(false);setActive(null);latest.current=guest;}}).catch(e=>{if(valid())setRouteError(e instanceof Error?e.message:'문서를 저장하지 못했습니다.');}).finally(()=>{if(valid())setLoadingNote(false);});
      return ()=>{routeGeneration.current++;};
    }
    if(!user) {setRouteError('이 문서를 열려면 로그인해주세요.');setLoadingNote(false);return;}
    const summary=notes.find(n=>n.id===route.id);
    if(!summary) {setRouteError('문서를 찾을 수 없거나 접근 권한이 없습니다.');setLoadingNote(false);return;}
    if(current.current?.id===summary.id) {setLoadingNote(false);return;}
    setLoadingNote(true);
    void flush().then(()=>valid()?loadNote(user,summary,valid):undefined).catch(e=>{if(valid()){if(e instanceof ApiError&&e.status===401)setExpired(true);setRouteError(e instanceof Error?e.message:'문서를 불러오지 못했습니다.');}}).finally(()=>{if(valid())setLoadingNote(false);});
    return ()=>{routeGeneration.current++;};
  },[path,ready,user?.id,authGeneration]);
  async function createNote(document?:DocumentData) {
    if (!user) return;
    setWorking(true);
    try {
      await flush();
      const result=await api<{note:Note}>('/notes','POST',{document:document || normalize({title:'새로운 노트',markdown:'# \n\n',settings:latest.current.settings})});
      setNotes(values=>[result.note,...values]);select(result.note);navigate(documentPath(result.note.id));
    } catch(e) {setError(e instanceof Error ? e.message : '노트를 만들지 못했습니다.');}
    finally {setWorking(false);}
  }
  async function removeNote(summary:NoteSummary) {
    if (!window.confirm(`“${summary.title || '제목 없는 노트'}”를 삭제할까요?`)) return;
    setWorking(true);
    try {
      await flush();await api(`/notes/${summary.id}`,'DELETE');
      const remaining=notes.filter(n=>n.id!==summary.id);setNotes(remaining);
      if (current.current?.id===summary.id) {
        current.current=null;pending.current=false;setActive(null);latest.current=guest;navigate('/');
      }
    } catch(e) {setError(e instanceof Error ? e.message : '노트를 삭제하지 못했습니다.');}
    finally {setWorking(false);}
  }
  async function login(event:FormEvent<HTMLFormElement>) {
    event.preventDefault();setWorking(true);setError('');
    const form=new FormData(event.currentTarget);
    try {
      const result=await api<{user:User}>(register?'/auth/register':'/auth/login','POST',{username:form.get('username'),password:form.get('password')});
      await enter(result.user);setAuthOpen(false);
    } catch(e) {setError(e instanceof Error ? e.message : '로그인하지 못했습니다.');}
    finally {setWorking(false);}
  }
  async function logout() {
    setWorking(true);
    try {await flush();await api('/auth/logout','POST',{});current.current=null;userRef.current=null;setUser(null);setActive(null);setNotes([]);setOpen(false);setError('');latest.current=guest;setReady(true);navigate('/');}
    catch(e) {setError(e instanceof Error ? e.message : '로그아웃하지 못했습니다.');}
    finally {setWorking(false);}
  }
  async function reloadRemote() {
    if (!user || !current.current || !window.confirm('현재 초안 대신 서버 문서를 불러올까요? 초안을 남기려면 먼저 “초안으로 새 노트”를 선택해주세요.')) return;
    try {const {note}=await api<{note:Note}>(`/notes/${current.current.id}`);select(note);}
    catch(e){setError(e instanceof Error?e.message:'서버 문서를 불러오지 못했습니다.');}
  }
  const accountButton=<Button variant="hairline" size="xs" aria-label={user?'내 노트':'로그인'} aria-expanded={user?open:authOpen} onClick={()=>user?setOpen(!open):setAuthOpen(true)}><Glyph name="panel-left"/><Box as="span" hideBelow="md">{user?'내 노트':'로그인'}</Box></Button>;
  const controls:AccountControls={persist:save,changed:document=>{latest.current=document;if(current.current&&userRef.current&&document.updatedAt!==current.current.document.updatedAt) {
      pending.current=true;
      void draft(userRef.current.id,current.current.id,{document,revision:current.current.revision,dirty:true}).catch(()=>setError('로컬 초안을 보관하지 못했습니다. 내보내기로 문서를 보관해주세요.'));
    }},create:()=>void createNote(),home:()=>void go('/'),upload:user?uploadImage:undefined,saveLabel:user?status:undefined,accountButton};
  const phone=useMedia('(max-width: 767px)');
  const missing=route.kind==='missing'||routeError;
  const sidebar=user&&open&&route.kind==='document';
  const shownNotes=notes.filter(n=>n.title.toLowerCase().includes(search.toLowerCase()));
  const edge=phone?{shadow:true as const,fill:'raised' as const}:{elevation:'sticky' as const,top:'none' as const};
  return <div className={`account-layout ${sidebar?'with-sidebar':''}`}>
    {sidebar&&<Surface as="aside" aria-label="내 노트" fill="raised" border="end" height="viewport" className="notes-sidebar" {...edge}>
      <Grid rows="auto auto auto auto auto minmax(0, 1fr) auto" gap="lg" height="full" padding="lg">
        <Inline justify="between" align="center" paddingX="sm"><Wordmark small/><IconButton variant="ghost" size="sm" aria-label="노트 목록 닫기" onClick={()=>setOpen(false)}><Glyph name="x"/></IconButton></Inline>
        <Inline align="center" gap="sm" paddingX="sm"><Avatar name={user.username}/><Stack minWidth={0} width="full"><Text as="strong" variant="label" truncate>{user.username}</Text><Text as="span" variant="label" strong={false} ink="tertiary" truncate>나만의 글을 모아두는 곳</Text></Stack><IconButton variant="ghost" size="xs" aria-label="로그아웃" disabled={working} onClick={()=>void logout()}><Glyph name="log-out"/></IconButton></Inline>
        <Button variant="hairline" size="sm" fullWidth disabled={working} onClick={()=>void createNote()}><Glyph name="file-plus-2"/>새 노트</Button>
        <Field size="sm" aria-label="노트 검색" placeholder="노트 찾기" leading={<Glyph name="search"/>} value={search} onChange={e=>setSearch(e.target.value)}/>
        <Inline justify="between" paddingX="sm"><Text as="span" variant="label" strong={false} ink="secondary">내 노트</Text><Text as="span" variant="label" strong={false} ink="secondary" numeric>{notes.length}</Text></Inline>
        <Box overflowY="auto"><Stack as="ul" gap="lg" className="plain-list">{shownNotes.map(note=><Box as="li" key={note.id} className="note-row"><Button variant="ghost" size="xl" fullWidth justify="start" className="note-select" selected={active?.id===note.id} disabled={working} onClick={()=>void switchNote(note)}><Glyph name="file-text" ink="secondary"/><Stack as="span" align="start" gap="xs" minWidth={0}><Text as="span" variant="label" ink="inherit" truncate>{note.title||'제목 없는 노트'}</Text><Text as="span" variant="label" strong={false} ink="tertiary">{new Date(note.updatedAt).toLocaleDateString('ko-KR',{month:'long',day:'numeric'})}</Text></Stack></Button><IconButton variant="ghost" size="xs" className="note-delete" aria-label={`${note.title||'노트'} 삭제`} disabled={working} onClick={()=>void removeNote(note)}><Glyph name="trash-2" ink="tertiary"/></IconButton></Box>)}</Stack></Box>
        <Stack gap="md"><Divider/><Inline justify="center" align="center" gap="sm"><Glyph name="cloud" ink="secondary"/><Text as="span" variant="label" strong={false} ink="secondary">계정에 안전하게 보관</Text></Inline></Stack>
      </Grid>
    </Surface>}
    <div className="account-main">
      {error&&!authOpen&&<Surface fill="raised" border="bottom" paddingX="xl" paddingY="md" role="status"><Inline align="center" gap="md" wrap><Text as="span" variant="caption">{error}</Text><Button variant="ghost" size="xs" onClick={()=>expired?setAuthOpen(true):retryRef.current()}><Glyph name="refresh-cw"/>{expired?"다시 로그인":"재시도"}</Button><IconButton variant="ghost" size="xs" aria-label="알림 닫기" onClick={()=>setError('')}><Glyph name="x"/></IconButton></Inline></Surface>}
      {conflict&&<Surface fill="raised" border="bottom" paddingX="xl" paddingY="md" role="alert"><Inline align="center" gap="md" wrap><Text as="span" variant="caption">다른 기기의 변경을 덮어쓰지 않았습니다. 현재 초안을 새 노트로 보관하거나 서버 문서를 불러오세요.</Text><Button variant="ghost" size="xs" onClick={()=>void createNote(latest.current)}><Glyph name="copy"/>초안으로 새 노트</Button><Button variant="ghost" size="xs" onClick={()=>void reloadRemote()}>서버 문서 불러오기</Button></Inline></Surface>}
      {!ready?<Stack align="center" justify="center" gap="md" minHeight="viewport"><Wordmark/><Inline gap="sm" align="center"><Spinner size="inline" label="문서를 불러오는 중"/><Text as="p" variant="caption" ink="tertiary">문서를 불러오는 중…</Text></Inline></Stack>:route.kind==='home'?<Home user={user} notes={notes} guest={guest} working={working} open={note=>void switchNote(note)} create={()=>void createNote()} guestOpen={()=>void go(documentPath('local'))} login={()=>setAuthOpen(true)} logout={()=>void logout()} remove={note=>void removeNote(note)}/>:missing?<Stack as="main" align="center" justify="center" gap="lg" minHeight="viewport" padding="2xl"><Stack align="center" gap="xl"><Glyph name="file-text" size="subheading" ink="secondary"/><Serif as="h1" variant="title" strong>{route.kind==='missing'?'페이지를 찾을 수 없습니다':'문서를 열 수 없습니다'}</Serif><Text as="p" ink="secondary">{routeError||'주소를 확인하거나 홈에서 문서를 선택해주세요.'}</Text></Stack>{(!user||expired)&&route.kind==='document'&&<Button size="sm" onClick={()=>setAuthOpen(true)}>로그인 / 회원가입</Button>}<Button variant="hairline" size="sm" onClick={()=>void go('/')}>홈으로</Button></Stack>:loadingNote||(route.kind==='document'&&(route.id==='local'?active!==null:active?.id!==route.id))?<Stack align="center" justify="center" minHeight="viewport"><Inline gap="sm" align="center"><Spinner size="inline" label="문서를 불러오는 중"/><Text as="p" variant="caption" ink="tertiary">문서를 불러오는 중…</Text></Inline></Stack>:children(route.kind==='document'&&route.id==='local'?guest:latest.current,route.kind==='document'&&route.id==='local'?'guest':`${active!.id}:${generation}`,route.kind==='document'&&route.id==='local'?{...controls,upload:undefined,saveLabel:undefined,persist:async document=>{latest.current=document;setGuest(document);await persistDocument(document);},changed:document=>{latest.current=document;setGuest(document);}}:controls)}
    </div>
    <Floating open={authOpen} onOpenChange={o=>{if(!o&&!working)setAuthOpen(false);}}>
      <Floating.Content as={Surface} fill="raised" radius="md" padding="2xl" width={phone?'xl':'measure.xs'} maxWidth="full" presentation="modal" aria-label={register?'회원가입':'로그인'} initialFocusRef={firstField}>
        <Stack gap="xl">
          <Inline justify="between" align="start" gap="md"><Wordmark/><IconButton as={Floating.Close} size="xs" variant="ghost" aria-label="로그인 창 닫기"><Glyph name="x"/></IconButton></Inline>
          <Stack gap="sm"><Serif as="h1" variant="title" strong={false}>{register?'글이 머무를 계정을 만드세요':'당신의 글을 이어가세요'}</Serif><Text as="p" variant="caption" ink="secondary">여러 노트를 모아두고, 어느 기기에서든 이어 쓰세요.</Text></Stack>
          <SegmentControl aria-label="로그인 방식" fullWidth value={register?'register':'login'} onValueChange={v=>{setRegister(v==='register');setError('');}}><SegmentControl.Item value="login">로그인</SegmentControl.Item><SegmentControl.Item value="register">회원가입</SegmentControl.Item></SegmentControl>
          <Stack as="form" gap="lg" onSubmit={login}>
            <FormField label="아이디"><Field ref={firstField} name="username" size="md" required minLength={3} maxLength={32} pattern="[a-zA-Z0-9][a-zA-Z0-9_.\-]{2,31}" autoComplete="username" placeholder="영문·숫자 3~32자"/></FormField>
            <FormField label="비밀번호"><Field name="password" type="password" size="md" required minLength={10} maxLength={128} autoComplete={register?'new-password':'current-password'} placeholder="10자 이상"/></FormField>
            {error&&<Text as="p" variant="caption" ink="error" role="alert">{error}</Text>}
            <Button type="submit" size="md" fullWidth loading={working} loadingLabel="잠시만 기다려주세요…">{working?'잠시만 기다려주세요…':register?'계정 만들기':'로그인'}</Button>
          </Stack>
          <Stack align="center"><Text as="p" variant="label" strong={false} ink="secondary">현재 브라우저의 문서는 그대로 보관됩니다.</Text></Stack>
        </Stack>
      </Floating.Content>
    </Floating>
  </div>;
}
