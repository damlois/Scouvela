import { existsSync, mkdirSync, realpathSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const nextDir = join(repoRoot, 'apps', 'web', '.next-dev');
const target = join(
  process.env.LOCALAPPDATA || join(process.env.USERPROFILE ?? '', 'AppData', 'Local'),
  'scouvela-web-next',
);

mkdirSync(target, { recursive: true });

function alreadyLinked() {
  if (!existsSync(nextDir)) {
    return false;
  }

  try {
    return realpathSync(nextDir) === realpathSync(target);
  } catch {
    return false;
  }
}

if (alreadyLinked()) {
  process.stdout.write(`Using local Next cache at ${target}\n`);
  process.exit(0);
}

if (process.platform === 'win32') {
  const result = spawnSync('cmd', ['/c', 'mklink', '/J', nextDir, target], { encoding: 'utf8' });
  if (result.status !== 0) {
    process.stderr.write(`${result.stdout ?? ''}${result.stderr ?? ''}`);
    process.exit(result.status ?? 1);
  }
} else if (!existsSync(nextDir)) {
  spawnSync('ln', ['-s', target, nextDir], { stdio: 'inherit' });
}

process.stdout.write(`Linked apps/web/.next-dev -> ${target}\n`);
