import crypto from 'crypto';
import { env } from '../../shared/env.js';
import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';

function createSolapiAuthHeader(apiKey, apiSecret) {
  const dateTime = new Date().toISOString();
  const salt = crypto.randomBytes(16).toString('hex');
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(dateTime + salt)
    .digest('hex');
  return `HMAC-SHA256 apiKey=${apiKey}, date=${dateTime}, salt=${salt}, signature=${signature}`;
}

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  if (event.httpMethod !== 'POST') return fail('POST 요청만 허용됩니다.');

  try {
    const { driverPhone, message } = parseBody(event);
    if (!driverPhone || !message) return fail('driverPhone, message가 필요합니다.');

    const apiKey = env('SOLAPI_API_KEY');
    const apiSecret = env('SOLAPI_API_SECRET');
    const sender = env('SENDER_PHONE');

    if (!apiKey || !apiSecret || !sender) {
      console.error('sendDispatch: SOLAPI_API_KEY, SOLAPI_API_SECRET, SENDER_PHONE 환경변수가 설정되지 않아 문자 발송이 스킵됐습니다. 운영 환경에서는 반드시 설정해야 합니다.');
      return ok({ mocked: true, provider: 'mock', to: driverPhone, message });
    }

    const payload = {
      message: {
        to: driverPhone,
        from: sender,
        text: message
      }
    };

    const response = await fetch(
      'https://api.solapi.com/messages/v4/send-many/detail',
      {
        method: 'POST',
        headers: {
          Authorization: createSolapiAuthHeader(apiKey, apiSecret),
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    const json = await response.json();
    if (!response.ok) {
      return fail('문자 발송 실패', json, response.status || 500);
    }

    return ok({ provider: 'solapi', result: json });
  } catch (error) {
    return fail('문자 발송 실패', error.message, 500);
  }
}
