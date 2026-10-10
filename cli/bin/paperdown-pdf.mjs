#!/usr/bin/env node
import { readFile, writeFile, stat } from 'node:fs/promises';
import { dirname, resolve, extname, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { chromium } from 'playwright-core';
import { options, help } from '../lib/options.mjs';
import { imageSource } from '../lib/assets.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'../renderer');
const manifest=JSON.parse(await readFile(new URL('../package.json',import.meta.url),'utf8'));
async function main() {
  const o=options(process.argv.slice(2));
  if(o.values.help) {console.log(help);return;}
  if(o.values.version) {console.log(manifest.version);return;}
  if(o.output!=='-' && !o.values.force) {
    try {await stat(o.output);throw new Error('Output already exists. Use --force to replace it.');}
    catch(e) {if(e.code!=='ENOENT') throw e;}
  }
  let source;
  if(o.input==='-') {const chunks=[];let size=0;for await(const chunk of process.stdin) {size+=chunk.length;if(size>100_000_000) throw new Error('Input exceeds 100MB.');chunks.push(chunk);}source=Buffer.concat(chunks).toString('utf8');}
  else {if((await stat(o.input)).size>100_000_000) throw new Error('Input exceeds 100MB.');source=await readFile(o.input,'utf8');}
  if(Buffer.byteLength(source)>100_000_000) throw new Error('Input exceeds 100MB.');
  let document;
  if(o.input!=='-' && o.input.endsWith('.json')) {
    document=JSON.parse(source);
    if(document.version!==1 || !document.content || document.content.type!=='doc') throw new Error('Expected a Paperdown document JSON file.');
  } else document={version:1,title:o.title,markdown:source,settings:{paper:'a4',mode:'pages',font:'myeongjo'}};
  document.settings={...document.settings,...o.settings};
  if(o.values.title) document.title=o.values.title;
  if(document.settings.margin && document.settings.paper==='custom' && (document.settings.width<=2*document.settings.margin || document.settings.height<=2*document.settings.margin)) throw new Error('Margins must leave room for page content.');
  const token=randomBytes(16).toString('hex');
  const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf'};
  const server=createServer(async(req,res)=> {
    try {
      const path=new URL(req.url,'http://localhost').pathname;
      if(!path.startsWith(`/${token}/`)) {res.writeHead(404);res.end();return;}
      const file=resolve(root,decodeURIComponent(path.slice(token.length+2)));
      if(!file.startsWith(root+sep)) throw new Error('Invalid asset path');
      const bytes=await readFile(file);
      res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(bytes);
    } catch {res.writeHead(404);res.end();}
  });
  let browser;
  try {
    await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
    const origin=`http://127.0.0.1:${server.address().port}`;
    browser=await chromium.launch({headless:true,chromiumSandbox:true,...(o.values.browser?{executablePath:resolve(o.values.browser)}:{channel:'chrome'})});
    const page=await browser.newPage({viewport:{width:2200,height:1400}});
    await page.route('**/*',route=>route.request().url().startsWith(`${origin}/${token}/`) ? route.continue() : route.abort());
    await page.exposeFunction('resolvePaperdownImage',src=>imageSource(src,resolve(o.values['asset-dir']||(o.input==='-'?process.cwd():dirname(o.input))),!!o.values['allow-remote']));
    await page.goto(`${origin}/${token}/cli/render.html`);
    await page.waitForFunction(()=>typeof window.renderPaperdown==='function');
    const result=await page.evaluate(document=>window.renderPaperdown(document),document);
    const bytes=Buffer.from(result.pdf,'base64');
    if(bytes.subarray(0,5).toString()!=='%PDF-') throw new Error('Renderer did not return a PDF.');
    if(o.output==='-') await new Promise((resolve,reject)=>process.stdout.write(bytes,e=>e?reject(e):resolve()));
    else await writeFile(o.output,bytes,{flag:o.values.force?'w':'wx'});
    console.error(`Paperdown: ${result.pages} page(s), ${result.width} × ${result.height} mm → ${o.output}`);
  } finally {
    if(browser) await browser.close();
    server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(e=>{console.error(`paperdown-pdf: ${e.message}`);process.exitCode=1;});
