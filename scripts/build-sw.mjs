import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
const root=path.resolve('out');
async function walk(dir){const items=await readdir(dir,{withFileTypes:true});return (await Promise.all(items.map(e=>e.isDirectory()?walk(path.join(dir,e.name)):path.join(dir,e.name)))).flat();}
const files=(await walk(root)).filter(f=>!f.endsWith('sw.js')&&!path.basename(f).startsWith('_headers'));
const hash=createHash('sha256');
const source=await readFile('scripts/sw-template.js','utf8');
hash.update(source);
for(const f of files.sort())hash.update(await readFile(f));
const assets=files.map(f=>'/'+path.relative(root,f).split(path.sep).join('/'));
const urls=[...new Set(['/',...assets])];
await writeFile(path.join(root,'sw.js'),source.replace('__CACHE_NAME__',`tirantes-${hash.digest('hex').slice(0,16)}`).replace('__ASSETS__',JSON.stringify(urls)));
console.log(`PWA: ${urls.length} archivos incluidos en caché de instalación.`);
