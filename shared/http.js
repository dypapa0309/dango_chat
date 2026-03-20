export function json(body = {}, statusCode = 200, headers = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
      ...headers
    },
    body: JSON.stringify(body)
  };
}

export function ok(data = {}, statusCode = 200) {
  return json({ success: true, ...data }, statusCode);
}

export function fail(message, detail = null, statusCode = 400) {
  return json({ success: false, error: message, detail }, statusCode);
}

export function parseBody(event) {
  try {
    return event?.body ? JSON.parse(event.body) : {};
  } catch {
    return {};
  }
}

export function handleOptions(event) {
  if (event.httpMethod === 'OPTIONS') return json({}, 204);
  return null;
}
