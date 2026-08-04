import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/Register.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('Register keeps business-type prefill and grouped selection at the page boundary', () => {
  assert.match(source, /const prefilledType = isVisibleBusinessType\(searchParams\.get\('business_type'\)\)/);
  assert.match(source, /: 'retail';/);
  assert.match(source, /const \[expandedGroup, setExpandedGroup\] = useState\(\(\) => businessTypes\[prefilledType\]\?\.group \|\| 'commerce'\);/);
  assert.match(source, /queueMicrotask\(\(\) => \{/);
  assert.match(source, /setExpandedGroup\(businessTypes\[prefilledType\]\.group \|\| 'commerce'\);/);
  assert.match(source, /groupedBusinessTypes\.map/);
});

test('Register keeps the auth-store registration contract and redirect on success', () => {
  assert.match(source, /const \{ register, isLoading \} = useAuthStore\(\);/);
  assert.match(source, /await register\(form\);/);
  assert.match(source, /navigate\('\/'\);/);
  assert.match(source, /setError\(err\.response\?\.data\?\.message \|\| 'Registration failed'\);/);
});

test('Register preserves the three-step onboarding flow and loading submit state', () => {
  assert.match(source, /\{\[1, 2, 3\]\.map/);
  assert.match(source, /onClick=\{\(\) => setStep\(2\)\}/);
  assert.match(source, /onClick=\{\(\) => setStep\(3\)\}/);
  assert.match(source, /onClick=\{\(\) => setStep\(1\)\}/);
  assert.match(source, /onClick=\{\(\) => setStep\(2\)\}/);
  assert.match(source, /disabled=\{isLoading\}/);
  assert.match(source, /\{isLoading \? 'Creating workspace\.\.\.' : 'Create business workspace'\}/);
});
