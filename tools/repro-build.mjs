import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const artifact = new URL('../build/BLADE13.zip', import.meta.url);
const build = () => {
  execFileSync('python3', ['build.py'], { cwd: root, stdio: 'pipe' });
  const bytes = fs.readFileSync(artifact);
  return { size: bytes.length, hash: crypto.createHash('sha256').update(bytes).digest('hex') };
};

const first = build();
Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2100);
const second = build();

assert.deepEqual(second, first, `build drifted:\nfirst  ${JSON.stringify(first)}\nsecond ${JSON.stringify(second)}`);
console.log(`reproducible build ${first.size} bytes sha256 ${first.hash}`);
