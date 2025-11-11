#!/usr/bin/env node
// Runs the Allure CLI without shell=true so Node skips DEP0190 warnings.
const { spawnSync } = require('node:child_process');
const { resolve } = require('node:path');

const allureBinary = resolve(
  __dirname,
  '..',
  'node_modules',
  'allure-commandline',
  'bin',
  'allure'
);

function runAllure(args) {
  // Thin wrapper around spawnSync so we can surface Allure CLI failures with useful exit codes.
  const result = spawnSync(allureBinary, args, { stdio: 'inherit' });
  if (result.error) {
    console.error(result.error);
  }
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const action = process.argv[2];

if (action === 'generate') {
  runAllure(['generate', '--clean', 'allure-results', '--output', 'allure-report']);
} else if (action === 'open') {
  runAllure(['open', 'allure-report']);
} else {
  console.error('Usage: node scripts/allure-runner.js <generate|open>');
  process.exit(1);
}
