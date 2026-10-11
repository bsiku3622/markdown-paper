import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePdf } from './pdf.mjs';
const value={html:'<section class="pdf-page">한글 ABC</section>',title:'문서',width:210,height:297,pages:1};
test('PDF jobs bound page geometry, job size and title before launching Chrome',()=>{
  assert.equal(validatePdf(value),value);
  for(const input of [null,{...value,width:NaN},{...value,width:501},{...value,height:5001},{...value,pages:1.5},{...value,pages:201},{...value,title:'x'.repeat(201)},{...value,html:'x'.repeat(40_000_001)}]) assert.throws(()=>validatePdf(input));
});
