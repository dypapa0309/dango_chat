export default {
  key: 'organize',
  name: '정리수납',
  steps: [
    { field: 'category', q: '어떤 정리수납이 필요하신가요?', card: { type: 'choices', data: { field: 'category', options: ['옷장·드레스룸', '주방', '이사 전후 정리', '집 전체'] } } },
    { field: 'qty', q: '몇 공간을 정리할까요?', card: { type: 'choices', data: { field: 'qty', options: ['1공간', '2공간', '3공간 이상'] } } },
    { field: 'condition', q: '현재 짐 상태가 어느 정도인가요?', card: { type: 'choices', data: { field: 'condition', options: ['보통', '많음', '매우 많음'] } } },
    { field: 'helper', q: '수납용품 구매도 포함할까요?', card: { type: 'choices', data: { field: 'helper', options: ['포함 안 함', '수납용품 구매 포함 (추가 비용)'] } } },
    { field: 'start_address', q: '정리할 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '서비스 주소' } } },
    { field: 'date', q: '날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
  ],
  knowledge: `정리수납 FAQ:
- 추가 공간은 기본가의 40% 할인 적용
- 수납용품(바구니·옷걸이 등) 구매 대행 시 실비 + 서비스 비용 별도
- 이사 전후 정리는 이사 당일도 가능합니다`,
}
