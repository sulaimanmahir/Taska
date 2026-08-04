import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/ForgotPassword.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('ForgotPassword keeps email-prefill and reset-link submission wiring intact', () => {
  assert.match(source, /const \[email, setEmail\] = useState\(searchParams\.get\('email'\) \?\? ''\);/);
  assert.match(source, /const \{ data \} = await api\.post\('\/auth\/forgot-password', \{ email \}\);/);
  assert.match(source, /setStatus\(data\.message \?\? 'If an account exists for that email, Taska has sent a password reset link\.'\);/);
  assert.match(source, /setError\(err\.response\?\.data\?\.message \|\| 'Unable to send the reset link right now\. Please try again\.'\);/);
});

test('ForgotPassword preserves recovery-state feedback and submit loading copy', () => {
  assert.match(source, /const \[status, setStatus\] = useState\(''\);/);
  assert.match(source, /const \[isSubmitting, setIsSubmitting\] = useState\(false\);/);
  assert.match(source, /setIsSubmitting\(true\);/);
  assert.match(source, /setIsSubmitting\(false\);/);
  assert.match(source, /\{isSubmitting \? 'Sending reset link\.\.\.' : 'Email reset link'\}/);
});

test('ForgotPassword keeps sign-in and registration recovery handoffs visible', () => {
  assert.match(source, /Back to sign in/);
  assert.match(source, /to="\/login"/);
  assert.match(source, /Need a new workspace instead\? Create an account/);
  assert.match(source, /to="\/register"/);
});
