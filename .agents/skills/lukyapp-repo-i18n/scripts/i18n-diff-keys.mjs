#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

const CONFIG_FILES = [
  '.agent-i18n.json',
  '.codex/i18n.json',
  'agent-i18n.config.json',
];

function parseArgs(argv) {
  const args = {
    base: 'HEAD',
    config: undefined,
    json: false,
    staged: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--json') {
      args.json = true;
    } else if (arg === '--staged') {
      args.staged = true;
    } else if (arg === '--base') {
      args.base = argv[++index];
    } else if (arg === '--config') {
      args.config = argv[++index];
    } else if (arg === '--help' || arg === '-h') {
      usage();
      process.exit(0);
    } else {
      fail(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function usage() {
  console.log(`Usage: node i18n-diff-keys.mjs [--config path] [--base ref] [--staged] [--json]

Lists keys added, changed, or removed in the configured source locale.

Examples:
  node skills/repo-i18n/scripts/i18n-diff-keys.mjs --config .agent-i18n.json
  node skills/repo-i18n/scripts/i18n-diff-keys.mjs --base origin/main --json
`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function git(cwd, args, options = {}) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
    stdio: options.allowFailure ? ['ignore', 'pipe', 'ignore'] : ['ignore', 'pipe', 'pipe'],
  }).trimEnd();
}

function findGitRoot(cwd) {
  try {
    return git(cwd, ['rev-parse', '--show-toplevel']);
  } catch {
    fail('This command must be run inside a git repository.');
  }
}

function findConfig(root, explicitConfig) {
  const candidates = explicitConfig ? [explicitConfig] : CONFIG_FILES;
  for (const candidate of candidates) {
    const absolute = path.resolve(root, candidate);
    if (existsSync(absolute)) {
      return absolute;
    }
  }

  fail(`No i18n config found. Tried: ${candidates.join(', ')}`);
}

function readJsonFile(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (error) {
    fail(`Could not read JSON from ${filePath}: ${error.message}`);
  }
}

function flatten(value, prefix = '', output = {}) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const [key, nestedValue] of Object.entries(value)) {
      const nextPrefix = prefix ? `${prefix}.${key}` : key;
      flatten(nestedValue, nextPrefix, output);
    }
    return output;
  }

  output[prefix] = value;
  return output;
}

function getRepoPath(root, absolutePath) {
  return path.relative(root, absolutePath).split(path.sep).join('/');
}

function readGitJson(root, spec) {
  try {
    return JSON.parse(git(root, ['show', spec]));
  } catch {
    return {};
  }
}

function compareKeys(before, after) {
  const beforeFlat = flatten(before);
  const afterFlat = flatten(after);
  const beforeKeys = new Set(Object.keys(beforeFlat));
  const afterKeys = new Set(Object.keys(afterFlat));

  const added = [];
  const changed = [];
  const removed = [];

  for (const key of afterKeys) {
    if (!beforeKeys.has(key)) {
      added.push(key);
    } else if (JSON.stringify(beforeFlat[key]) !== JSON.stringify(afterFlat[key])) {
      changed.push(key);
    }
  }

  for (const key of beforeKeys) {
    if (!afterKeys.has(key)) {
      removed.push(key);
    }
  }

  return {
    added: added.sort(),
    changed: changed.sort(),
    removed: removed.sort(),
  };
}

const args = parseArgs(process.argv.slice(2));
const root = findGitRoot(process.cwd());
const configPath = findConfig(root, args.config);
const config = readJsonFile(configPath);
const sourceLocale = config.sourceLocale || 'en';
const sourceFile = config.sourceFile || `${sourceLocale}.json`;

if (!config.localesDir) {
  fail(`Missing "localesDir" in ${getRepoPath(root, configPath)}.`);
}

const sourcePath = path.resolve(root, config.localesDir, sourceFile);
if (!existsSync(sourcePath)) {
  fail(`Source locale file not found: ${sourcePath}`);
}

const repoPath = getRepoPath(root, sourcePath);
const before = readGitJson(root, `${args.base}:${repoPath}`);
const after = args.staged ? readGitJson(root, `:${repoPath}`) : readJsonFile(sourcePath);
const diff = compareKeys(before, after);
const result = {
  config: getRepoPath(root, configPath),
  source: repoPath,
  base: args.base,
  target: args.staged ? 'index' : 'working-tree',
  ...diff,
  keys: [...diff.added, ...diff.changed, ...diff.removed].sort(),
};

if (args.json) {
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`Source: ${result.source}`);
  console.log(`Base: ${result.base}`);
  console.log(`Target: ${result.target}`);
  console.log(`Added: ${result.added.length}`);
  result.added.forEach((key) => console.log(`  + ${key}`));
  console.log(`Changed: ${result.changed.length}`);
  result.changed.forEach((key) => console.log(`  ~ ${key}`));
  console.log(`Removed: ${result.removed.length}`);
  result.removed.forEach((key) => console.log(`  - ${key}`));
}
