export default {
  key: 'errand',
  name: '심부름',
  steps: [
    { field: 'category', q: '어떤 심부름이 필요하신가요?', card: { type: 'choices', data: { field: 'category', options: ['서류·물건 전달', '장보기·구매 대행', '픽업·수령 대행', '동행·현장 보조', '생활 심부름'] } } },
    { field: 'items', q: '구체적으로 어떤 내용인지 알려주세요.', card: null },
    { field: 'size', q: '짐 크기가 어떻게 되나요?', card: { type: 'choices', data: { field: 'size', options: ['소형 (서류·소형물품)', '중형 (박스 크기)', '대형'] } } },
    { field: 'start_address', q: '출발 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '출발 주소' } } },
    { field: 'end_address', q: '목적지 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '목적지' } } },
    { field: 'date', q: '날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
  ],
  knowledge: `심부름 FAQ:
- 왕복 심부름은 편도 대비 +15,000원
- 긴급(2시간 이내) 요청은 +12,000원
- 대기 시간 발생 시 10분당 3,000원 추가`,
}
