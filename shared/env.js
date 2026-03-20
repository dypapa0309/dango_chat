export function env(...names) {
  for (const name of names) {
    if (!name) continue;
    const value = process.env[name];
    if (value !== undefined && value !== null && String(value) !== '') return value;
  }
  return '';
}

export function mustEnv(...names) {
  const value = env(...names);
  if (!value) throw new Error(`환경변수 누락: ${names.filter(Boolean).join(' or ')}`);
  return value;
}
