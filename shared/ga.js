import crypto from 'crypto';
import { env, mustEnv } from './env.js';

function base64url(input) {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signJwt({ clientEmail, privateKey, scope }) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const claim = {
    iss: clientEmail,
    scope,
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const encodedHeader = base64url(JSON.stringify(header));
  const encodedClaim = base64url(JSON.stringify(claim));
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(`${encodedHeader}.${encodedClaim}`);
  signer.end();

  const signature = signer
    .sign(privateKey, 'base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');

  return `${encodedHeader}.${encodedClaim}.${signature}`;
}

async function getAccessToken() {
  const clientEmail = mustEnv('GA_CLIENT_EMAIL');
  const privateKey = mustEnv('GA_PRIVATE_KEY').replace(/\\n/g, '\n');

  const jwt = signJwt({
    clientEmail,
    privateKey,
    scope: 'https://www.googleapis.com/auth/analytics.readonly'
  });

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  const tokenJson = await tokenRes.json();
  if (!tokenRes.ok || !tokenJson.access_token) {
    throw new Error(tokenJson.error_description || tokenJson.error || 'Failed to get Google access token');
  }

  return tokenJson.access_token;
}

function metricValueByName(rows = [], headers = [], name) {
  const idx = headers.findIndex((header) => header.name === name);
  if (idx < 0) return 0;
  const raw = rows[0]?.metricValues?.[idx]?.value;
  return Number(raw || 0);
}

export function hasGaRealtimeConfig() {
  return Boolean(env('GA4_PROPERTY_ID') && env('GA_CLIENT_EMAIL') && env('GA_PRIVATE_KEY'));
}

export function toKstLabel(date = new Date()) {
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }).format(date).replace('. ', '-').replace('. ', '-').replace('.', '').trim();
}

export function getKstDayRange(date = new Date()) {
  const kst = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));
  const startKst = new Date(kst.getFullYear(), kst.getMonth(), kst.getDate());
  const endKst = new Date(kst.getFullYear(), kst.getMonth(), kst.getDate() + 1);
  const offsetMs = 9 * 60 * 60 * 1000;

  return {
    start: new Date(startKst.getTime() - offsetMs).toISOString(),
    end: new Date(endKst.getTime() - offsetMs).toISOString()
  };
}

export async function fetchGaRealtime() {
  const propertyId = mustEnv('GA4_PROPERTY_ID');
  const token = await getAccessToken();

  const apiRes = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runRealtimeReport`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      metrics: [
        { name: 'activeUsers' },
        { name: 'screenPageViews' },
        { name: 'eventCount' }
      ]
    })
  });

  const json = await apiRes.json();
  if (!apiRes.ok) {
    throw new Error(json.error?.message || 'GA realtime request failed');
  }

  const rows = json.rows || [];
  const headers = json.metricHeaders || [];

  return {
    activeUsers: metricValueByName(rows, headers, 'activeUsers'),
    screenPageViews: metricValueByName(rows, headers, 'screenPageViews'),
    eventCount: metricValueByName(rows, headers, 'eventCount'),
    minuteWindowLabel: '최근 30분',
    fetchedAtKst: toKstLabel(new Date())
  };
}
