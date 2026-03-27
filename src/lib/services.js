/**
 * 당고 서비스 타입 설정
 * AI 시스템 프롬프트 및 UI에서 사용
 */

export const SERVICES = {
  move: {
    name: '소형이사',
    emoji: '📦',
    desc: '원룸, 오피스텔 이사',
    requiredFields: ['date', 'start_address', 'end_address', 'floor', 'category'],
    fieldLabels: {
      date: '이사 날짜',
      start_address: '출발지',
      end_address: '도착지',
      floor: '층수 (엘리베이터 없는 경우)',
      category: '이사 규모',
    },
  },
  clean: {
    name: '청소',
    emoji: '🧹',
    desc: '이사청소, 가정청소',
    requiredFields: ['date', 'start_address', 'size', 'category'],
    fieldLabels: {
      date: '청소 날짜',
      start_address: '주소',
      size: '평수',
      category: '청소 종류',
    },
  },
  waste: {
    name: '폐기물 수거',
    emoji: '🗑️',
    desc: '가구·가전 폐기',
    requiredFields: ['date', 'start_address', 'category', 'items'],
    fieldLabels: {
      date: '수거 날짜',
      start_address: '수거 주소',
      category: '폐기물 종류',
      items: '버릴 품목',
    },
  },
  install: {
    name: '설치',
    emoji: '🔧',
    desc: '가구·가전·TV 설치',
    requiredFields: ['date', 'start_address', 'category', 'qty'],
    fieldLabels: {
      date: '설치 날짜',
      start_address: '설치 주소',
      category: '설치 종류',
      qty: '수량',
    },
  },
  errand: {
    name: '심부름',
    emoji: '🛵',
    desc: '배달, 장보기, 픽업',
    requiredFields: ['date', 'start_address', 'category'],
    fieldLabels: {
      date: '날짜',
      start_address: '주소',
      category: '심부름 종류',
    },
  },
  organize: {
    name: '정리수납',
    emoji: '🗂️',
    desc: '옷장, 주방 정리',
    requiredFields: ['date', 'start_address', 'category'],
    fieldLabels: {
      date: '날짜',
      start_address: '주소',
      category: '정리 종류',
    },
  },
  ac_clean: {
    name: '에어컨 청소',
    emoji: '❄️',
    desc: '벽걸이, 스탠드, 시스템',
    requiredFields: ['date', 'start_address', 'category', 'qty'],
    fieldLabels: {
      date: '날짜',
      start_address: '주소',
      category: '에어컨 종류',
      qty: '대수',
    },
  },
  appliance_clean: {
    name: '가전 청소',
    emoji: '🫧',
    desc: '세탁기, 냉장고 등',
    requiredFields: ['date', 'start_address', 'category'],
    fieldLabels: {
      date: '날짜',
      start_address: '주소',
      category: '가전 종류',
    },
  },
  golf: {
    name: '골프 레슨',
    emoji: '⛳',
    desc: '스윙, 숏게임 교정',
    requiredFields: ['date', 'start_address', 'category', 'duration'],
    fieldLabels: {
      date: '날짜',
      start_address: '장소',
      category: '레슨 종류',
      duration: '레슨 시간',
    },
  },
  pt: {
    name: 'PT',
    emoji: '💪',
    desc: '개인 트레이닝',
    requiredFields: ['date', 'start_address', 'category', 'duration'],
    fieldLabels: {
      date: '날짜',
      start_address: '장소',
      category: 'PT 종류',
      duration: '시간',
    },
  },
  counseling: {
    name: '심리상담',
    emoji: '🧠',
    desc: '개인, 커플, 가족 상담',
    requiredFields: ['date', 'start_address', 'category', 'duration'],
    fieldLabels: {
      date: '날짜',
      start_address: '장소',
      category: '상담 종류',
      duration: '시간',
    },
  },
  marketing: {
    name: '마케팅',
    emoji: '📢',
    desc: 'SNS, 광고, 콘텐츠',
    requiredFields: ['date', 'start_address', 'category'],
    fieldLabels: {
      date: '시작 날짜',
      start_address: '연락처/주소',
      category: '마케팅 종류',
    },
  },
  yongdal: {
    name: '용달',
    emoji: '🚚',
    desc: '짐 운반, 이삿짐 운반',
    requiredFields: ['date', 'start_address', 'end_address', 'category'],
    fieldLabels: {
      date: '날짜',
      start_address: '출발지',
      end_address: '도착지',
      category: '짐 종류',
    },
  },
  vocal: {
    name: '보컬 레슨',
    emoji: '🎤',
    desc: '취미·오디션·축가·녹음',
    requiredFields: ['date', 'start_address', 'category', 'duration'],
    fieldLabels: { date: '날짜', start_address: '장소', category: '레슨 종류', duration: '시간' },
  },
  tutor: {
    name: '과외',
    emoji: '📚',
    desc: '영어·수학·입시 1:1 과외',
    requiredFields: ['date', 'start_address', 'category', 'duration'],
    fieldLabels: { date: '날짜', start_address: '장소', category: '과목', duration: '시간' },
  },
  interior: {
    name: '인테리어',
    emoji: '🏠',
    desc: '도배·장판·부분 공사',
    requiredFields: ['date', 'start_address', 'category'],
    fieldLabels: { date: '날짜', start_address: '주소', category: '공사 종류' },
  },
  interior_help: {
    name: '인테리어 보조',
    emoji: '🔨',
    desc: '자재 운반·현장 보조',
    requiredFields: ['date', 'start_address', 'category'],
    fieldLabels: { date: '날짜', start_address: '현장 주소', category: '작업 종류' },
  },
}

export const SERVICE_LIST = Object.entries(SERVICES).map(([key, val]) => ({
  key,
  ...val,
}))

/** 서비스 타입에서 서비스명 반환 */
export function getServiceName(type) {
  return SERVICES[type]?.name ?? type
}

/** 필수 필드 중 아직 없는 것 반환 */
export function getMissingFields(serviceType, collected = {}) {
  const svc = SERVICES[serviceType]
  if (!svc) return []
  return svc.requiredFields.filter((f) => !collected[f])
}
