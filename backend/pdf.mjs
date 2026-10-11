import { createServer } from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { randomBytes } from 'node:crypto';
import { pdfOptions } from '../cli/lib/pdf.mjs';
const require = createRequire(new URL('../cli/package.json', import.meta.url));
const renderer = fileURLToPath(new URL('../cli/renderer/', import.meta.url));
const types = {'.css':'text/css','.woff2':'font/woff2','.woff':'font/woff','.ttf':'font/ttf','.otf':'font/otf'};
const escape = text => text.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
let jobs = 0;
export function validatePdf(value) {
  if (!value || typeof value.html !== 'string' || Buffer.byteLength(value.html) > 40_000_000 || typeof value.title !== 'string' || value.title.length > 200) throw new Error('올바른 PDF 문서가 아닙니다.');
  for (const [key,min,max] of [['width',80,500],['height',20,5000],['pages',1,200]]) if (!Number.isFinite(value[key]) || value[key] < min || value[key] > max) throw new Error('PDF 페이지 크기와 수를 확인해주세요.');
  if (!Number.isInteger(value.pages)) throw new Error('PDF 페이지 수를 확인해주세요.');
  return value;
}
export async function renderPdf(input) {
  const value = validatePdf(input);
  if (jobs >= 2) { const error = new Error('다른 PDF를 출력 중입니다. 잠시 후 다시 시도해주세요.'); error.status = 429; throw error; }
  jobs++;
  let browser, server;
  try {
    const css = (await readdir(join(renderer,'assets'))).find(name => !name.startsWith('.') && name.endsWith('.css'));
    if (!css) throw new Error('PDF renderer assets are missing.');
    const token = randomBytes(16).toString('hex');
    server = createServer(async (req,res) => {
      try {
        const path = new URL(req.url,'http://localhost').pathname;
        res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'none'; style-src 'self' 'unsafe-inline'; font-src 'self'; img-src data:; base-uri 'none'; form-action 'none'");
        res.setHeader('Cache-Control','no-store');
        if (path === `/${token}/document`) {
          res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});
          res.end(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${escape(value.title)}</title><link rel="stylesheet" href="/${token}/assets/${css}"><style>@page{size:${value.width}mm ${value.height}mm;margin:0}html,body{margin:0;padding:0;background:white}.pdf-output{display:block!important}</style></head><body><div class="pdf-output">${value.html}</div></body></html>`);return;
        }
        const prefix = `/${token}/assets/`;
        const name = path.startsWith(prefix) ? path.slice(prefix.length) : '';
        const match = name.match(/^[a-zA-Z0-9._-]+(\.css|\.woff2|\.woff|\.ttf|\.otf)$/);
        if (!match) {res.writeHead(404);res.end();return;}
        const bytes = await readFile(join(renderer,'assets',name));
        res.writeHead(200,{'Content-Type':types[match[1]]});res.end(bytes);
      } catch {res.writeHead(404);res.end();}
    });
    await new Promise((resolve,reject) => {server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
    const origin = `http://127.0.0.1:${server.address().port}`;
    const {chromium} = require('playwright-core');
    browser = await chromium.launch({headless:true,chromiumSandbox:true,args:['--font-render-hinting=none'],...(process.env.PDF_BROWSER ? {executablePath:resolve(process.env.PDF_BROWSER)} : process.platform==='darwin'?{channel:'chrome'}:{})});
    const context = await browser.newContext({javaScriptEnabled:false});
    await context.route('**/*',route => route.request().url().startsWith(`${origin}/${token}/`) ? route.continue() : route.abort());
    const page = await context.newPage();
    page.setDefaultTimeout(35_000);
    const render = async () => {
      await page.goto(`${origin}/${token}/document`,{waitUntil:'load'});
      await page.evaluate(async () => {
        const stylesheet = document.querySelector('link[rel="stylesheet"]');
        if (!stylesheet?.sheet || ![...document.styleSheets].some(sheet => sheet.href && sheet.cssRules.length)) throw new Error('PDF stylesheet failed to load.');
        await document.fonts.ready;
        if (![...document.fonts].length || [...document.fonts].some(font => font.status === 'error')) throw new Error('PDF fonts failed to load.');
        await Promise.all([...document.images].map(img => img.decode()));
      });
      return page.pdf({...pdfOptions,timeout:35_000});
    };
    let timer;
    try {return await Promise.race([render(),new Promise((_,reject) => {timer=setTimeout(()=>reject(new Error('PDF 출력 시간이 초과되었습니다.')),45_000);})]);}
    finally {clearTimeout(timer);}
  } finally {
    if (browser) await browser.close().catch(()=>{});
    if (server) {server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
    jobs--;
  }
}
