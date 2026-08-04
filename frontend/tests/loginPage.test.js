import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const pagePath = path.resolve(process.cwd(), 'src/pages/Login.jsx');
const source = fs.readFileSync(pagePath, 'utf8');

test('Login keeps demo-prefill behavior at the page boundary', () => {
  assert.match(source, /const demoEmail = searchParams\.get\('email'\) \?\? '';/);
  assert.match(source, /const isDemoMode = searchParams\.get\('demo'\) === '1';/);
  assert.match(source, /const \[email, setEmail\] = useState\(demoEmail\);/);
  assert.match(source, /const \[password, setPassword\] = useState\(isDemoMode \? 'password123' : ''\);/);
  assert.match(source, /Demo sign-in ready/);
});

test('Login keeps the auth-store login contract and post-login resolution intact', () => {
  assert.match(source, /const \{ login, isLoading \} = useAuthStore\(\);/);
  assert.match(source, /const data = await login\(email, password\);/);
  assert.match(source, /navigate\(resolvePostLoginPath\(data\)\);/);
  assert.match(source, /setError\(err\.response\?\.data\?\.message \|\| 'Invalid credentials\. Please try again\.'\);/);
});

test('Login preserves password recovery, register, and demo handoffs', () => {
  assert.match(source, /type=\{showPassword \? 'text' : 'password'\}/);
  assert.match(source, /onClick=\{\(\) => setShowPassword\(\(value\) => !value\)\}/);
  assert.match(source, /to=\{email \? `\/forgot-password\?email=\$\{encodeURIComponent\(email\)\}` : '\/forgot-password'\}/);
  assert.match(source, /to="\/register"/);
  assert.match(source, /Create Business Account/);
  assert.match(source, /to="\/demo"/);
});
