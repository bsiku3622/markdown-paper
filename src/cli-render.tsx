import React from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { PaperProvider } from '@studio-baeks/paper-ui';
import '@studio-baeks/paper-ui/styles.css';
import 'pretendard/dist/web/variable/pretendardvariable.css';
import './fonts.css';
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
import { preparePdf } from './pdf-document';

declare global {
  interface Window {
    resolvePaperdownImage: (source: string) => Promise<string>;
    renderPaperdown: (document: DocumentData) => Promise<{pages:number;width:number;height:number}>;
  }
}
flushSync(()=>createRoot(document.getElementById('root')!).render(<PaperProvider defaultTheme="light"><div id="paperdown-render"/></PaperProvider>));
window.renderPaperdown=async value=> {
  const doc=normalize(value), s=doc.settings, dim=dimensions(s), px=96/25.4;
  const host=document.getElementById('paperdown-render')!;
  const editor=new Editor({element:host,editable:false,extensions:[
    StarterKit,Markdown,TableKit.configure({table:{resizable:true}}),TaskList,TaskItem.configure({nested:true}),Image.configure({allowBase64:true}),
    TextAlign.configure({types:['heading','paragraph']}),TextStyleKit,Highlight.configure({HTMLAttributes:{class:'text-highlight'}}),
    Mathematics.configure({katexOptions:{throwOnError:false}}),
    pagination(()=>({enabled:s.mode==='pages',height:dim.height*px,margin:s.margin*px,gap:24})),
  ],content:doc.content||doc.markdown,contentType:doc.content?'json':'markdown',editorProps:{attributes:{class:'document-content'}}});
  const node=editor.view.dom as HTMLElement;
  node.style.cssText=`width:${dim.width*px}px;--doc-font:${FONTS[s.font]};--doc-size:${s.sizePt}pt;--doc-leading:${s.leading};--doc-margin:${s.margin*px}px;--doc-height:${s.mode==='pages'?`${dim.height*px}px`:'0px'};--page-content-height:${s.mode==='pages'?`${(dim.height-2*s.margin)*px}px`:'none'};`;
  node.querySelectorAll<HTMLElement>(".ProseMirror-separator").forEach(el => {el.style.cssText="display:inline!important;width:0;height:0;margin:0!important;padding:0;border:0";});
  try {
    await Promise.all(Array.from(node.querySelectorAll<HTMLImageElement>('img:not(.ProseMirror-separator)')).map(async img=>{if(!img.getAttribute('src')) throw new Error('Image has no source URL.');img.src=await window.resolvePaperdownImage(img.getAttribute('src')!);await img.decode();}));
    const print=await preparePdf(node,s,1);
    document.title=doc.title;
    return {pages:print.pages,width:print.width,height:print.height};
  } finally {editor.destroy();}
};
