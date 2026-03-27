export default {
  key: 'marketing',
  name: '마케팅',
  steps: [
    { field: 'category', q: '어떤 마케팅 서비스가 필요하신가요?', card: { type: 'choices', data: { field: 'category', options: ['SNS 관리·운영', '블로그 포스팅', '광고 대행', '콘텐츠 제작', '영상 제작·편집', '사진 촬영·보정', '카피라이팅', 'SEO', '브랜딩·로고', '이메일·문자 마케팅'] } } },
    { field: 'items', q: '업종과 업체를 간단히 소개해주세요. (예: 서울 강남 카페)', card: null },
    { field: 'goal', q: '마케팅 목표가 무엇인가요?', card: { type: 'choices', data: { field: 'goal', options: ['브랜드 인지도', '매출 증대', '팔로워 증가', '기타'] } } },
    { field: 'qty', q: '건수나 기간을 알려주세요. (예: 월 4회, 3개월)', card: null },
    { field: 'date', q: '시작 희망 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
  ],
  knowledge: `마케팅 FAQ:
- SNS관리 150,000원~/월, 블로그포스팅 60,000원~/건, 영상제작 250,000원~/건
- 계약 전 포트폴리오 확인 가능합니다
- 월 단위 계약은 장기 할인이 적용될 수 있습니다`,
}
