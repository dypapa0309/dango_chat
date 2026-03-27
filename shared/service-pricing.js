/**
 * 서비스별 룰 기반 가격 계산
 * move/yongdal은 거리 기반이라 별도 처리 (chat-ai.js에서 get-route-price 호출)
 */

const TIME_MULTIPLIER = { '30분': 0.6, '1시간': 1.0, '1시간 30분': 1.4, '2시간': 1.75, '50분': 0.85 }

function parseQty(val) {
  if (!val) return 1
  const n = parseInt(String(val))
  return Number.isFinite(n) && n > 0 ? n : 1
}

function parseFloor(val) {
  if (!val) return 0
  const n = parseInt(String(val))
  return Number.isFinite(n) && n > 0 ? n : 0
}

function noElevator(val) {
  return String(val || '').includes('없음')
}

function money(n) { return Math.round(n / 1000) * 1000 }

// ── 에어컨 청소 ──────────────────────────────────────────────
function calcAcClean(c) {
  const priceMap = { '벽걸이': 56000, '스탠드': 92000, '2in1': 139000, '시스템': 82000 }
  const cat = String(c.category || '')
  let unitPrice = 56000
  if (cat.includes('스탠드')) unitPrice = 92000
  else if (cat.includes('2in1') || cat.includes('투인원')) unitPrice = 139000
  else if (cat.includes('시스템')) unitPrice = 82000
  const qty = parseQty(c.qty)
  const total = money(unitPrice * qty)
  return {
    total,
    breakdown: [
      { label: `${cat.split(' ')[0]} ${qty}대`, amount: total },
    ],
    summary: [`에어컨 종류: ${cat}`, `대수: ${qty}대`, `마지막 청소: ${c.last_clean || '-'}`, `이상 증상: ${c.condition || '-'}`],
  }
}

// ── 가전 청소 ────────────────────────────────────────────────
function calcApplianceClean(c) {
  const priceMap = {
    '세탁기 (통돌이)': 90000, '세탁기 (드럼)': 110000,
    '건조기': 80000, '냉장고 (양문형)': 80000, '냉장고 (일반)': 70000,
    '주방후드': 60000, '식기세척기': 70000,
  }
  const cat = String(c.category || '')
  let unitPrice = 80000
  for (const [k, v] of Object.entries(priceMap)) {
    if (cat.includes(k.split(' ')[0]) || cat === k) { unitPrice = v; break }
  }
  if (cat.includes('드럼')) unitPrice = 110000
  else if (cat.includes('통돌이')) unitPrice = 90000
  const qty = parseQty(c.qty)
  const total = money(unitPrice * qty)
  return {
    total,
    breakdown: [{ label: `${cat} ${qty}대`, amount: total }],
    summary: [`가전 종류: ${cat}`, `대수: ${qty}대`],
  }
}

// ── 청소 ─────────────────────────────────────────────────────
function calcClean(c) {
  const cat = String(c.category || '')
  const sizeStr = String(c.size || '20평')
  let baseBySize = 150000
  if (sizeStr.includes('10평')) baseBySize = 100000
  else if (sizeStr.includes('20평')) baseBySize = 150000
  else if (sizeStr.includes('30평')) baseBySize = 200000
  else if (sizeStr.includes('40평')) baseBySize = 260000
  else if (sizeStr.includes('50평')) baseBySize = 320000

  let ratio = 1.0
  if (cat.includes('거주')) ratio = 0.7
  else if (cat.includes('이사')) ratio = 0.9

  let contamFee = 0
  if (String(c.condition || '').includes('심함')) contamFee = Math.round(baseBySize * ratio * 0.2)

  const base = money(baseBySize * ratio)
  const total = money(base + contamFee)
  const breakdown = [{ label: `${cat || '청소'} 기본 (${sizeStr})`, amount: base }]
  if (contamFee > 0) breakdown.push({ label: '오염도 심함 추가', amount: contamFee })
  return {
    total,
    breakdown,
    summary: [`청소 종류: ${cat}`, `평수: ${sizeStr}`, `방 수: ${c.room_count || '-'}`, `오염도: ${c.condition || '-'}`],
  }
}

// ── 폐기물 수거 ──────────────────────────────────────────────
function calcWaste(c) {
  const catBase = { '가구 폐기': 50000, '가전 폐기': 70000, '생활 폐기물': 45000, '철거 포함 정리': 100000 }
  const cat = String(c.category || '')
  let base = 50000
  for (const [k, v] of Object.entries(catBase)) { if (cat.includes(k.split(' ')[0])) { base = v; break } }

  const sizeAdd = String(c.size || '').includes('중형') ? 25000 : String(c.size || '').includes('대형') ? 55000 : 0
  const floorFee = noElevator(c.elevator_start) ? parseFloor(c.floor) * 8000 : 0
  const disassembleFee = String(c.helper || '').includes('해체') ? 30000 : 0
  const total = money(base + sizeAdd + floorFee + disassembleFee)
  const breakdown = [{ label: `${cat} 기본`, amount: base }]
  if (sizeAdd) breakdown.push({ label: `규모 추가 (${c.size})`, amount: sizeAdd })
  if (floorFee) breakdown.push({ label: `계단 ${c.floor} (엘베없음)`, amount: floorFee })
  if (disassembleFee) breakdown.push({ label: '해체·분리 작업', amount: disassembleFee })
  return {
    total,
    breakdown,
    summary: [`폐기물 종류: ${cat}`, `품목: ${c.items || '-'}`, `규모: ${c.size || '-'}`, `층수: ${c.floor || '-'}층`],
  }
}

// ── 설치 ─────────────────────────────────────────────────────
function calcInstall(c) {
  const catBase = { '가구': 60000, '가전': 70000, 'TV': 90000, '커튼': 50000, '조명': 50000 }
  const cat = String(c.category || '')
  let base = 60000
  for (const [k, v] of Object.entries(catBase)) { if (cat.includes(k)) { base = v; break } }
  const removalFee = String(c.helper || '').includes('철거') ? 20000 : 0
  const total = money(base + removalFee)
  const breakdown = [{ label: `${cat} 설치 기본`, amount: base }]
  if (removalFee) breakdown.push({ label: '기존 제품 철거', amount: removalFee })
  return {
    total,
    breakdown,
    summary: [`설치 종류: ${cat}`, `품목: ${c.items || '-'}`],
  }
}

// ── 심부름 ───────────────────────────────────────────────────
function calcErrand(c) {
  const catBase = { '서류': 35000, '장보기': 40000, '픽업': 38000, '동행': 50000, '생활': 45000 }
  const cat = String(c.category || '')
  let base = 40000
  for (const [k, v] of Object.entries(catBase)) { if (cat.includes(k)) { base = v; break } }
  const sizeAdd = String(c.size || '').includes('중형') ? 12000 : String(c.size || '').includes('대형') ? 28000 : 0
  const total = money(base + sizeAdd)
  const breakdown = [{ label: `${cat} 기본`, amount: base }]
  if (sizeAdd) breakdown.push({ label: `짐 크기 추가 (${c.size})`, amount: sizeAdd })
  return {
    total,
    breakdown,
    summary: [`심부름 종류: ${cat}`, `내용: ${c.items || '-'}`, `짐 크기: ${c.size || '-'}`],
  }
}

// ── 정리수납 ─────────────────────────────────────────────────
function calcOrganize(c) {
  const catBase = { '옷장': 70000, '주방': 80000, '이사': 90000, '집 전체': 140000 }
  const cat = String(c.category || '')
  let unitPrice = 70000
  for (const [k, v] of Object.entries(catBase)) { if (cat.includes(k)) { unitPrice = v; break } }
  const qty = parseQty(c.qty)
  const firstSpace = unitPrice
  const addlSpaces = qty > 1 ? Math.round(unitPrice * 0.6) * (qty - 1) : 0
  const total = money(firstSpace + addlSpaces)
  const breakdown = [{ label: `${cat} 1공간`, amount: firstSpace }]
  if (addlSpaces > 0) breakdown.push({ label: `추가 ${qty - 1}공간 (40% 할인)`, amount: addlSpaces })
  return {
    total,
    breakdown,
    summary: [`정리 종류: ${cat}`, `공간 수: ${qty}공간`],
  }
}

// ── 레슨 공통 (골프/PT/보컬/과외/심리상담) ───────────────────
const LESSON_PRICES = {
  golf: { '입문': 70000, '필드': 120000, '숏게임': 85000, '스윙': 85000 },
  pt: { '체중감량': 78000, '다이어트': 78000, '근력': 82000, '체형': 82000, '재활': 75000 },
  vocal: { '취미': 60000, '오디션': 85000, '입시': 85000, '축가': 70000, '녹음': 75000 },
  tutor: { '영어': 65000, '수학': 60000, '교과': 60000, '입시': 80000, '시험': 80000, '성인': 70000 },
  counseling: { '개인': 80000, '커플': 100000, '부부': 100000, '가족': 110000, '청소년': 80000 },
}

function calcLesson(serviceType, c) {
  const prices = LESSON_PRICES[serviceType] || {}
  const cat = String(c.category || '')
  let unitPrice = Object.values(prices)[0] || 70000
  for (const [k, v] of Object.entries(prices)) { if (cat.includes(k)) { unitPrice = v; break } }
  const durStr = String(c.duration || '1시간')
  const multiplier = TIME_MULTIPLIER[durStr] || 1.0
  const total = money(unitPrice * multiplier)
  return {
    total,
    breakdown: [
      { label: `${cat} 기본 (1시간)`, amount: unitPrice },
      ...(multiplier !== 1.0 ? [{ label: `시간 조정 (${durStr})`, amount: money(unitPrice * multiplier) - unitPrice }] : []),
    ],
    summary: [`종류: ${cat}`, `시간: ${durStr}`, `경력: ${c.level || '-'}`, ...(c.goal ? [`목표: ${c.goal}`] : [])],
  }
}

// ── 인테리어 ─────────────────────────────────────────────────
function calcInterior(c) {
  const catBase = { '부분': 180000, '도배': 160000, '집수리': 150000, '상담': 70000 }
  const cat = String(c.category || '')
  let unitPrice = 150000
  for (const [k, v] of Object.entries(catBase)) { if (cat.includes(k)) { unitPrice = v; break } }
  const qty = parseQty(c.qty)
  const total = money(unitPrice * qty)
  return {
    total,
    breakdown: [{ label: `${cat} ${qty}공간`, amount: total }],
    summary: [`작업 종류: ${cat}`, `공간 수: ${qty}공간`, `평수: ${c.size || '-'}`],
  }
}

// ── 인테리어 보조 ────────────────────────────────────────────
function calcInteriorHelp(c) {
  const catBase = { '자재': 100000, '가구': 90000, '집기': 90000, '철거': 110000, '하루': 130000 }
  const cat = String(c.category || '')
  let unitPrice = 100000
  for (const [k, v] of Object.entries(catBase)) { if (cat.includes(k)) { unitPrice = v; break } }
  const qty = parseQty(c.qty)
  const total = money(unitPrice * qty)
  return {
    total,
    breakdown: [{ label: `${cat} ${qty}건`, amount: total }],
    summary: [`작업 종류: ${cat}`, `건수: ${qty}건`],
  }
}

// ── 마케팅 ───────────────────────────────────────────────────
function calcMarketing(c) {
  const catBase = {
    'SNS': 150000, '블로그': 60000, '광고': 200000, '콘텐츠': 120000,
    '영상': 250000, '사진': 180000, '카피': 80000, 'SEO': 130000,
    '브랜딩': 200000, '이메일': 90000, '문자': 90000,
  }
  const cat = String(c.category || '')
  let unitPrice = 100000
  for (const [k, v] of Object.entries(catBase)) { if (cat.includes(k)) { unitPrice = v; break } }
  const qty = parseQty(c.qty)
  const total = money(unitPrice * qty)
  return {
    total,
    breakdown: [{ label: `${cat} 기본`, amount: unitPrice }, ...(qty > 1 ? [{ label: `×${qty} 건/회`, amount: total - unitPrice }] : [])],
    summary: [`마케팅 종류: ${cat}`, `건수/기간: ${c.qty || '-'}`, `목표: ${c.goal || '-'}`],
  }
}

// ── 메인 export ──────────────────────────────────────────────
export function calculateServicePrice(serviceType, collected) {
  const c = collected || {}
  switch (serviceType) {
    case 'ac_clean': return calcAcClean(c)
    case 'appliance_clean': return calcApplianceClean(c)
    case 'clean': return calcClean(c)
    case 'waste': return calcWaste(c)
    case 'install': return calcInstall(c)
    case 'errand': return calcErrand(c)
    case 'organize': return calcOrganize(c)
    case 'golf': return calcLesson('golf', c)
    case 'pt': return calcLesson('pt', c)
    case 'vocal': return calcLesson('vocal', c)
    case 'tutor': return calcLesson('tutor', c)
    case 'counseling': return calcLesson('counseling', c)
    case 'interior': return calcInterior(c)
    case 'interior_help': return calcInteriorHelp(c)
    case 'marketing': return calcMarketing(c)
    default: return null
  }
}
