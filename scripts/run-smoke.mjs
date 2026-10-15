// Launcher for the SSR smoke test. The built test bundle (app-smoke.js) pulls in
// jsdom, whose undici dependency requires a Node runtime with zstd support
// (Node >= 22.13). The default `node` on some shells is older, so we prefer a
// newer nvm-managed binary when present and fall back to the active `node`.
// This keeps `npm run smoke` portable across machines.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const VERSIONS_DIR = join(homedir(), '.nvm', 'versions', 'node');
const SCRIPT = fileURLToPath(new URL('../.smoke/app-smoke.js', import.meta.url));

// Prefer the highest nvm-managed Node, since jsdom's undici needs a recent
// runtime. Version dirs sort by descending dotted numeric version.
function nvmNodeBinaries() {
  if (!existsSync(VERSIONS_DIR)) {
    return [];
  }
  return readdirSync(VERSIONS_DIR)
    .filter((entry) => /^v\d+\.\d+\.\d+$/.test(entry))
    .sort((left, right) => {
      const [leftMajor, leftMinor, leftPatch] = left
        .slice(1)
        .split('.')
        .map(Number);
      const [rightMajor, rightMinor, rightPatch] = right
        .slice(1)
        .split('.')
        .map(Number);
      const majorDiff = rightMajor - leftMajor;
      if (majorDiff !== 0) {
        return majorDiff;
      }
      const minorDiff = rightMinor - leftMinor;
      if (minorDiff !== 0) {
        return minorDiff;
      }
      return rightPatch - leftPatch;
    })
    .map((version) => join(VERSIONS_DIR, version, 'bin', 'node'))
    .filter((binary) => existsSync(binary));
}

const candidates = [...nvmNodeBinaries(), process.execPath];
for (const binary of candidates) {
  const result = spawnSync(binary, [SCRIPT, ...process.argv.slice(2)], {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
  if (result.error) {
    console.error(`node ${binary} failed to start:`, result.error.message);
    continue;
  }
  process.exit(result.status ?? 1);
}

console.error('No usable Node binary found.');
process.exit(1);