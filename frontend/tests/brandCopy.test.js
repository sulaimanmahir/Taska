import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const runtimeRoots = [
  fileURLToPath(new URL('../src', import.meta.url)),
  fileURLToPath(new URL('../index.html', import.meta.url)),
  fileURLToPath(new URL('../vite.config.js', import.meta.url)),
];

const legacyBrandPattern = /\bTASKA\b|\bTASKa\b/;

function collectRuntimeFiles(entryPath) {
  const stats = statSync(entryPath);

  if (stats.isFile()) {
    return [entryPath];
  }

  return readdirSync(entryPath, { withFileTypes: true }).flatMap((entry) => {
    const nextPath = join(entryPath, entry.name);

    if (entry.isDirectory()) {
      return collectRuntimeFiles(nextPath);
    }

    if (!/\.(js|jsx|html)$/.test(entry.name)) {
      return [];
    }

    return [nextPath];
  });
}

test('frontend runtime copy avoids legacy TASKA branding variants', () => {
  const matches = runtimeRoots
    .flatMap((root) => collectRuntimeFiles(root))
    .flatMap((filePath) => {
      const source = readFileSync(filePath, 'utf8');

      if (!legacyBrandPattern.test(source)) {
        return [];
      }

      return [filePath];
    });

  assert.deepEqual(matches, []);
});
