import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/ResetPassword.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('ResetPassword keeps token-aware reset submission wiring intact', () => {
  assert.match(source, /const token = searchParams\.get\('token'\) \?\? '';/);
  assert.match(source, /const emailFromQuery = searchParams\.get\('email'\) \?\? '';/);
  assert.match(source, /const \{ data \} = await api\.post\('\/auth\/reset-password', \{/);
  assert.match(source, /token,/);
  assert.match(source, /password_confirmation: passwordConfirmation,/);
  assert.match(source, /setStatus\(data\.message \?\? 'Password reset successfully\. You can now sign in with your new password\.'\);/);
});

test('ResetPassword preserves login return path and fresh-reset-link handoff', () => {
  assert.match(source, /const loginHref = useMemo\(\(\) => \{/);
  assert.match(source, /return query \? `\/login\?\$\{query\}` : '\/login';/);
  assert.match(source, /to=\{loginHref\}/);
  assert.match(source, /Return to sign in/);
  assert.match(source, /to=\{email \? `\/forgot-password\?email=\$\{encodeURIComponent\(email\)\}` : '\/forgot-password'\}/);
  assert.match(source, /Request a fresh reset link/);
});

test('ResetPassword keeps token guardrails and submit loading state visible', () => {
  assert.match(source, /This reset link is incomplete\. Request a fresh password reset email to continue\./);
  assert.match(source, /disabled=\{isSubmitting \|\| !token\}/);
  assert.match(source, /\{isSubmitting \? 'Saving new password\.\.\.' : 'Reset password'\}/);
  assert.match(source, /setPassword\(''\);/);
  assert.match(source, /setPasswordConfirmation\(''\);/);
});
