import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, cpSync, existsSync } from 'node:fs';
import { join } from 'node:path';
const directory='/var/lib/paperdown';
const backup=join('/var/backups/paperdown',new Date().toISOString().replace(/[:.]/g,'-'));
mkdirSync(backup,{recursive:true,mode:0o700});
const db=new DatabaseSync(join(directory,'paperdown.sqlite'));
try {db.exec(`VACUUM INTO '${join(backup,'paperdown.sqlite')}'`);} finally {db.close();}
cpSync(join(directory,'files'),join(backup,'files'),{recursive:true});
// Profile photos live beside note images.
if (existsSync(join(directory,'avatars'))) cpSync(join(directory,'avatars'),join(backup,'avatars'),{recursive:true});
console.log('Paperdown backup complete');
