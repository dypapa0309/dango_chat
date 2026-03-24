import { env } from './env.js';

/**
 * Send an email via Resend. Silently skips if RESEND_API_KEY is not configured.
 * @param {object} opts
 * @param {string|string[]} opts.to - recipient email address(es)
 * @param {string} opts.subject - email subject
 * @param {string} opts.html - HTML body
 * @returns {Promise<{skipped?: boolean, error?: string, id?: string}>}
 */
export async function sendEmail({ to, subject, html }) {
  const apiKey = env('RESEND_API_KEY');
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY 없음. 이메일 발송 건너뜀.');
    return { skipped: true };
  }
  const fromEmail = env('EMAIL_FROM') || 'no-reply@dang-o.kr';
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ from: fromEmail, to, subject, html })
    });
    if (!res.ok) {
      const err = await res.text();
      console.error('[email] 발송 실패', err);
      return { error: err };
    }
    return await res.json();
  } catch (error) {
    console.error('[email] 예외 발생', error.message);
    return { error: error.message };
  }
}
