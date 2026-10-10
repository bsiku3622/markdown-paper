import { readFile, realpath, stat } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

export function mime(bytes) {
  if (bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))) return 'image/png';
  if (bytes[0]===255 && bytes[1]===216 && bytes[2]===255) return 'image/jpeg';
  if (['GIF87a','GIF89a'].includes(bytes.subarray(0,6).toString())) return 'image/gif';
  if (bytes.subarray(0,4).toString()==='RIFF' && bytes.subarray(8,12).toString()==='WEBP') return 'image/webp';
  throw new Error('Images must be PNG, JPEG, GIF, or WebP.');
}
export async function imageSource(src, directory, allowRemote) {
  if (!src) throw new Error('Image has no source URL.');
  if (src.startsWith('data:image/')) return src;
  let bytes;
  if (/^https?:\/\//i.test(src)) {
    if (!allowRemote) throw new Error(`Remote image requires --allow-remote: ${src}`);
    const response=await fetch(src,{signal:AbortSignal.timeout(20_000)});
    if (!response.ok) throw new Error(`Image download failed (${response.status}). Export account images inside a .paperdown.json document first.`);
    if (Number(response.headers.get('content-length'))>20_000_000) throw new Error('Image exceeds 20MB.');
    const chunks=[];let size=0;
    for await (const chunk of response.body) {
      size+=chunk.length;
      if (size>20_000_000) { await response.body.cancel().catch(()=>{});throw new Error('Image exceeds 20MB.'); }
      chunks.push(chunk);
    }
    bytes=Buffer.concat(chunks);
  } else {
    if (/^[a-z][a-z0-9+.-]*:/i.test(src) && !src.startsWith('file:')) throw new Error(`Unsupported image URL: ${src}`);
    const path=await realpath(src.startsWith('file:') ? fileURLToPath(src) : resolve(directory,decodeURIComponent(src)));
    const base=await realpath(directory);
    const pathFromBase=relative(base,path);
    if (pathFromBase==='..' || pathFromBase.startsWith(`..${sep}`) || isAbsolute(pathFromBase)) throw new Error('Image is outside the asset directory. Set --asset-dir to its containing folder.');
    const info=await stat(path);
    if (!info.isFile() || info.size>20_000_000) throw new Error('Image must be a file of at most 20MB.');
    bytes=await readFile(path);
  }
  return `data:${mime(bytes)};base64,${bytes.toString('base64')}`;
}
