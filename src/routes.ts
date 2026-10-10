export type Route = {kind:'home'} | {kind:'document';id:string} | {kind:'missing'};
export function routeFor(path:string):Route {
  if(path==='/' || path==='') return {kind:'home'};
  const match=path.match(/^\/documents\/([^/]+)\/?$/);
  if(!match) return {kind:'missing'};
  try {const id=decodeURIComponent(match[1]);return /^[a-zA-Z0-9_-]+$/.test(id)?{kind:'document',id}:{kind:'missing'};} catch {return {kind:'missing'};}
}
export function documentPath(id:string) {return `/documents/${encodeURIComponent(id)}`;}
export function navigate(path:string) {
  if(location.pathname===path) return;
  history.pushState(null,'',path);window.dispatchEvent(new PopStateEvent('popstate'));window.scrollTo(0,0);
}
