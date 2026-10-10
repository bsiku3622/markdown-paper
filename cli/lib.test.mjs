import { test } from 'node:test';
import assert from 'node:assert/strict';
import { options } from './lib/options.mjs';
import { imageSource, mime } from './lib/assets.mjs';

test('CLI refuses input overwrite even with --force',()=> {
  assert.throws(()=>options(['notes.md','-o','notes.md','--force'],'/tmp'),/different/);
});
test('CLI validates page settings rather than silently clamping them',()=> {
  for(const args of [['--size','5'],['--leading','Infinity'],['--paper','a3'],['--font','unknown'],['--width','160']]) {
    assert.throws(()=>options(['notes.md',...args]));
  }
  const result=options(['a file.md','--paper','A4','--size','9','--landscape','-o','out file.pdf'],'/tmp');
  assert.equal(result.settings.paper,'a4');assert.equal(result.settings.sizePt,9);assert.equal(result.settings.landscape,true);
  assert.equal(result.output,'/tmp/out file.pdf');
});
test('remote images are never fetched without opt-in',async()=> {
  await assert.rejects(()=>imageSource('https://example.com/image.png','.',false),/allow-remote/);
});
test('non-image data and unsupported schemes are rejected',async()=> {
  assert.throws(()=>mime(Buffer.from('<svg onload="alert(1)">')),/PNG/);
  await assert.rejects(()=>imageSource('javascript:alert(1)','.',false),/Unsupported/);
  await assert.rejects(()=>imageSource('','.',false),/no source/);
});
