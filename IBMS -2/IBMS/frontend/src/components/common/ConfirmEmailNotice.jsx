import React, { useEffect, useState } from 'react';
import { Mail } from 'lucide-react';
import { authErrorMessage } from '../../utils/authErrors';

export default function ConfirmEmailNotice({ email, onResend }) {
  const [sending, setSending] = useState(false);
  const [remaining, setRemaining] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!remaining) return;
    const timer = setTimeout(() => setRemaining(remaining - 1), 1000);
    return () => clearTimeout(timer);
  }, [remaining]);

  const resend = async () => {
    setSending(true); setMessage(''); setError('');
    try {
      await onResend();
      setMessage('Confirmation requested. Check your inbox and spam folder, then open the newest link.');
      setRemaining(60);
    } catch (err) {
      setError(authErrorMessage(err, 'Unable to resend the email. Please try again shortly.'));
      if (err.status === 429) setRemaining(60);
    } finally { setSending(false); }
  };

  return (
    <section className="mb-5 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-slate-700" aria-label="Email confirmation">
      <div className="flex items-center gap-2 font-semibold text-slate-800"><Mail className="h-4 w-4" />Confirm your email</div>
      <p className="mt-2 leading-relaxed">Open the confirmation email sent to <strong className="break-all">{email}</strong>. Check your spam folder too. You can sign in after opening that link.</p>
      <button type="button" disabled={sending || remaining > 0} onClick={resend} className="mt-3 rounded-lg border border-blue-300 bg-white px-3 py-2 font-semibold text-blue-700 transition-colors hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:cursor-wait disabled:opacity-60">
        {sending ? 'Sending…' : remaining > 0 ? `Resend available in ${remaining}s` : 'Resend confirmation email'}
      </button>
      <div aria-live="polite">
        {message && <p className="mt-3 text-emerald-800">{message}</p>}
        {error && <p className="mt-3 text-rose-700" role="alert">{error}</p>}
      </div>
    </section>
  );
}
