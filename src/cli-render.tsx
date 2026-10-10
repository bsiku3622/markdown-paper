import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { PaperProvider } from '@studio-baeks/paper-ui';
import '@studio-baeks/paper-ui/styles.css';
import 'pretendard/dist/web/variable/pretendardvariable.css';
import '@fontsource/noto-serif-kr/400.css';
import '@fontsource/noto-serif-kr/600.css';
import 'katex/dist/katex.min.css';
import './style.css';
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';
import { TableKit } from '@tiptap/extension-table';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Image from '@tiptap/extension-image';
import TextAlign from '@tiptap/extension-text-align';
import { TextStyleKit } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Mathematics from '@tiptap/extension-mathematics';
import { dimensions, FONTS, normalize, type DocumentData } from './document';
import { pagination } from './pagination';
import { pdf } from './export-document';

declare global {
  interface Window {
    resolvePaperdownImage: (source: string) => Promise<string>;
    renderPaperdown: (document: DocumentData) => Promise<{pdf:string;pages:number;width:number;height:number}>;
  }
}
flushSync(()=>createRoot(document.getElementById('root')!).render(<PaperProvider defaultTheme="light"><div id="paperdown-render"/></PaperProvider>));
window.renderPaperdown=async value=> {
  const doc=normalize(value), s=doc.settings, dim=dimensions(s), px=96/25.4;
  const host=document.getElementById('paperdown-render')!;
  const editor=new Editor({element:host,editable:false,extensions:[
    StarterKit,Markdown,TableKit,TaskList,TaskItem.configure({nested:true}),Image.configure({allowBase64:true}),
    TextAlign.configure({types:['heading','paragraph']}),TextStyleKit,Highlight.configure({HTMLAttributes:{class:'text-highlight'}}),
    Mathematics.configure({katexOptions:{throwOnError:false}}),
    pagination(()=>({enabled:s.mode==='pages',height:dim.height*px,margin:s.margin*px,gap:24})),
  ],content:doc.content||doc.markdown,contentType:doc.content?'json':'markdown',editorProps:{attributes:{class:'document-content'}}});
  const node=editor.view.dom as HTMLElement;
  node.style.cssText=`width:${dim.width*px}px;--doc-font:${FONTS[s.font]};--doc-size:${s.sizePt}pt;--doc-leading:${s.leading};--doc-margin:${s.margin*px}px;--doc-height:${s.mode==='pages'?`${dim.height*px}px`:'0px'};--page-content-height:${s.mode==='pages'?`${(dim.height-2*s.margin)*px}px`:'none'};`;
  node.querySelectorAll<HTMLElement>(".ProseMirror-separator").forEach(el => {el.style.cssText="display:inline!important;width:0;height:0;margin:0!important;padding:0;border:0";});
  try {
    await Promise.all(Array.from(node.querySelectorAll<HTMLImageElement>('img:not(.ProseMirror-separator)')).map(async img=>{if(!img.getAttribute('src')) throw new Error('Image has no source URL.');img.src=await window.resolvePaperdownImage(img.getAttribute('src')!);await img.decode();}));
    await document.fonts.ready;
    // Pagination measures after fonts/images settle; wait until layout stops changing.
    let last='',stable=0;
    for(let i=0;i<180;i++) {
      await new Promise(resolve=>requestAnimationFrame(resolve));
      const signature=`${node.scrollHeight}:${Array.from(node.querySelectorAll('[data-page-spacer]')).map(el=>el.getAttribute('data-page-spacer')).join(',')}`;
      stable=signature===last?stable+1:0;last=signature;
      if(stable>=5) break;
      if(i===179) throw new Error('Page layout did not stabilize.');
    }
    const pages=s.mode==='pages'?Math.max(1,Math.ceil((node.scrollHeight+24-0.5)/(dim.height*px+24))):1;
    const buffer=await pdf(node,s,pages,doc.title,false);
    if(!buffer) throw new Error('No PDF output.');
    const bytes=new Uint8Array(buffer);let binary='';
    for(let i=0;i<bytes.length;i+=32768) binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
    return {pdf:btoa(binary),pages,width:dim.width,height:s.mode==='pages'?dim.height:Math.round(node.scrollHeight/px*100)/100};
  } finally {editor.destroy();}
};
