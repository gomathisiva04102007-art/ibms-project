export function isEmailUnconfirmed(error) {
  const message = error?.response?.data?.message || error?.message || '';
  return /email[_\s-]+not[_\s-]+confirmed|email[_\s-]+not[_\s-]+verified/i.test(message);
}

export function authErrorMessage(error, fallback) {
  if (isEmailUnconfirmed(error)) return 'Confirm your email before signing in. Open the confirmation link in your inbox, or request a new link below.';
  const status = error?.response?.status || error?.status;
  if (status === 429) return 'Too many attempts. Please wait a minute before trying again.';
  if (status === 401 || status === 400 && /invalid.grant|invalid.credentials/i.test(error?.message || '')) return 'The email or password is incorrect. Please try again.';
  if (error?.code === 'ERR_NETWORK' || [502, 503].includes(status)) return 'Cannot connect to the sign-in service. Please try again in a moment.';
  return error?.response?.data?.message || error?.message || fallback;
}
