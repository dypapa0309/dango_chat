import axios from 'axios';
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
    const { driverPhone, message, kakao = false } = parseBody(event);
    if (!driverPhone || !message) return fail('driverPhone, message가 필요합니다.');

    const apiKey = env('SOLAPI_API_KEY');
    const apiSecret = env('SOLAPI_API_SECRET');
    const sender = env('SENDER_PHONE');

    if (!apiKey || !apiSecret || !sender) {
      return ok({ mocked: true, provider: 'mock', to: driverPhone, message, kakao });
    }

    const payload = {
      message: {
        to: driverPhone,
        from: sender,
        text: message
      }
    };

    const response = await axios.post(
      'https://api.solapi.com/messages/v4/send-many/detail',
      payload,
      {
        headers: {
          Authorization: createSolapiAuthHeader(apiKey, apiSecret),
          'Content-Type': 'application/json'
        },
        timeout: 15000
      }
    );

    return ok({ provider: 'solapi', result: response.data });
  } catch (error) {
    return fail(
      '문자 발송 실패',
      error.response?.data || error.message,
      error.response?.status || 500
    );
  }
}
