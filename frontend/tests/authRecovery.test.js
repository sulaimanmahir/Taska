import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const appSource = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8');
const loginSource = readFileSync(new URL('../src/pages/Login.jsx', import.meta.url), 'utf8');
const forgotPasswordSource = readFileSync(new URL('../src/pages/ForgotPassword.jsx', import.meta.url), 'utf8');
const resetPasswordSource = readFileSync(new URL('../src/pages/ResetPassword.jsx', import.meta.url), 'utf8');

test('public router exposes forgot and reset password pages', () => {
  assert.match(appSource, /<Route path="\/forgot-password" element={<ForgotPassword \/>} \/>/);
  assert.match(appSource, /<Route path="\/reset-password" element={<ResetPassword \/>} \/>/);
});

test('login page routes password recovery through the real forgot-password page', () => {
  assert.match(loginSource, /Forgot your password\?/);
  assert.match(loginSource, /encodeURIComponent\(email\)/);
  assert.match(loginSource, /'\/forgot-password'/);
});

test('forgot password page calls the backend reset-link endpoint', () => {
  assert.match(forgotPasswordSource, /api\.post\('\/auth\/forgot-password', \{ email \}\)/);
  assert.match(forgotPasswordSource, /If an account exists for that email, Taska has sent a password reset link\./);
});

test('reset password page submits token, email, and confirmation to the backend reset endpoint', () => {
  assert.match(resetPasswordSource, /api\.post\('\/auth\/reset-password', \{/);
  assert.match(resetPasswordSource, /password_confirmation: passwordConfirmation/);
  assert.match(resetPasswordSource, /This reset link is incomplete\. Request a fresh password reset email to continue\./);
});
