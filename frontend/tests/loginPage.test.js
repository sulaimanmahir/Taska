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

test('email/password inputs force the icon-clearance padding to win over the shared .input class', () => {
  // .input sets `padding` as a single shorthand (all four sides), which silently
  // overrides a plain pl-12/pr-12 utility of equal specificity defined earlier in
  // the cascade (Tailwind's utilities load via @import "tailwindcss" at the very
  // top of index.css, and .input's own rule comes later, so .input always won).
  // That collapsed the icon-clearance padding back to .input's default, crowding
  // the leading @ and lock icons into the placeholder/typed text. The `!` suffix
  // forces these two utilities to win regardless of source order.
  assert.match(source, /className="input pl-12!"/);
  assert.match(source, /className="input pl-12! pr-12!"/);
});
