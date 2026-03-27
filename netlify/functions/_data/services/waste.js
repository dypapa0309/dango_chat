export default {
  key: 'waste',
  name: '폐기물 수거',
  steps: [
    { field: 'category', q: '어떤 폐기물을 수거할까요?', card: { type: 'choices', data: { field: 'category', options: ['가구 폐기', '가전 폐기', '생활 폐기물', '철거 포함 정리'] } } },
    { field: 'items', q: '버릴 품목을 구체적으로 알려주세요. (예: 냉장고 1대, 소파 1개)', card: null },
    { field: 'size', q: '전체 규모가 어느 정도인가요?', card: { type: 'choices', data: { field: 'size', options: ['소형 (소형가구 1~2개)', '중형 (가구 3~5개)', '대형 (가구 6개 이상 또는 이삿짐 수준)'] } } },
    { field: 'floor', q: '몇 층인가요?', card: { type: 'choices', data: { field: 'floor', options: ['1층', '2층', '3층', '4층', '5층 이상'] } } },
    { field: 'elevator_start', q: '엘리베이터가 있나요?', card: { type: 'choices', data: { field: 'elevator_start', options: ['있음', '없음'] } } },
    { field: 'helper', q: '해체·분리 작업이 필요한가요?', card: { type: 'choices', data: { field: 'helper', options: ['필요없음', '해체·분리 필요 (+30,000원)'] } } },
    { field: 'start_address', q: '수거할 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '수거 주소' } } },
    { field: 'date', q: '수거 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
  ],
  knowledge: `폐기물 수거 FAQ:
- 폐기물 스티커는 당고 전문가가 직접 처리하므로 별도 구매 불필요
- 냉장고·세탁기·대형 가전은 추가 요금이 발생할 수 있습니다
- 엘리베이터 없는 경우 층당 8,000원 추가`,
}
