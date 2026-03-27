export default {
  key: 'interior',
  name: '인테리어',
  steps: [
    { field: 'category', q: '어떤 인테리어 작업이 필요하신가요?', card: { type: 'choices', data: { field: 'category', options: ['부분 인테리어', '도배·장판', '집수리·보수', '상담·실측'] } } },
    { field: 'qty', q: '작업할 공간이 몇 개인가요?', card: { type: 'choices', data: { field: 'qty', options: ['1공간', '2공간', '3공간 이상'] } } },
    { field: 'size', q: '전체 평수가 어떻게 되나요?', card: { type: 'choices', data: { field: 'size', options: ['10평 이하', '20평 이하', '30평', '40평', '50평 이상'] } } },
    { field: 'items', q: '희망 마감재나 요청사항을 알려주세요. (없으면 "없음" 입력)', card: null },
    { field: 'start_address', q: '시공할 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '시공 주소' } } },
    { field: 'date', q: '시공 희망 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
  ],
  knowledge: `인테리어 FAQ:
- 공간당 기준: 부분인테리어 180,000원~, 도배·장판 160,000원~, 집수리·보수 150,000원~
- 상담·실측은 70,000원이며, 시공 계약 시 견적 비용이 차감됩니다
- 대규모 공사는 실측 후 정확한 견적 안내 드립니다`,
}
