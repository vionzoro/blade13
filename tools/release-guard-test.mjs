import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const guard = path.join(root, 'tools', 'release-guard.mjs');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'blade13-release-guard-'));

try {
  const clean = path.join(temp, 'clean.md');
  const blocked = path.join(temp, 'blocked.md');
  fs.writeFileSync(clean, 'Original neon runner with three monomolecular blades.\n');
  fs.writeFileSync(blocked, String.fromCharCode(77, 97, 115, 116, 101, 114, 32, 89, 105));

  const cleanRun = spawnSync(process.execPath, [guard, clean], { encoding: 'utf8' });
  assert.equal(cleanRun.status, 0, `clean release text was rejected:\n${cleanRun.stdout}${cleanRun.stderr}`);

  const blockedRun = spawnSync(process.execPath, [guard, blocked], { encoding: 'utf8' });
  assert.equal(blockedRun.status, 1, 'sensitive third-party name must block release');
  assert.match(blockedRun.stdout + blockedRun.stderr, /blocked\.md:1/, 'guard must identify the file and line');
  console.log('release guard accepts clean text and rejects sensitive names');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
