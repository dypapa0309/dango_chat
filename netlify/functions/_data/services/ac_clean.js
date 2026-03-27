export default {
  key: 'ac_clean',
  name: '에어컨 청소',
  steps: [
    { field: 'category', q: '어떤 에어컨을 청소할까요?', card: { type: 'choices', data: { field: 'category', options: ['벽걸이 (56,000원)', '스탠드 (92,000원)', '2in1 세트 (139,000원)', '시스템에어컨 (82,000원~)'] } } },
    { field: 'qty', q: '몇 대 청소할까요?', card: { type: 'choices', data: { field: 'qty', options: ['1대', '2대', '3대', '4대 이상'] } } },
    { field: 'last_clean', q: '마지막으로 청소하신 게 언제쯤인가요?', card: { type: 'choices', data: { field: 'last_clean', options: ['1년 미만', '1~2년', '2년 이상', '처음'] } } },
    { field: 'condition', q: '현재 에어컨 상태가 어떤가요?', card: { type: 'choices', data: { field: 'condition', options: ['냄새남', '물 떨어짐', '소음 있음', '이상 없음'] } } },
    { field: 'start_address', q: '서비스 받을 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '서비스 주소' } } },
    { field: 'date', q: '방문 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
  ],
  knowledge: `에어컨 청소 FAQ:
- 청소 후 1주일 이내 이상 발생 시 무상 AS 제공
- 시스템에어컨은 1way/2way/4way에 따라 가격이 달라집니다 (82,000~150,000원)
- 냄새·물 떨어짐·소음은 청소로 대부분 해결됩니다`,
}
