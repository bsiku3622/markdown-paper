import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync,writeFileSync,readFileSync } from 'node:fs';
import { resolve,join } from 'node:path';
import { execFileSync } from 'node:child_process';
const output=process.env.PAPERDOWN_PDF_TEST_DIR;
test('native PDF retains Korean/Latin text exactly once across page boundaries', {skip:!output,timeout:60_000},()=>{
  mkdirSync(output,{recursive:true});
  const input=join(output,'native-regression.md'),pdf=join(output,'native-regression.pdf');
  writeFileSync(input,'# 한글 English PDF\n\n'+Array.from({length:45},(_,i)=>`MARKER${String(i).padStart(3,'0')} 한글 본문 English text. 페이지 경계를 지나도 글자가 유지되어야 합니다. `+'내용을 확인합니다. '.repeat(12)).join('\n\n'));
  execFileSync(process.execPath,[resolve('cli/bin/paperdown-pdf.mjs'),input,'--force','-o',pdf],{timeout:50_000});
  assert.equal(readFileSync(pdf).subarray(0,5).toString(),'%PDF-');
  const text=execFileSync('pdftotext',[pdf,'-'],{encoding:'utf8'});
  assert.match(text,/한글 English PDF/);
  for(let i=0;i<45;i++) assert.equal(text.split(`MARKER${String(i).padStart(3,'0')}`).length-1,1);
  const images=execFileSync('pdfimages',['-list',pdf],{encoding:'utf8'}).trim().split('\n');
  assert.equal(images.length,2,'text-only PDF must contain no raster page images');
  const info=execFileSync('pdfinfo',[pdf],{encoding:'utf8'});
  assert.match(info,/Page size:.*\(A4\)/);
  assert.ok(Number(info.match(/Pages:\s+(\d+)/)[1])>1);
});

test('nested lists continue below headings instead of moving as a whole page block', {skip:!output,timeout:60_000},()=>{
  for (const count of [12,20]) {
    const input=join(output,`list-pagination-${count}.md`),pdf=join(output,`list-pagination-${count}.pdf`);
    const intro=Array.from({length:8},(_,i)=>`INTRO${i} 페이지 분할 앞부분의 문단입니다. 문서의 남은 공간을 사용합니다.`).join('\n\n');
    const list=Array.from({length:count},(_,i)=>`- LISTMARKER${String(i).padStart(3,'0')} 한글 English 목록 내용\n  - NESTEDMARKER${String(i).padStart(3,'0')} 중첩 목록`).join('\n');
    writeFileSync(input,`# 목록 분할 검증\n\n${intro}\n\n## SECTIONMARKER\n\n${list}`);
    execFileSync(process.execPath,[resolve('cli/bin/paperdown-pdf.mjs'),input,'--force','-o',pdf],{timeout:50_000});
    const text=execFileSync('pdftotext',[pdf,'-'],{encoding:'utf8'});
    const pages=text.split('\f');
    const headingPage=pages.findIndex(page=>page.includes('SECTIONMARKER'));
    assert.ok(pages[headingPage].includes('LISTMARKER000'),'heading must share its page with the first list item');
    assert.ok(pages.slice(headingPage+1).some(page=>page.includes(`LISTMARKER${String(count-1).padStart(3,'0')}`)),'the list must continue across sheets');
    for(let i=0;i<count;i++) for(const prefix of ['LISTMARKER','NESTEDMARKER']) assert.equal(text.split(`${prefix}${String(i).padStart(3,'0')}`).length-1,1);
  }
});
