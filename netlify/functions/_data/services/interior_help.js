export default {
  key: 'interior_help',
  name: '인테리어 보조',
  steps: [
    { field: 'category', q: '어떤 보조 작업이 필요하신가요?', card: { type: 'choices', data: { field: 'category', options: ['자재 운반', '가구·집기 이동', '철거 후 정리', '하루 현장 보조'] } } },
    { field: 'qty', q: '작업 건수가 어떻게 되나요?', card: { type: 'choices', data: { field: 'qty', options: ['1건', '2건', '3건 이상'] } } },
    { field: 'items', q: '현장 조건을 알려주세요. (층수, 엘베 여부, 주차 등)', card: null },
    { field: 'start_address', q: '현장 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '현장 주소' } } },
    { field: 'date', q: '작업 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
  ],
  knowledge: `인테리어 보조 FAQ:
- 자재운반 100,000원~, 가구·집기이동 90,000원~, 철거후정리 110,000원~, 하루현장보조 130,000원~
- 무거운 자재나 대형 가구 이동 시 2인 이상 투입 가능합니다`,
}
