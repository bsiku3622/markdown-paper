import type { DocumentData } from './document';
export const API = (import.meta.env.VITE_API_URL || 'https://paperdown-api.bsiku.dev').replace(/\/$/, '');
export const COLLAB_URL = `${API.replace(/^http/, 'ws')}/collab`;
export type PublicUser = { id: string; username: string; nickname: string; avatar: string | null };
export type User = PublicUser & { google: boolean; hasPassword: boolean };
export type Role = 'owner' | 'editor' | 'viewer';
export type Member = PublicUser & { role: 'editor' | 'viewer' };
export type NoteSummary = { id: string; title: string; revision: number; updatedAt: number; role: Role; shared: boolean; owner?: PublicUser };
export type Note = NoteSummary & { document: DocumentData; members?: Member[] };
export class ApiError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
export async function api<T>(path: string, method = 'GET', value?: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API}${path}`, { method, credentials: 'include', headers: value === undefined ? {} : { 'Content-Type': 'application/json' }, body: value === undefined ? undefined : JSON.stringify(value), signal: AbortSignal.timeout(20_000) });
  } catch { throw new ApiError(0, '서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.'); }
  const result = await response.json();
  if (!response.ok) throw new ApiError(response.status, result.error || '요청을 처리하지 못했습니다.');
  return result;
}
async function upload<T>(path: string, method: string, blob: Blob, fallback: string): Promise<T> {
  let response: Response;
  try { response = await fetch(`${API}${path}`, { method, credentials:'include', headers:{'Content-Type':blob.type}, body:blob, signal:AbortSignal.timeout(30_000) }); }
  catch { throw new ApiError(0, '서버에 연결하지 못했습니다. 잠시 후 다시 시도해주세요.'); }
  const data = await response.json();
  if (!response.ok) throw new ApiError(response.status, data.error || fallback);
  return data;
}
// Linking an upload to its note lets everyone the note is shared with see the image.
export async function uploadImage(blob: Blob, noteId?: string): Promise<string> {
  return (await upload<{url:string}>(`/files${noteId ? `?note=${noteId}` : ''}`, 'POST', blob, '이미지를 저장하지 못했습니다.')).url;
}
export async function uploadAvatar(blob: Blob): Promise<User> {
  return (await upload<{user:User}>('/me/avatar', 'PUT', blob, '사진을 저장하지 못했습니다.')).user;
}
// Drafts written by the earlier whole-document autosave. Live notes no longer create them,
// but an unsynced one from before the switch is offered for recovery instead of being dropped.
export type Draft = { document: DocumentData; revision: number; dirty: boolean };
const store = () => new Promise<IDBDatabase>((resolve,reject)=> {
  const request = indexedDB.open('paperdown-account-drafts',1);
  request.onupgradeneeded = () => request.result.createObjectStore('drafts');
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});
export async function earlierDraft(userId: string, noteId: string, remove = false): Promise<Draft | undefined> {
  const db = await store();
  return new Promise((resolve,reject)=> {
    const tx = db.transaction('drafts',remove ? 'readwrite':'readonly');
    const request = remove ? tx.objectStore('drafts').delete(`${userId}:${noteId}`) : tx.objectStore('drafts').get(`${userId}:${noteId}`);
    let result: Draft | undefined;
    request.onsuccess = () => { if (!remove) result = request.result; };
    tx.oncomplete = () => { db.close(); resolve(result); };
    tx.onerror = () => { db.close(); reject(tx.error); };
  });
}
