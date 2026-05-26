#!/usr/bin/env node
/**
 * Normalizes touch targets and icon sizes across TSX files.
 * Run: node scripts/apply-a11y-sizes.cjs
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SKIP_DIRS = new Set(['node_modules', '.git', 'dist', 'build']);

const SIZE_MAP = [
  [/\bsize=\{12\}/g, 'size={16}'],
  [/\bsize=\{13\}/g, 'size={18}'],
  [/\bsize=\{14\}/g, 'size={18}'],
  [/\bsize=\{15\}/g, 'size={18}'],
  [/\bsize=\{16\}/g, 'size={18}'],
  [/\bsize=\{17\}/g, 'size={20}'],
  [/\bsize=\{18\}/g, 'size={22}'],
  [/\bsize=\{19\}/g, 'size={24}'],
];

const DIMENSION_MAP = [
  [/(\b(?:width|height):\s*)38,/g, '$148,'],
  [/(\b(?:width|height):\s*)42,/g, '$148,'],
  [/(\b(?:width|height):\s*)40,(?![\s\S]*?borderRadius:\s*20,\s*\n\s*flexShrink)/g, '$148,'],
  [/(\b(?:width|height):\s*)36,/g, '$144,'],
  [/(\b(?:width|height):\s*)34,/g, '$144,'],
  [/(\bminHeight:\s*)22,/g, '$144,'],
  [/(\bminHeight:\s*)24,/g, '$144,'],
  [/(\bminHeight:\s*)26,/g, '$144,'],
  [/(\bminHeight:\s*)28,/g, '$144,'],
  [/(\bminHeight:\s*)30,/g, '$144,'],
  [/(\bminHeight:\s*)34,/g, '$148,'],
  [/(\bminHeight:\s*)36,/g, '$148,'],
  [/(\bminHeight:\s*)38,/g, '$148,'],
];

const SKIP_FILES = new Set([
  'cicla-vera-logo.tsx',
  'moon-mark.tsx',
  'calendar-day-cell.tsx',
]);

const SKIP_CHART_PATTERNS = [/charts\.tsx$/];

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, files);
    else if (entry.name.endsWith('.tsx')) files.push(full);
  }
  return files;
}

function shouldSkip(filePath) {
  const base = path.basename(filePath);
  if (SKIP_FILES.has(base)) return true;
  return SKIP_CHART_PATTERNS.some((pattern) => pattern.test(filePath));
}

function transform(content, filePath) {
  let next = content;

  for (const [pattern, replacement] of SIZE_MAP) {
    next = next.replace(pattern, replacement);
  }

  if (!shouldSkip(filePath)) {
    for (const [pattern, replacement] of DIMENSION_MAP) {
      next = next.replace(pattern, replacement);
    }
  }

  return next;
}

let changed = 0;
for (const file of walk(ROOT)) {
  if (!file.includes('/app/') && !file.includes('/components/')) continue;
  if (shouldSkip(file)) continue;

  const original = fs.readFileSync(file, 'utf8');
  const updated = transform(original, file);
  if (updated !== original) {
    fs.writeFileSync(file, updated);
    changed += 1;
    console.log(path.relative(ROOT, file));
  }
}

console.log(`Updated ${changed} files.`);
