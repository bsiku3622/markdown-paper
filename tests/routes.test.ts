import test from 'node:test';
import assert from 'node:assert/strict';
import {routeFor,documentPath} from '../src/routes.ts';
test('document routes support direct links and reject malformed IDs',()=>{
  assert.deepEqual(routeFor('/'),{kind:'home'});
  assert.deepEqual(routeFor(documentPath('note_abc-123')),{kind:'document',id:'note_abc-123'});
  assert.deepEqual(routeFor('/documents/local'),{kind:'document',id:'local'});
  for(const path of ['/documents/','/documents/a/b','/documents/%2F','/documents/%','/other']) assert.deepEqual(routeFor(path),{kind:'missing'});
});
