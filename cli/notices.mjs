import { readFile, readdir, mkdir, writeFile, copyFile } from 'node:fs/promises';
import { join } from 'node:path';
const lock=JSON.parse(await readFile('package-lock.json','utf8'));
const destination='cli/renderer/licenses';
await mkdir(destination,{recursive:true});
for(const [path,info] of Object.entries(lock.packages)) {
  if(!path.startsWith('node_modules/')) continue;
  try {
    const files=await readdir(path);
    for(const file of files.filter(name=>/^(licen[cs]e|copying|ofl)(?:[._-].*)?$/i.test(name))) {
      const text=await readFile(join(path,file),'utf8');
      await writeFile(join(destination,`${path.replaceAll('/','_')}-${info.version}-${file}.txt`),text);
    }
  } catch { /* Some lock entries are optional packages absent on this platform. */ }
}
await copyFile('node_modules/pretendard/dist/LICENSE.txt',join(destination,'Pretendard-OFL.txt'));
await copyFile('vendor/paper-ui/LICENSE',join(destination,'Paper-UI-LICENSE.txt'));
for (const file of ['LICENSE.txt','README.txt','MANIFEST.txt']) {
  await copyFile(`src/fonts/latin-modern/${file}`,join(destination,`Latin-Modern-${file}`));
}
await copyFile('LICENSE','cli/LICENSE');
