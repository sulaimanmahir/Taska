import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/DemoAccounts.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('DemoAccounts keeps seeded demo credentials and filtering behavior intact', () => {
  assert.match(source, /const demoAccounts = \[/);
  assert.match(source, /email: 'retail@taska\.local'/);
  assert.match(source, /email: 'purewaterretail@taska\.local'/);
  assert.match(source, /const normalizedSearch = search\.trim\(\)\.toLowerCase\(\);/);
  assert.match(source, /const visibleAccounts = demoAccounts\.filter\(\(account\) => \{/);
  assert.match(source, /return matchesGroup && \(!normalizedSearch \|\| haystack\.includes\(normalizedSearch\)\);/);
});

test('DemoAccounts keeps quick-login and manual demo handoffs on the auth contract', () => {
  assert.match(source, /const \{ login, isLoading \} = useAuthStore\(\);/);
  assert.match(source, /const data = await login\(account\.email, 'password123'\);/);
  assert.match(source, /navigate\(resolvePostLoginPath\(data\)\);/);
  assert.match(source, /setError\(err\.response\?\.data\?\.message \|\| 'Unable to sign into this demo account right now\.'\);/);
  assert.match(source, /to=\{`\/login\?email=\$\{encodeURIComponent\(account\.email\)\}&demo=1`\}/);
});

test('DemoAccounts preserves the shared demo-browser guidance and empty state', () => {
  assert.match(source, /All business demos use the same password for easy handoff/);
  assert.match(source, /password123/);
  assert.match(source, /Find a business type and open it instantly/);
  assert.match(source, /No demo accounts match that filter yet\./);
});
