import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { Box, Button, Divider, Field, Floating, FormField, Grid, IconButton, Inline, SegmentControl, Spinner, Stack, Surface, Text } from '@studio-baeks/paper-ui';
import { Glyph } from './glyphs';
import { useMedia } from './hooks';
import { Avatar, Serif, Wordmark } from './chrome';
import { api, ApiError, earlierDraft, uploadImage, type User, type Note, type NoteSummary, type Member } from './cloud';
import { normalize, persistDocument, type DocumentData } from './document';
import { Home } from './Home';
import { Profile } from './Profile';
import { GoogleButton, useGoogleClient } from './google';
import { navigate, routeFor, documentPath } from './routes';

export type AccountControls = {
  persist: (document: DocumentData) => Promise<void>;
  changed: (document: DocumentData) => void;
  create: (document?: DocumentData) => void;
  home: () => void;
  upload?: (blob: Blob) => Promise<string>;
  accountButton: ReactNode;
};
// An account note opened for live editing.
export type LiveNote = { note: Note; user: User; setMembers: (members: Member[]) => void; refresh: () => void; leave: () => void };
type Signup = { credential: string; username: string; nickname: string };
const leaveOrDelete = (note: NoteSummary) => note.role === 'owner'
  ? `“${note.title || '제목 없는 노트'}”를 삭제할까요?${note.shared ? ' 공유받은 사람들도 더 이상 볼 수 없습니다.' : ''}`
  : `“${note.title || '제목 없는 노트'}”에서 나갈까요? 다시 보려면 주인이 다시 공유해야 합니다.`;

export function Account({ initial, children }: { initial: DocumentData; children: (document: DocumentData, key: string, controls: AccountControls, live?: LiveNote) => ReactNode }) {
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
  const [signup,setSignup] = useState<Signup | null>(null);
  const [profileOpen,setProfileOpen] = useState(false);
  const [search,setSearch] = useState('');
  const [open,setOpen] = useState(false);
  const [working,setWorking] = useState(false);
  const [error,setError] = useState('');
  const [expired,setExpired] = useState(false);
  const [recovered,setRecovered] = useState<{noteId:string;document:DocumentData} | null>(null);
  const google = useGoogleClient();
  const firstField = useRef<HTMLInputElement>(null);
  const current = useRef<Note | null>(null);
  const userRef = useRef<User | null>(null);
  const latest = useRef<DocumentData>(initial);
  userRef.current = user;
  function select(note: Note) {
    note = {...note, document: normalize(note.document)};
    current.current = note; latest.current = note.document;
    setExpired(false); setGeneration(n=>n+1); setActive(note); setError('');
  }
  async function loadNote(owner: User, summary: NoteSummary, valid=()=>true) {
    const {note} = await api<{note:Note}>(`/notes/${summary.id}`);
    if (!valid()) return;
    select(note);
    // An unsynced draft from the earlier whole-document autosave is offered, never merged silently.
    const draft = await earlierDraft(owner.id,note.id).catch(()=>undefined);
    if (valid() && draft?.dirty) setRecovered({noteId:note.id,document:normalize(draft.document)});
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
  // Only the browser-local document is saved from here; account notes save through live editing.
  async function flush() {
    if (current.current) return;
    setGuest(latest.current);
    await persistDocument(latest.current);
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
    if(route.kind!=='document') {
      void flush().catch(e=>setError(e instanceof Error?e.message:'문서를 저장하지 못했습니다.'));setLoadingNote(false);
      // Notes shared by others appear without a reload.
      if(route.kind==='home'&&user) void api<{notes:NoteSummary[]}>('/notes').then(r=>{if(valid())setNotes(r.notes);}).catch(()=>{});
      return;
    }
    if(route.id==='local') {
      setLoadingNote(true);
      void flush().then(()=>{if(valid()){current.current=null;setActive(null);latest.current=guest;}}).catch(e=>{if(valid())setRouteError(e instanceof Error?e.message:'문서를 저장하지 못했습니다.');}).finally(()=>{if(valid())setLoadingNote(false);});
      return ()=>{routeGeneration.current++;};
    }
    if(!user) {setRouteError('이 문서를 열려면 로그인해주세요.');setLoadingNote(false);return;}
    if(current.current?.id===route.id) {setLoadingNote(false);return;}
    setLoadingNote(true);
    void flush().then(()=>valid()?loadNote(user,{id:route.id} as NoteSummary,valid):undefined).catch(e=>{if(valid()){if(e instanceof ApiError&&e.status===401)setExpired(true);setRouteError(e instanceof ApiError&&e.status===404?'문서를 찾을 수 없거나 접근 권한이 없습니다.':e instanceof Error?e.message:'문서를 불러오지 못했습니다.');}}).finally(()=>{if(valid())setLoadingNote(false);});
    return ()=>{routeGeneration.current++;};
  },[path,ready,user?.id,authGeneration]);
  async function createNote(document?:DocumentData) {
    if (!user) return;
    setWorking(true);
    try {
      await flush();
      const result=await api<{note:Note}>('/notes','POST',{document:document || normalize({title:'새로운 노트',markdown:'# \n\n',content:{type:'doc',content:[{type:'heading',attrs:{level:1}}]},settings:latest.current.settings})});
      setNotes(values=>[result.note,...values]);select(result.note);navigate(documentPath(result.note.id));
    } catch(e) {setError(e instanceof Error ? e.message : '노트를 만들지 못했습니다.');}
    finally {setWorking(false);}
  }
  async function removeNote(summary:NoteSummary) {
    if (!window.confirm(leaveOrDelete(summary))) return;
    setWorking(true);
    try {
      await api(`/notes/${summary.id}`,'DELETE');
      setNotes(values=>values.filter(n=>n.id!==summary.id));
      if (current.current?.id===summary.id) {current.current=null;setActive(null);latest.current=guest;navigate('/');}
    } catch(e) {setError(e instanceof Error ? e.message : '노트를 정리하지 못했습니다.');}
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
  // A Google account without a Paperdown account confirms its username first.
  async function googleSignIn(credential:string, chosen?:{username:string;nickname:string}) {
    setWorking(true);setError('');
    try {
      const result=await api<{user?:User;signup?:{username:string;nickname:string}}>('/auth/google','POST',{credential,...chosen});
      if (result.signup) {setSignup({credential,...result.signup});return;}
      await enter(result.user!);setSignup(null);setAuthOpen(false);
    } catch(e) {setError(e instanceof Error ? e.message : 'Google로 로그인하지 못했습니다.');}
    finally {setWorking(false);}
  }
  async function logout() {
    setWorking(true);
    try {await flush();await api('/auth/logout','POST',{});current.current=null;userRef.current=null;setUser(null);setActive(null);setNotes([]);setOpen(false);setError('');latest.current=guest;setReady(true);navigate('/');}
    catch(e) {setError(e instanceof Error ? e.message : '로그아웃하지 못했습니다.');}
    finally {setWorking(false);}
  }
  async function recover() {
    if (!recovered || !user) return;
    await createNote({...recovered.document,title:`${recovered.document.title || '제목 없는 노트'} (복구한 초안)`});
    await earlierDraft(user.id,recovered.noteId,true).catch(()=>{});
    setRecovered(null);
  }
  const accountButton=<Button variant="hairline" size="xs" aria-label={user?'내 노트':'로그인'} aria-expanded={user?open:authOpen} onClick={()=>user?setOpen(!open):setAuthOpen(true)}><Glyph name="panel-left"/><Box as="span" hideBelow="md">{user?'내 노트':'로그인'}</Box></Button>;
  const base:AccountControls={persist:async()=>{},changed:()=>{},create:document=>void createNote(document),home:()=>void go('/'),accountButton};
  const guestControls:AccountControls={...base,persist:async document=>{latest.current=document;setGuest(document);await persistDocument(document);},changed:document=>{latest.current=document;setGuest(document);}};
  const liveControls:AccountControls={...base,upload:blob=>uploadImage(blob,current.current?.id),
    changed:document=>{const id=current.current?.id;if(id)setNotes(values=>values.map(n=>n.id===id&&n.title!==document.title?{...n,title:document.title}:n));}};
  const phone=useMedia('(max-width: 767px)');
  const missing=route.kind==='missing'||routeError;
  const sidebar=user&&open&&route.kind==='document';
  const shownNotes=notes.filter(n=>n.title.toLowerCase().includes(search.toLowerCase()));
  const edge=phone?{shadow:true as const,fill:'raised' as const}:{elevation:'sticky' as const,top:'none' as const};
  // Roles and members are re-read whenever the live connection re-authenticates (the server forces that on sharing changes).
  const refresh=(id:string)=>void api<{note:Note}>(`/notes/${id}`).then(({note})=>setActive(a=>a&&a.id===note.id?{...a,role:note.role,members:note.members,owner:note.owner,shared:note.shared}:a)).catch(()=>{});
  const liveNote=route.kind==='document'&&route.id!=='local'&&active&&user?{note:active,user,setMembers:(members:Member[])=>setActive(a=>a&&{...a,members,shared:members.length>0}),refresh:()=>refresh(active.id),leave:()=>void removeNote(active)}:undefined;
  return <div className={`account-layout ${sidebar?'with-sidebar':''}`}>
    {sidebar&&<Surface as="aside" aria-label="내 노트" fill="raised" border="end" height="viewport" className="notes-sidebar" {...edge}>
      <Grid rows="auto auto auto auto auto minmax(0, 1fr) auto" gap="lg" height="full" padding="lg">
        <Inline justify="between" align="center" paddingX="sm"><Wordmark small/><IconButton variant="ghost" size="sm" aria-label="노트 목록 닫기" onClick={()=>setOpen(false)}><Glyph name="x"/></IconButton></Inline>
        <Inline align="center" gap="sm" paddingX="sm"><Button variant="ghost" size="lg" fullWidth justify="start" aria-label="프로필" onClick={()=>setProfileOpen(true)}><Avatar name={user.nickname} src={user.avatar}/><Stack as="span" align="start" minWidth={0}><Text as="span" variant="label" ink="inherit" truncate>{user.nickname}</Text><Text as="span" variant="label" strong={false} ink="tertiary" truncate>@{user.username}</Text></Stack></Button><IconButton variant="ghost" size="xs" aria-label="로그아웃" disabled={working} onClick={()=>void logout()}><Glyph name="log-out"/></IconButton></Inline>
        <Button variant="hairline" size="sm" fullWidth disabled={working} onClick={()=>void createNote()}><Glyph name="file-plus-2"/>새 노트</Button>
        <Field size="sm" aria-label="노트 검색" placeholder="노트 찾기" leading={<Glyph name="search"/>} value={search} onChange={e=>setSearch(e.target.value)}/>
        <Inline justify="between" paddingX="sm"><Text as="span" variant="label" strong={false} ink="secondary">내 노트</Text><Text as="span" variant="label" strong={false} ink="secondary" numeric>{notes.length}</Text></Inline>
        <Box overflowY="auto"><Stack as="ul" gap="lg" className="plain-list">{shownNotes.map(note=><Box as="li" key={note.id} className="note-row"><Button variant="ghost" size="xl" fullWidth justify="start" className="note-select" selected={active?.id===note.id} disabled={working} onClick={()=>void switchNote(note)}><Glyph name={note.shared||note.owner?'users':'file-text'} ink="secondary"/><Stack as="span" align="start" gap="xs" minWidth={0}><Text as="span" variant="label" ink="inherit" truncate>{note.title||'제목 없는 노트'}</Text><Text as="span" variant="label" strong={false} ink="tertiary" truncate>{note.owner?`${note.owner.nickname} · `:''}{new Date(note.updatedAt).toLocaleDateString('ko-KR',{month:'long',day:'numeric'})}</Text></Stack></Button><IconButton variant="ghost" size="xs" className="note-delete" aria-label={`${note.title||'노트'} ${note.role==='owner'?'삭제':'나가기'}`} disabled={working} onClick={()=>void removeNote(note)}><Glyph name={note.role==='owner'?'trash-2':'log-out'} ink="tertiary"/></IconButton></Box>)}</Stack></Box>
        <Stack gap="md"><Divider/><Inline justify="center" align="center" gap="sm"><Glyph name="cloud" ink="secondary"/><Text as="span" variant="label" strong={false} ink="secondary">계정에 안전하게 보관</Text></Inline></Stack>
      </Grid>
    </Surface>}
    <div className="account-main">
      {error&&!authOpen&&<Surface fill="raised" border="bottom" paddingX="xl" paddingY="md" role="status"><Inline align="center" gap="md" wrap><Text as="span" variant="caption">{error}</Text>{expired?<Button variant="ghost" size="xs" onClick={()=>setAuthOpen(true)}><Glyph name="refresh-cw"/>다시 로그인</Button>:null}<IconButton variant="ghost" size="xs" aria-label="알림 닫기" onClick={()=>setError('')}><Glyph name="x"/></IconButton></Inline></Surface>}
      {recovered&&active?.id===recovered.noteId&&<Surface fill="raised" border="bottom" paddingX="xl" paddingY="md" role="alert"><Inline align="center" gap="md" wrap><Text as="span" variant="caption">이전 버전에서 서버에 저장되지 못한 초안이 이 기기에 남아 있습니다. 새 노트로 보관할 수 있습니다.</Text><Button variant="ghost" size="xs" disabled={working} onClick={()=>void recover()}><Glyph name="copy"/>초안으로 새 노트</Button><IconButton variant="ghost" size="xs" aria-label="알림 닫기" onClick={()=>setRecovered(null)}><Glyph name="x"/></IconButton></Inline></Surface>}
      {!ready?<Stack align="center" justify="center" gap="md" minHeight="viewport"><Wordmark/><Inline gap="sm" align="center"><Spinner size="inline" label="문서를 불러오는 중"/><Text as="p" variant="caption" ink="tertiary">문서를 불러오는 중…</Text></Inline></Stack>:route.kind==='home'?<Home user={user} notes={notes} guest={guest} working={working} open={note=>void switchNote(note)} create={()=>void createNote()} guestOpen={()=>void go(documentPath('local'))} login={()=>setAuthOpen(true)} logout={()=>void logout()} profile={()=>setProfileOpen(true)} remove={note=>void removeNote(note)}/>:missing?<Stack as="main" align="center" justify="center" gap="lg" minHeight="viewport" padding="2xl"><Stack align="center" gap="xl"><Glyph name="file-text" size="subheading" ink="secondary"/><Serif as="h1" variant="title" strong>{route.kind==='missing'?'페이지를 찾을 수 없습니다':'문서를 열 수 없습니다'}</Serif><Text as="p" ink="secondary">{routeError||'주소를 확인하거나 홈에서 문서를 선택해주세요.'}</Text></Stack>{(!user||expired)&&route.kind==='document'&&<Button size="sm" onClick={()=>setAuthOpen(true)}>로그인 / 회원가입</Button>}<Button variant="hairline" size="sm" onClick={()=>void go('/')}>홈으로</Button></Stack>:loadingNote||(route.kind==='document'&&(route.id==='local'?active!==null:active?.id!==route.id))?<Stack align="center" justify="center" minHeight="viewport"><Inline gap="sm" align="center"><Spinner size="inline" label="문서를 불러오는 중"/><Text as="p" variant="caption" ink="tertiary">문서를 불러오는 중…</Text></Inline></Stack>:liveNote?children(active!.document,`${active!.id}:${generation}`,liveControls,liveNote):children(guest,'guest',guestControls)}
    </div>
    {user&&<Profile user={user} open={profileOpen} setOpen={setProfileOpen} setUser={setUser} google={google}/>}
    <Floating open={authOpen} onOpenChange={o=>{if(!o&&!working){setAuthOpen(false);setSignup(null);}}}>
      <Floating.Content as={Surface} fill="raised" radius="md" padding="2xl" width={phone?'xl':'measure.xs'} maxWidth="full" presentation="modal" aria-label={signup?'Google로 가입':register?'회원가입':'로그인'} initialFocusRef={firstField}>
        <Stack gap="xl">
          <Inline justify="between" align="start" gap="md"><Wordmark/><IconButton as={Floating.Close} size="xs" variant="ghost" aria-label="로그인 창 닫기"><Glyph name="x"/></IconButton></Inline>
          {signup?<>
            <Stack gap="sm"><Serif as="h1" variant="title" strong={false}>아이디를 정해주세요</Serif><Text as="p" variant="caption" ink="secondary">다른 사람이 노트를 공유할 때 이 아이디로 찾습니다. 아이디는 나중에 바꿀 수 없습니다.</Text></Stack>
            <Stack as="form" gap="lg" onSubmit={(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();const form=new FormData(e.currentTarget);void googleSignIn(signup.credential,{username:String(form.get('username')),nickname:String(form.get('nickname'))});}}>
              <FormField label="아이디"><Field ref={firstField} name="username" size="md" required minLength={3} maxLength={32} pattern="[a-zA-Z0-9][a-zA-Z0-9_.\-]{2,31}" autoComplete="username" defaultValue={signup.username} placeholder="영문·숫자 3~32자"/></FormField>
              <FormField label="닉네임" description="함께 쓰는 사람에게 보이는 이름입니다."><Field name="nickname" size="md" maxLength={30} defaultValue={signup.nickname} placeholder="비워두면 아이디를 씁니다"/></FormField>
              {error&&<Text as="p" variant="caption" ink="error" role="alert">{error}</Text>}
              <Button type="submit" size="md" fullWidth loading={working} loadingLabel="잠시만 기다려주세요…">{working?'잠시만 기다려주세요…':'계정 만들기'}</Button>
              <Button variant="ghost" size="sm" fullWidth disabled={working} onClick={()=>{setSignup(null);setError('');}}>돌아가기</Button>
            </Stack>
          </>:<>
            <Stack gap="sm"><Serif as="h1" variant="title" strong={false}>{register?'글이 머무를 계정을 만드세요':'당신의 글을 이어가세요'}</Serif><Text as="p" variant="caption" ink="secondary">여러 노트를 모아두고, 어느 기기에서든, 누구와도 함께 이어 쓰세요.</Text></Stack>
            {google&&<Stack gap="md"><GoogleButton client={google} text={register?'signup_with':'continue_with'} onCredential={credential=>void googleSignIn(credential)}/><Inline gap="md" align="center"><Box width="full"><Divider/></Box><Text as="span" variant="label" strong={false} ink="tertiary">또는</Text><Box width="full"><Divider/></Box></Inline></Stack>}
            <SegmentControl aria-label="로그인 방식" fullWidth value={register?'register':'login'} onValueChange={v=>{setRegister(v==='register');setError('');}}><SegmentControl.Item value="login">로그인</SegmentControl.Item><SegmentControl.Item value="register">회원가입</SegmentControl.Item></SegmentControl>
            <Stack as="form" gap="lg" onSubmit={login}>
              <FormField label="아이디"><Field ref={firstField} name="username" size="md" required minLength={3} maxLength={32} pattern="[a-zA-Z0-9][a-zA-Z0-9_.\-]{2,31}" autoComplete="username" placeholder="영문·숫자 3~32자"/></FormField>
              <FormField label="비밀번호"><Field name="password" type="password" size="md" required minLength={10} maxLength={128} autoComplete={register?'new-password':'current-password'} placeholder="10자 이상"/></FormField>
              {error&&<Text as="p" variant="caption" ink="error" role="alert">{error}</Text>}
              <Button type="submit" size="md" fullWidth loading={working} loadingLabel="잠시만 기다려주세요…">{working?'잠시만 기다려주세요…':register?'계정 만들기':'로그인'}</Button>
            </Stack>
            <Stack align="center"><Text as="p" variant="label" strong={false} ink="secondary">현재 브라우저의 문서는 그대로 보관됩니다.</Text></Stack>
          </>}
        </Stack>
      </Floating.Content>
    </Floating>
  </div>;
}
