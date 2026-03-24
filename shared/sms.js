import crypto from 'crypto';
import { env } from './env.js';

function createSolapiAuthHeader(apiKey, apiSecret) {
  const dateTime = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString('hex');
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(dateTime + salt)
    .digest('hex');
  return `HMAC-SHA256 apiKey=${apiKey}, date=${dateTime}, salt=${salt}, signature=${signature}`;
}

/**
 * Send an SMS via SOLAPI. Silently skips if env vars are not configured.
 * @param {string} to - recipient phone number
 * @param {string} message - SMS text
 * @returns {Promise<{sent: boolean, mocked?: boolean, error?: string}>}
 */
export async function sendSms(to, message) {
  if (!to || !message) return { sent: false, error: 'to and message are required' };

  const apiKey = env('SOLAPI_API_KEY');
  const apiSecret = env('SOLAPI_API_SECRET');
  const sender = env('SENDER_PHONE');

  if (!apiKey || !apiSecret || !sender) {
    console.warn(`sendSms: 환경변수 미설정으로 SMS 스킵 (to=${to})`);
    return { sent: false, mocked: true };
  }

  try {
    const response = await fetch('https://api.solapi.com/messages/v4/send-many/detail', {
      method: 'POST',
      headers: {
        Authorization: createSolapiAuthHeader(apiKey, apiSecret),
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message: { to, from: sender, text: message } })
    });
    const json = await response.json();
    if (!response.ok) {
      console.error('sendSms: SOLAPI 오류', json);
      return { sent: false, error: JSON.stringify(json) };
    }
    return { sent: true, result: json };
  } catch (error) {
    console.error('sendSms: 예외 발생', error.message);
    return { sent: false, error: error.message };
  }
}
