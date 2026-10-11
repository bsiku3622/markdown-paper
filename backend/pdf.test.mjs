import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePdf, renderPdf } from './pdf.mjs';
const value={html:'<section class="pdf-page">한글 ABC</section>',title:'문서',width:210,height:297,pages:1};
test('PDF jobs bound page geometry, job size and title before launching Chrome',()=>{
  assert.equal(validatePdf(value),value);
  for(const input of [null,{...value,width:NaN},{...value,width:501},{...value,height:5001},{...value,pages:1.5},{...value,pages:201},{...value,title:'x'.repeat(201)},{...value,html:'x'.repeat(40_000_001)}]) assert.throws(()=>validatePdf(input));
});

const output = process.env.PAPERDOWN_PDF_TEST_DIR;
test('server PDF embeds document fonts and exports styled searchable text', {skip:!output, timeout:60_000}, async () => {
  const {writeFile} = await import('node:fs/promises');
  const {join} = await import('node:path');
  const {execFileSync} = await import('node:child_process');
  const pdf = join(output,'server-native-regression.pdf');
  const bytes = await renderPdf({...value, html:'<section class="pdf-page" style="width:793.7px;height:1122.5px"><p style="font-family:KoPub Batang;font-size:15px">한글 English SERVERMARKER</p></section>'});
  await writeFile(pdf,bytes);
  assert.match(execFileSync('pdftotext',[pdf,'-'],{encoding:'utf8'}), /한글 English SERVERMARKER/);
  assert.match(execFileSync('pdffonts',[pdf],{encoding:'utf8'}), /KoPubBatang/);
  assert.equal(execFileSync('pdfimages',['-list',pdf],{encoding:'utf8'}).trim().split('\n').length,2);
  assert.match(execFileSync('pdfinfo',[pdf],{encoding:'utf8'}),/Pages:\s+1/);
});
