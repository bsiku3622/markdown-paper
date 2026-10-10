import type { DocumentData } from './document';
export const API = (import.meta.env.VITE_API_URL || 'https://paperdown-api.bsiku.dev').replace(/\/$/, '');
export type User = { id: string; username: string };
export type NoteSummary = { id: string; title: string; revision: number; updatedAt: number };
export type Note = NoteSummary & { document: DocumentData };
export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function api<T>(path: string, method = 'GET', value?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API}${path}`, { method, credentials: 'include', headers: value === undefined ? {} : { 'Content-Type': 'application/json' }, body: value === undefined ? undefined : JSON.stringify(value), signal: AbortSignal.timeout(20_000) });
  } catch { throw new ApiError(0, '서버에 연결하지 못했습니다. 초안은 이 기기에 보관됩니다.'); }
  const result = await response.json();
  if (!response.ok) throw new ApiError(response.status, result.error || '요청을 처리하지 못했습니다.');
  return result;
}
export async function uploadImage(blob: Blob): Promise<string> {
  const response = await fetch(`${API}/files`, { method:'POST',credentials:'include',headers:{'Content-Type':blob.type},body:blob,signal:AbortSignal.timeout(30_000) });
  const data = await response.json();
  if (!response.ok) throw new ApiError(response.status,data.error || '이미지를 저장하지 못했습니다.');
  return data.url;
}
export type Draft = { document: DocumentData; revision: number; dirty: boolean };
const store = new Promise<IDBDatabase>((resolve,reject)=> {
  const request = indexedDB.open('paperdown-account-drafts',1);
  request.onupgradeneeded = () => request.result.createObjectStore('drafts');
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});
export async function draft(userId: string, noteId: string, value?: Draft): Promise<Draft | undefined> {
  const db = await store;
  return new Promise((resolve,reject)=> {
    const tx = db.transaction('drafts',value ? 'readwrite':'readonly');
    const request = value ? tx.objectStore('drafts').put(value,`${userId}:${noteId}`) : tx.objectStore('drafts').get(`${userId}:${noteId}`);
    let result: Draft | undefined;
    request.onsuccess = () => { if (!value) result = request.result; };
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error);
  });
}
