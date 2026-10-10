import type { JSONContent } from '@tiptap/core';
import type { DocumentData } from './document';
import { API } from './cloud';

export async function portableDocument(document: DocumentData): Promise<DocumentData> {
  const copy = structuredClone(document);
  const sources = new Map<string, string>();
  async function visit(node: JSONContent) {
    const src = node.type === 'image' ? node.attrs?.src : undefined;
    if (typeof src === 'string' && src.startsWith(`${API}/files/`)) {
      if (!sources.has(src)) {
        const encoded = await privateImageData(src);
        sources.set(src,encoded);
      }
      node.attrs = {...node.attrs,src:sources.get(src)};
    }
    for (const child of node.content || []) await visit(child);
  }
  if (copy.content) await visit(copy.content);
  for (const [src,encoded] of sources) copy.markdown = copy.markdown.replaceAll(src,encoded);
  return copy;
}

export const isPrivateImage = (src: string) => src.startsWith(`${API}/files/`);
export async function privateImageData(src: string): Promise<string> {
  const response = await fetch(src, {credentials:'include', signal:AbortSignal.timeout(20_000)});
  if (!response.ok) throw new Error('이미지를 내려받지 못했습니다. 로그인과 연결을 확인해주세요.');
  const blob = await response.blob();
  return new Promise<string>((resolve,reject)=> {
    const reader = new FileReader();
    reader.onload = ()=>resolve(reader.result as string);
    reader.onerror = ()=>reject(reader.error);
    reader.readAsDataURL(blob);
  });
}
