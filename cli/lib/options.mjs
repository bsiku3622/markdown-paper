import { parseArgs } from 'node:util';
import { basename, resolve } from 'node:path';

export const help = `Paperdown PDF · Markdown and Paperdown documents to PDF

Usage: paperdown-pdf <input.md|input.paperdown.json|-> [options]

  -o, --output PATH     Output PDF (default: next to input; - for stdout)
      --paper SIZE      a4, a5, letter, custom (Markdown default: a4)
      --font FONT       myeongjo, sans (Markdown default: myeongjo)
      --mode MODE       pages, continuous (Markdown default: pages)
      --size PT         Body font size, 6–96 (default: 10)
      --margin MM       Page margin, 5–50 (default: 20)
      --leading NUMBER  Line height, 1–3 (default: 1.6)
      --width MM        Custom page width, 80–500
      --height MM       Custom page height, 80–2000
      --landscape       Landscape pages
      --title TEXT      PDF title metadata (does not insert a heading)
      --asset-dir PATH  Base directory for local images (default: input folder)
      --allow-remote    Download public HTTP(S) images referenced in input
      --browser PATH    Chrome/Chromium executable (default: installed Chrome)
      --force           Replace an existing output PDF
  -h, --help            Show help
  -v, --version         Show version

Myeongjo: KoPub Batang for Latin and Korean.
Uses the Paperdown raster PDF renderer; text is not selectable.
Document JSON keeps its saved page settings unless overridden.
`;

export function options(args, cwd = process.cwd()) {
  const { values, positionals } = parseArgs({args,allowPositionals:true,options:{
    output:{type:'string',short:'o'},paper:{type:'string'},font:{type:'string'},mode:{type:'string'},
    size:{type:'string'},margin:{type:'string'},leading:{type:'string'},width:{type:'string'},height:{type:'string'},
    landscape:{type:'boolean'},title:{type:'string'},'asset-dir':{type:'string'},'allow-remote':{type:'boolean'},
    browser:{type:'string'},force:{type:'boolean'},help:{type:'boolean',short:'h'},version:{type:'boolean',short:'v'},
  }});
  if (values.help || values.version) return {values};
  if (positionals.length !== 1) throw new Error('Specify one input file, or - for stdin. Run paperdown-pdf --help.');
  const settings = {};
  for (const [key,choices] of Object.entries({paper:['a4','a5','letter','custom'],font:['myeongjo','sans'],mode:['pages','continuous']})) {
    if (values[key]) {
      const value=values[key].toLowerCase();
      if (!choices.includes(value)) throw new Error(`--${key} must be ${choices.join(', ')}.`);
      settings[key]=value;
    }
  }
  for (const [flag,key,min,max] of [['size','sizePt',6,96],['margin','margin',5,50],['leading','leading',1,3],['width','width',80,500],['height','height',80,2000]]) {
    if (values[flag] !== undefined) {
      const number=Number(values[flag]);
      if (!Number.isFinite(number) || !values[flag].trim() || number<min || number>max) throw new Error(`--${flag} must be between ${min} and ${max}.`);
      settings[key]=number;
    }
  }
  if ((settings.width || settings.height) && settings.paper !== 'custom') throw new Error('--width and --height require --paper custom.');
  if (values.landscape) settings.landscape=true;
  const input=positionals[0]==='-' ? '-' : resolve(cwd,positionals[0]);
  const defaultOutput=input==='-' ? resolve(cwd,'paperdown.pdf') : input.replace(/(?:\.paperdown)?\.(?:md|markdown|txt|json)$/i,'')+'.pdf';
  const output=values.output==='-' ? '-' : resolve(cwd,values.output || defaultOutput);
  if (input!=='-' && output===input) throw new Error('Input and output paths must be different.');
  return {values,input,output,settings,title:values.title || (input==='-'?'Paperdown':basename(input).replace(/(?:\.paperdown)?\.[^.]+$/,''))};
}
