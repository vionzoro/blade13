import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const TEXT_EXTENSIONS = new Set(['.html', '.js', '.json', '.md', '.mjs', '.py', '.sh']);
const EXCLUDED_DIRECTORIES = new Set(['build', 'docs', 'node_modules']);
const ENCODED_TERMS = [
  'TWFzdGVyIFlp', 'V3VqdQ==', 'SGlnaGxhbmRlcg==', 'QWxwaGEgU3RyaWtl', 'TWVkaXRhdGU=',
  'Q3liZXJwdW5rIDIwNzc=', 'RWRnZXJ1bm5lcg==', 'U2FuZGV2aXN0YW4=', 'TmlnaHQgQ2l0eQ==',
  'RGF2aWQ=', 'Wm9ybw==', 'U2FudG9yeXU=', 'T25pIEdpcmk=', 'QXN1cmE=', 'UmlvdA==', 'Q0RQUg==',
  '6Iux6ZuE6IGU55uf', '5peg5p6B5YmR5Zyj', '5rW36LS8546L', '6ZuG6Iux56S+', '5LiJ5YiA5rWB',
  '6ay85pas44KK', '6ay85pap', '6Zi/5L+u572X', '6L6557yY6KGM6ICF', '5YmR5Zyj'
];
const TERMS = ENCODED_TERMS.map(term => Buffer.from(term, 'base64').toString('utf8').toLocaleLowerCase());

function collect(target, files) {
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    if (TEXT_EXTENSIONS.has(path.extname(target).toLowerCase())) files.push(target);
    return;
  }
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (entry.isDirectory() && EXCLUDED_DIRECTORIES.has(entry.name)) continue;
    collect(path.join(target, entry.name), files);
  }
}

export function scanPaths(targets) {
  const files = [];
  for (const target of targets) collect(path.resolve(target), files);
  const hits = [];
  for (const file of files) {
    const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
    for (let line = 0; line < lines.length; line++) {
      const text = lines[line].toLocaleLowerCase();
      if (TERMS.some(term => text.includes(term))) hits.push({ file, line: line + 1 });
    }
  }
  return hits;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const targets = process.argv.slice(2);
  const hits = scanPaths(targets.length ? targets : [ROOT]);
  for (const hit of hits) console.error(`${path.relative(ROOT, hit.file) || path.basename(hit.file)}:${hit.line}: blocked release term`);
  if (hits.length) process.exitCode = 1;
  else console.log(`release guard passed (${targets.length ? 'selected paths' : 'public project text'})`);
}
