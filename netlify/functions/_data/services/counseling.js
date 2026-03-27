export default {
  key: 'counseling',
  name: '심리상담',
  steps: [
    { field: 'category', q: '어떤 상담이 필요하신가요?', card: { type: 'choices', data: { field: 'category', options: ['개인상담', '커플·부부상담', '가족상담', '청소년상담'] } } },
    { field: 'level', q: '이전에 상담 경험이 있으신가요?', card: { type: 'choices', data: { field: 'level', options: ['처음', '경험 있음'] } } },
    { field: 'location_type', q: '상담 방식을 선택해주세요.', card: { type: 'choices', data: { field: 'location_type', options: ['대면 상담', '온라인 (화상) 상담'] } } },
    { field: 'duration', q: '상담 시간을 선택해주세요.', card: { type: 'choices', data: { field: 'duration', options: ['50분', '1시간 30분', '2시간'] } } },
    { field: 'start_address', q: '상담 장소 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '상담 장소' } } },
    { field: 'date', q: '상담 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
  ],
  knowledge: `심리상담 FAQ:
- 1시간 기준: 개인상담 80,000원, 커플·부부 100,000원, 가족상담 110,000원
- 온라인 상담은 Zoom/Google Meet으로 진행됩니다
- 상담 내용은 철저히 비밀이 보장됩니다`,
}
