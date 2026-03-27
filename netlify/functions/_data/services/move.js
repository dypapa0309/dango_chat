export default {
  key: 'move',
  name: '소형이사',
  steps: [
    { field: 'start_address', q: '출발지 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '출발지' } } },
    { field: 'floor', q: '출발지 몇 층인가요?', card: { type: 'choices', data: { field: 'floor', options: ['1층', '2층', '3층', '4층', '5층 이상'] } } },
    { field: 'elevator_start', q: '출발지에 엘리베이터가 있나요?', card: { type: 'choices', data: { field: 'elevator_start', options: ['있음', '없음'] } } },
    { field: 'end_address', q: '도착지 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '도착지' } } },
    { field: 'floor_end', q: '도착지 몇 층인가요?', card: { type: 'choices', data: { field: 'floor_end', options: ['1층', '2층', '3층', '4층', '5층 이상'] } } },
    { field: 'elevator_end', q: '도착지에 엘리베이터가 있나요?', card: { type: 'choices', data: { field: 'elevator_end', options: ['있음', '없음'] } } },
    { field: 'items', q: '주요 이삿짐을 알려주세요. 냉장고·세탁기·소파·장롱 등 대형 품목이 있나요?', card: null },
    { field: 'category', q: '차량 종류를 선택해주세요.', card: { type: 'choices', data: { field: 'category', options: ['1톤 카고 (오픈형, 일반 이사짐)', '1톤 탑차 (박스형, 비·먼지 차단)'] } } },
    { field: 'helper', q: '보조 인력이 필요하신가요?', card: { type: 'choices', data: { field: 'helper', options: ['없음', '+1인 추가 (+50,000원)'] } } },
    { field: 'date', q: '이사 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
  ],
  knowledge: `소형이사 FAQ:
- 엘리베이터 없는 경우 층당 5,000원 추가 (출발·도착 각각 적용)
- 보조 인력 1인 추가 시 +50,000원
- 1톤 탑차는 비·먼지 차단이 필요한 정밀 기기·가전에 권장
- 거리 기반 가격: 기본 30,000원 + km당 1,500원`,
}
