export default {
  key: 'clean',
  name: '청소',
  steps: [
    { field: 'category', q: '청소 종류가 어떻게 되나요?', card: { type: 'choices', data: { field: 'category', options: ['입주청소 (공실)', '이사청소 (퇴거)', '거주청소 (짐 있음)'] } } },
    { field: 'size', q: '몇 평인가요?', card: { type: 'choices', data: { field: 'size', options: ['10평 이하', '20평 이하', '30평', '40평', '50평 이상'] } } },
    { field: 'room_count', q: '방이 몇 개인가요?', card: { type: 'choices', data: { field: 'room_count', options: ['1개', '2개', '3개', '4개 이상'] } } },
    { field: 'condition', q: '오염 정도가 어느 정도인가요?', card: { type: 'choices', data: { field: 'condition', options: ['가벼움', '보통', '심함 (+20%)'] } } },
    { field: 'start_address', q: '청소할 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '청소 주소' } } },
    { field: 'date', q: '청소 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
  ],
  knowledge: `청소 FAQ:
- 입주청소: 공실 상태에서 새로 입주하기 전 청소
- 이사청소: 이사 나가면서 퇴거 시 청소
- 거주청소: 짐이 있는 상태에서 청소 (입주청소의 약 70% 수준)
- 서비스 완료 후 24시간 내 불만족 시 재청소 또는 환불 처리`,
}
