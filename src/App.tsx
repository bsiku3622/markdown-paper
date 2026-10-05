import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@studio-baeks/paper-ui';
import { FileText, ArrowDownToLine, Copy, Check, PenLine, Eye, Plus, FolderOpen, Bold, Italic, Heading2, List, Link, Quote, Code2, Image, X, ChevronDown, SlidersHorizontal, Undo2, Redo2 } from 'lucide-react';
import CodeMirror, { type ReactCodeMirrorRef } from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';
import { EditorView } from '@codemirror/view';
import { undo, redo } from '@codemirror/commands';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { toBlob, toCanvas } from 'html-to-image';
import { documentFonts } from './export-fonts';

const SAMPLE = `# 생각이 머무는 자리\n\n좋은 글은 작은 여백에서 시작됩니다. 서두르지 않고, 떠오르는 생각을 한 문장씩 적어보세요.\n\n## 쓰는 일과 읽는 일\n\n편집할 때는 글에 집중하고, 미리보기에서는 문장의 모양을 살펴봅니다. **중요한 생각**을 강조하거나, *조금 다른 목소리*로 이야기를 건네보세요.\n\n> 여백은 비어 있는 자리가 아니라,\n> 다음 생각이 들어올 자리입니다.\n\n### 이 공간에서 할 수 있는 일\n\n- Markdown으로 가볍게 글쓰기\n- Sans, Serif, 명조 중 어울리는 서체 고르기\n- 완성한 글을 이미지로 복사하고 PDF로 간직하기\n\n---\n\n작은 기록도 오래 남습니다. 이제 첫 문장을 시작해보세요.\n`;
type Settings = { font: 'sans'|'serif'|'myeongjo'; size: number; leading: number; width: number };
type Draft = { text: string; title: string; settings: Settings };
const DEFAULTS: Settings = { font: 'myeongjo', size: 17, leading: 1.9, width: 760 };
const KEY = 'yeobaek-draft-v1';
function load(): Draft {
  try { const data = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (data && typeof data.text === 'string' && typeof data.title === 'string') {
      const s = data.settings || {};
      return {text:data.text,title:data.title,settings:{font:['sans','serif','myeongjo'].includes(s.font)?s.font:DEFAULTS.font,size:[15,17,19,21].includes(s.size)?s.size:17,leading:[1.6,1.9,2.2].includes(s.leading)?s.leading:1.9,width:[640,760,880].includes(s.width)?s.width:760}};
    }
  } catch { /* A draft remains usable when storage is unavailable. */ }
  return {text:SAMPLE,title:'생각이 머무는 자리',settings:DEFAULTS};
}
function saveFile(blob: Blob, name: string) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = name; a.click(); setTimeout(()=>URL.revokeObjectURL(url),1000); }
const editorTheme = EditorView.theme({ '&': {fontSize:'16px',backgroundColor:'transparent'}, '.cm-content':{fontFamily:'"Pretendard Variable", sans-serif',lineHeight:'1.95',padding:'0'}, '.cm-line':{padding:'0'}, '.cm-focused':{outline:'none'}, '.cm-scroller':{overflow:'visible'}, '.cm-placeholder':{color:'var(--pui-color-ink-tertiary)'}, '.cm-selectionBackground':{background:'var(--pui-color-accent-info-wash) !important'}, '.cm-activeLine':{background:'transparent'} });

export default function App() {
  const [draft,setDraft] = useState(load);
  const [mode,setMode] = useState<'edit'|'preview'>('preview');
  const [showSettings,setShowSettings] = useState(false);
  const [exportMenu,setExportMenu] = useState(false);
  const [confirmNew,setConfirmNew] = useState(false);
  const [busy,setBusy] = useState('');
  const [notice,setNotice] = useState('');
  const [saved,setSaved] = useState(true);
  const editor = useRef<ReactCodeMirrorRef>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const importer = useRef<HTMLInputElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const {text,title,settings} = draft;
  const filename = (title.trim() || '제목 없는 문서').replace(/[\\/:*?"<>|]/g,'-');
  const wordCount = useMemo(()=>text.trim()?text.trim().split(/\s+/u).length:0,[text]);
  const charCount = Array.from(text).length;
  const flash = (message:string) => setNotice(message);
  useEffect(()=>{ if (!notice) return; const id = setTimeout(()=>setNotice(''),5000); return ()=>clearTimeout(id); },[notice]);
  useEffect(()=>{ setSaved(false); const id = setTimeout(()=>{try{localStorage.setItem(KEY,JSON.stringify(draft));setSaved(true);}catch{flash('자동 저장 공간이 부족합니다. Markdown 파일로 저장해주세요.');}},450);return()=>clearTimeout(id); },[draft]);
  useEffect(()=>{ const flush = ()=>{try{localStorage.setItem(KEY,JSON.stringify(draft));}catch{}};window.addEventListener('pagehide',flush);return()=>window.removeEventListener('pagehide',flush); },[draft]);
  useEffect(()=>{const close=(event:MouseEvent)=>{if(!exportRef.current?.contains(event.target as Node))setExportMenu(false);if(!settingsRef.current?.contains(event.target as Node))setShowSettings(false);};document.addEventListener('mousedown',close);return()=>document.removeEventListener('mousedown',close);},[]);
  useEffect(()=>{const keys=(event:KeyboardEvent)=>{if((event.metaKey||event.ctrlKey)&&event.key==='s'){event.preventDefault();saveFile(new Blob([text],{type:'text/markdown;charset=utf-8'}),`${filename}.md`);flash('Markdown 파일을 저장했습니다.');}if((event.metaKey||event.ctrlKey)&&event.shiftKey&&event.key.toLowerCase()==='p'){event.preventDefault();setMode(m=>m==='edit'?'preview':'edit');}if(event.key==='Escape'){setExportMenu(false);setShowSettings(false);setConfirmNew(false);}};window.addEventListener('keydown',keys);return()=>window.removeEventListener('keydown',keys);},[text,filename]);
  useEffect(()=>{if(!confirmNew)return;const trigger=document.activeElement as HTMLElement;const dialog=document.querySelector<HTMLDialogElement>('dialog');dialog?.showModal();return()=>{dialog?.close();trigger?.focus();};},[confirmNew]);
  function format(before:string,after='',fallback='텍스트') {const view=editor.current?.view;if(!view)return;const {from,to}=view.state.selection.main;const selection=view.state.sliceDoc(from,to);const insert=before+(selection||fallback)+after;view.dispatch({changes:{from,to,insert},selection:{anchor:from+before.length,head:from+before.length+(selection||fallback).length}});view.focus();}
  async function importFile(file?:File) { if (!file) return; if(file.size>2_000_000){flash('2MB 이하의 Markdown 파일을 열어주세요.');return;}try{const content=await file.text();setDraft(d=>({...d,text:content,title:file.name.replace(/\.(md|markdown|txt)$/i,'')}));setMode('edit');flash('파일을 열었습니다.');}catch{flash('파일을 열지 못했습니다. 다시 선택해주세요.');} }
  async function readySheet() {
    if (!sheet.current) throw new Error('미리보기를 불러오지 못했습니다.');
    await document.fonts.ready;
    const images = Array.from(sheet.current.querySelectorAll('img'));
    await Promise.all(images.map(async img=>{try{await img.decode();}catch{throw new Error('불러오지 못한 이미지가 있습니다. 이미지 주소를 확인해주세요.');}}));
    return sheet.current;
  }
  async function imageBlob() { const node=await readySheet();if(node.scrollHeight>14000)throw new Error('이미지로 담기에는 글이 너무 깁니다. 문서를 나눠서 내보내주세요.');const blob=await toBlob(node,{pixelRatio:2,backgroundColor:'#ffffff',fontEmbedCSS:await documentFonts(node)});if(!blob)throw new Error('이미지를 만들지 못했습니다.');return blob; }
  async function exportImage(copy:boolean) {setExportMenu(false);setBusy(copy?'이미지 복사':'PNG 저장');try{
    if(copy && 'ClipboardItem' in window && navigator.clipboard?.write){ const promise=imageBlob(); await navigator.clipboard.write([new ClipboardItem({'image/png':promise})]);flash('이미지를 복사했습니다. 원하는 곳에 붙여넣으세요.'); }
    else {saveFile(await imageBlob(),`${filename}.png`);flash(copy?'이 브라우저에서는 이미지 복사를 지원하지 않아 PNG로 저장했습니다.':'PNG 이미지를 저장했습니다.');}
  }catch(error){flash(error instanceof Error && !['NotAllowedError','SecurityError'].includes(error.name)?error.message:'이미지 복사가 허용되지 않았습니다. 내보내기에서 PNG 저장을 선택해주세요.');}finally{setBusy('');}}
  async function exportPdf() {setBusy('PDF 다운로드');setExportMenu(false);try{
    const node=await readySheet();if(node.scrollHeight>28000)throw new Error('한 번에 내보낼 수 있는 길이를 넘었습니다. 문서를 나눠주세요.');
    const canvas=await toCanvas(node,{pixelRatio:2,backgroundColor:'#ffffff',fontEmbedCSS:await documentFonts(node)});
    const { jsPDF } = await import('jspdf');
    const pdf=new jsPDF({unit:'mm',format:'a4'});pdf.setProperties({title:filename,creator:'여백'});
    const margin=12,contentWidth=186,contentHeight=273,scale=contentWidth/canvas.width;
    const maxSlice=Math.floor(contentHeight/scale);
    const ctx=canvas.getContext('2d',{willReadFrequently:true})!;
    // Break pages on blank scanlines so a line of Korean text is not cut in half.
    let offset=0;let page=0;
    while(offset<canvas.height){let height=Math.min(maxSlice,canvas.height-offset);if(offset+height<canvas.height){const search=Math.min(160,height);const pixels=ctx.getImageData(0,offset+height-search,canvas.width,search).data;for(let y=search-1;y>=0;y--){let blank=true;for(let x=0;x<canvas.width;x+=2){const i=(y*canvas.width+x)*4;if(pixels[i]<245||pixels[i+1]<245||pixels[i+2]<245){blank=false;break;}}if(blank){height=height-search+y+1;break;}}}const part=document.createElement('canvas');part.width=canvas.width;part.height=height;part.getContext('2d')!.drawImage(canvas,0,offset,canvas.width,height,0,0,canvas.width,height);if(page++)pdf.addPage();pdf.addImage(part,'PNG',margin,margin,contentWidth,height*scale,undefined,'FAST');offset+=height;}
    pdf.save(`${filename}.pdf`);flash('PDF를 다운로드했습니다.');
  }catch(error){flash(error instanceof Error?error.message:'PDF를 만들지 못했습니다. 다시 시도해주세요.');}finally{setBusy('');}}
  function updateSettings(patch:Partial<Settings>){setDraft(d=>({...d,settings:{...d.settings,...patch}}));}
  const paperStyle = {'--document-size':`${settings.size}px`,'--document-leading':settings.leading,'--document-width':`${settings.width}px`} as React.CSSProperties;
  const renderMarkdown = <ReactMarkdown remarkPlugins={[remarkGfm,remarkMath]} rehypePlugins={[rehypeKatex]} components={{img:props=><img {...props} crossOrigin="anonymous"/>}}>{text}</ReactMarkdown>;
  return <div className="app">
    <header className="topbar"><a className="brand" href="/" aria-label="여백 홈"><span className="brand-mark"><FileText size={21} strokeWidth={1.4}/></span><span className="brand-name">여백</span><span className="brand-caption">Markdown on paper</span></a><div className="file-actions"><Button variant="ghost" onClick={()=>importer.current?.click()} title="Markdown 파일 열기"><FolderOpen size={16}/><span>열기</span></Button><Button variant="ghost" onClick={()=>setConfirmNew(true)}><Plus size={16}/><span>새 문서</span></Button></div></header>
    <main>
      <div className="document-bar"><div className="document-identity"><input className="title-input" aria-label="문서 이름" value={title} placeholder="제목 없는 문서" onChange={e=>setDraft(d=>({...d,title:e.target.value}))}/><span className="save-state"><span className={saved?'save-dot':'save-dot pending'}/>{saved?'이 브라우저에 저장됨':'저장 중'}</span></div><div className="export-actions"><Button variant="hairline" disabled={!!busy} onClick={()=>{setMode('preview');void exportImage(true);}}><Copy size={15}/><span>이미지 복사</span></Button><div className="popover-anchor" ref={exportRef}><Button disabled={!!busy} onClick={()=>setExportMenu(v=>!v)} aria-expanded={exportMenu} aria-haspopup="menu"><ArrowDownToLine size={15}/><span>{busy||'내보내기'}</span><ChevronDown size={13}/></Button>{exportMenu&&<div className="popover export-menu" role="menu"><button role="menuitem" onClick={()=>{setMode('preview');void exportPdf();}}><FileText size={17}/><span>PDF 다운로드<small>A4 · 현재 미리보기 서식</small></span></button><button role="menuitem" onClick={()=>{setMode('preview');void exportImage(false);}}><Image size={17}/><span>PNG 이미지 저장<small>선명한 2배 해상도</small></span></button><button role="menuitem" onClick={()=>{saveFile(new Blob([text],{type:'text/markdown;charset=utf-8'}),`${filename}.md`);setExportMenu(false);}}><Code2 size={17}/><span>Markdown 저장<small>원본 .md 파일</small></span></button></div>}</div></div></div>
      <div className="workspace-bar"><div className="mode-switch" role="group" aria-label="문서 모드"><button className={mode==='edit'?'active':''} aria-pressed={mode==='edit'} onClick={()=>setMode('edit')}><PenLine size={15}/>편집</button><button className={mode==='preview'?'active':''} aria-pressed={mode==='preview'} onClick={()=>setMode('preview')}><Eye size={16}/>미리보기</button></div>{mode==='preview'?<div className="preview-controls"><div className="font-switch" role="group" aria-label="미리보기 서체">{([{value:'sans',label:'Sans'},{value:'serif',label:'Serif'},{value:'myeongjo',label:'명조'}] as const).map(font=><button key={font.value} className={`font-${font.value} ${settings.font===font.value?'active':''}`} aria-pressed={settings.font===font.value} onClick={()=>updateSettings({font:font.value})}>{font.label}</button>)}</div><span className="control-divider"/><div className="popover-anchor" ref={settingsRef}><Button variant="ghost" onClick={()=>setShowSettings(v=>!v)} aria-label="미리보기 서식" aria-expanded={showSettings}><SlidersHorizontal size={16}/><span className="format-label">서식</span></Button>{showSettings&&<div className="popover settings-panel"><h3>종이 위의 글</h3><label>글자 크기<select value={settings.size} onChange={e=>updateSettings({size:Number(e.target.value)})}>{[15,17,19,21].map(v=><option key={v} value={v}>{v}px</option>)}</select></label><label>줄 간격<select value={settings.leading} onChange={e=>updateSettings({leading:Number(e.target.value)})}><option value={1.6}>촘촘하게</option><option value={1.9}>편안하게</option><option value={2.2}>넉넉하게</option></select></label><label>종이 너비<select value={settings.width} onChange={e=>updateSettings({width:Number(e.target.value)})}><option value={640}>좁게</option><option value={760}>기본</option><option value={880}>넓게</option></select></label><button className="reset-format" onClick={()=>updateSettings(DEFAULTS)}>기본 서식으로 돌아가기</button></div>}</div></div>:<div className="format-toolbar" aria-label="Markdown 도구">{[{icon:Heading2,label:'제목',before:'## ',after:''},{icon:Bold,label:'굵게',before:'**',after:'**'},{icon:Italic,label:'기울임',before:'*',after:'*'},{icon:Quote,label:'인용',before:'> ',after:''},{icon:List,label:'목록',before:'- ',after:''},{icon:Link,label:'링크',before:'[',after:'](https://example.com)'},{icon:Code2,label:'코드',before:'`',after:'`'}].map(item=><button key={item.label} title={item.label} aria-label={item.label} onClick={()=>format(item.before,item.after)}><item.icon size={17}/></button>)}<span className="control-divider"/><button aria-label="실행 취소" title="실행 취소" onClick={()=>{const v=editor.current?.view;if(v)undo(v);}}><Undo2 size={16}/></button><button aria-label="다시 실행" title="다시 실행" onClick={()=>{const v=editor.current?.view;if(v)redo(v);}}><Redo2 size={16}/></button></div>}</div>
      <div className="paper-stage" style={paperStyle}><div className="paper-topline"><span>{mode==='preview'?'읽는 시간':'쓰는 시간'}</span><span>{Math.max(1,Math.ceil(wordCount/200))}분 분량</span></div><div className={`paper ${mode==='edit'?'editing':''}`}>
        {mode==='edit'&&<div className="editor-area"><CodeMirror ref={editor} value={text} onChange={value=>setDraft(d=>({...d,text:value}))} extensions={[markdown(),EditorView.lineWrapping,editorTheme]} basicSetup={{lineNumbers:false,foldGutter:false,highlightActiveLine:false,highlightActiveLineGutter:false}} placeholder="첫 문장을 적어보세요…" aria-label="Markdown 편집기"/></div>}
        <article ref={sheet} className={`markdown-body font-${settings.font} ${mode==='edit'?'export-only':''}`} aria-label="문서 미리보기" aria-hidden={mode==='edit'}>{text.trim()?renderMarkdown:<p className="empty-preview">아직 빈 종이입니다.<br/>편집 모드에서 첫 문장을 적어보세요.</p>}</article>
      </div><footer className="paper-footer"><span>{wordCount.toLocaleString()}단어 <span className="footer-separator">/</span> {charCount.toLocaleString()}자</span><span>글을 위한 작은 여백</span></footer></div>
      <footer className="app-footer"><span>자동 저장은 이 브라우저에만 남습니다.</span><span className="shortcut-hint">⌘ / Ctrl S로 원본 저장</span></footer>
    </main><input ref={importer} type="file" accept=".md,.markdown,.txt,text/markdown,text/plain" hidden onChange={e=>{void importFile(e.target.files?.[0]);e.target.value='';}}/>
    {notice&&<div className="toast" role="status"><Check size={17}/><span>{notice}</span><button aria-label="알림 닫기" onClick={()=>setNotice('')}><X size={14}/></button></div>}
    {confirmNew&&<dialog className="new-dialog" onCancel={()=>setConfirmNew(false)}><h2>새 종이를 펼칠까요?</h2><p>현재 글은 새 문서로 바뀝니다.<br/>간직하려면 먼저 Markdown 파일로 저장해주세요.</p><div className="dialog-actions"><Button variant="ghost" onClick={()=>setConfirmNew(false)}>취소</Button><Button variant="hairline" onClick={()=>{saveFile(new Blob([text],{type:'text/markdown;charset=utf-8'}),`${filename}.md`);}}>현재 글 저장</Button><Button onClick={()=>{setDraft({text:'',title:'제목 없는 문서',settings});setMode('edit');setConfirmNew(false);}}>새 문서</Button></div></dialog>}
  </div>;
}
