export default {
  key: 'yongdal',
  name: '용달',
  steps: [
    { field: 'start_address', q: '출발지 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '출발지' } } },
    { field: 'floor', q: '출발지 몇 층인가요?', card: { type: 'choices', data: { field: 'floor', options: ['1층', '2층', '3층', '4층', '5층 이상'] } } },
    { field: 'elevator_start', q: '출발지에 엘리베이터가 있나요?', card: { type: 'choices', data: { field: 'elevator_start', options: ['있음', '없음'] } } },
    { field: 'end_address', q: '도착지 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '도착지' } } },
    { field: 'floor_end', q: '도착지 몇 층인가요?', card: { type: 'choices', data: { field: 'floor_end', options: ['1층', '2층', '3층', '4층', '5층 이상'] } } },
    { field: 'elevator_end', q: '도착지에 엘리베이터가 있나요?', card: { type: 'choices', data: { field: 'elevator_end', options: ['있음', '없음'] } } },
    { field: 'size', q: '짐 규모가 어느 정도인가요?', card: { type: 'choices', data: { field: 'size', options: ['소형 (가방·모니터·소형가전, 30,000원~)', '중형 (책상·행거·자전거, 60,000원~)', '대형 (냉장고·침대·소파, 80,000원~)'] } } },
    { field: 'items', q: '구체적인 품목 목록을 알려주세요.', card: null },
    { field: 'helper', q: '기사 도움이 필요하신가요?', card: { type: 'choices', data: { field: 'helper', options: ['없음 (기사 운전만)', '출발지 도움 (+10,000원)', '도착지 도움 (+10,000원)', '동승 (+20,000원)'] } } },
    { field: 'date', q: '날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
  ],
  knowledge: `용달 FAQ:
- 기본 파손 보상 최대 30만원 포함, 고가품은 사전에 알려주세요
- 엘리베이터 없는 경우 층당 5,000원 추가
- 거리 기반 가격: 소형 30,000원~, 중형 60,000원~, 대형 80,000원~`,
}
