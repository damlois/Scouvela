import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const actorRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = join(actorRoot, '..', '..');
const sourceShared = join(repoRoot, 'packages', 'shared');
const targetShared = join(actorRoot, 'bundled-shared');

rmSync(targetShared, { recursive: true, force: true });
mkdirSync(targetShared, { recursive: true });

cpSync(join(sourceShared, 'src'), join(targetShared, 'src'), { recursive: true });

const sharedPkg = JSON.parse(readFileSync(join(sourceShared, 'package.json'), 'utf8'));
writeFileSync(
  join(targetShared, 'package.json'),
  `${JSON.stringify(
    {
      name: sharedPkg.name,
      version: sharedPkg.version,
      private: true,
      type: 'module',
      main: './dist/index.js',
      types: './dist/index.d.ts',
      exports: sharedPkg.exports,
      scripts: {
        build: 'tsc -p tsconfig.json',
      },
      dependencies: sharedPkg.dependencies,
      devDependencies: {
        typescript: sharedPkg.devDependencies.typescript,
      },
    },
    null,
    2,
  )}\n`,
);

writeFileSync(
  join(targetShared, 'tsconfig.json'),
  `${JSON.stringify(
    {
      extends: '../tsconfig.base.json',
      compilerOptions: {
        module: 'NodeNext',
        moduleResolution: 'NodeNext',
        outDir: 'dist',
        rootDir: 'src',
        declaration: true,
        sourceMap: true,
        noEmit: false,
      },
      include: ['src/**/*.ts'],
    },
    null,
    2,
  )}\n`,
);

const actorPackage = JSON.parse(readFileSync(join(actorRoot, 'package.json'), 'utf8'));
if (actorPackage.dependencies?.['@scouvela/shared'] !== '*') {
  throw new Error('Expected @scouvela/shared to remain a workspace dependency for local development.');
}

process.stdout.write(`Bundled ${sourceShared} -> ${targetShared}\n`);
