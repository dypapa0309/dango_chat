import { ok, fail, parseBody, handleOptions } from '../../shared/http.js';
import { sendSms } from '../../shared/sms.js';

export async function handler(event) {
  const opt = handleOptions(event);
  if (opt) return opt;
  if (event.httpMethod !== 'POST') return fail('POST 요청만 허용됩니다.');

  try {
    const { driverPhone, message } = parseBody(event);
    if (!driverPhone || !message) return fail('driverPhone, message가 필요합니다.');

    const result = await sendSms(driverPhone, message);
    if (result.mocked) return ok({ mocked: true, provider: 'mock', to: driverPhone, message });
    if (!result.sent) return fail('문자 발송 실패', result.error, 500);
    return ok({ provider: 'solapi', result: result.result });
  } catch (error) {
    return fail('문자 발송 실패', error.message, 500);
  }
}
