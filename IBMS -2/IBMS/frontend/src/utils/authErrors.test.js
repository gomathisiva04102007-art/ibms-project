import test from 'node:test';
import assert from 'node:assert/strict';
import { authErrorMessage, isEmailUnconfirmed } from './authErrors.js';

test('unconfirmed email errors give an actionable confirmation message', () => {
  const error = { status: 400, message: 'invalid_grant: Email not confirmed' };
  assert.equal(isEmailUnconfirmed(error), true);
  assert.match(authErrorMessage(error), /Confirm your email before signing in/);
  assert.doesNotMatch(authErrorMessage(error), /invalid_grant/);
});

test('incorrect login details do not incorrectly prompt email confirmation', () => {
  const error = { status: 400, message: 'invalid_grant: Invalid credentials' };
  assert.equal(isEmailUnconfirmed(error), false);
  assert.match(authErrorMessage(error), /email or password is incorrect/);
});

test('resend rate limits and service failures have distinct retry guidance', () => {
  assert.match(authErrorMessage({ status: 429 }), /wait a minute/);
  assert.match(authErrorMessage({ status: 503 }), /connect to the sign-in service/);
  assert.equal(authErrorMessage({}, 'Try again.'), 'Try again.');
});

test('server validation errors retain their explanation', () => {
  assert.equal(authErrorMessage({ response: { status: 400, data: { message: 'Account details are required.' } } }), 'Account details are required.');
});
