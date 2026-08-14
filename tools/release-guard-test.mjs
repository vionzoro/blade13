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

  const accountTerm = String.fromCharCode(90, 111, 114, 111);
  const accountUrl = path.join(temp, 'account-url.md');
  const standaloneName = path.join(temp, 'standalone-name.md');
  fs.writeFileSync(accountUrl, `https://github.com/vion${accountTerm.toLowerCase()}/blade13\n`);
  fs.writeFileSync(standaloneName, `Original hero, no ${accountTerm} references.\n`);
  const accountUrlRun = spawnSync(process.execPath, [guard, accountUrl], { encoding: 'utf8' });
  const standaloneNameRun = spawnSync(process.execPath, [guard, standaloneName], { encoding: 'utf8' });
  assert.equal(accountUrlRun.status, 0, `blocked term inside an account name must not reject its URL:\n${accountUrlRun.stdout}${accountUrlRun.stderr}`);
  assert.equal(standaloneNameRun.status, 1, 'standalone sensitive third-party name must remain blocked');

  const publicRoot = path.join(temp, 'public-root');
  fs.mkdirSync(path.join(publicRoot, '.superpowers'), { recursive: true });
  fs.writeFileSync(path.join(publicRoot, 'README.md'), 'Original chibi unicorn game.\n');
  fs.writeFileSync(path.join(publicRoot, '.superpowers', 'brainstorm.md'), String.fromCharCode(77, 97, 115, 116, 101, 114, 32, 89, 105));
  const ignoredCacheRun = spawnSync(process.execPath, [guard, publicRoot], { encoding: 'utf8' });
  assert.equal(ignoredCacheRun.status, 0, `ignored brainstorm cache must not block public release text:\n${ignoredCacheRun.stdout}${ignoredCacheRun.stderr}`);
  console.log('release guard accepts clean text and rejects sensitive names');
} finally {
  fs.rmSync(temp, { recursive: true, force: true });
}
