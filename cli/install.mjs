import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const project=resolve(dirname(fileURLToPath(import.meta.url)),'..');
execFileSync('npm',['ci','--prefix','cli','--ignore-scripts'],{cwd:project,stdio:'inherit'});
execFileSync('npm',['run','build:cli'],{cwd:project,stdio:'inherit'});
const packed=JSON.parse(execFileSync('npm',['pack','./cli','--pack-destination','cli','--json'],{cwd:project,encoding:'utf8'}));
execFileSync('npm',['install','--global',resolve(project,'cli',packed[0].filename)],{cwd:project,stdio:'inherit'});
execFileSync('paperdown-pdf',['--version'],{stdio:'inherit'});
