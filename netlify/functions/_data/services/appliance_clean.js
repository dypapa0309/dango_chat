export default {
  key: 'appliance_clean',
  name: '가전 청소',
  steps: [
    { field: 'category', q: '어떤 가전을 청소할까요?', card: { type: 'choices', data: { field: 'category', options: ['세탁기 (통돌이)', '세탁기 (드럼)', '건조기', '냉장고 (양문형)', '냉장고 (일반)', '주방후드', '식기세척기'] } } },
    { field: 'qty', q: '몇 대 청소할까요?', card: { type: 'choices', data: { field: 'qty', options: ['1대', '2대', '3대 이상'] } } },
    { field: 'last_clean', q: '마지막으로 청소하신 게 언제쯤인가요?', card: { type: 'choices', data: { field: 'last_clean', options: ['1년 미만', '1~2년', '2년 이상', '처음'] } } },
    { field: 'condition', q: '현재 이상 증상이 있나요?', card: { type: 'choices', data: { field: 'condition', options: ['냄새남', '소음 있음', '성능 저하', '이상 없음'] } } },
    { field: 'start_address', q: '서비스 받을 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '서비스 주소' } } },
    { field: 'date', q: '방문 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
  ],
  knowledge: `가전 청소 FAQ:
- 드럼세탁기는 통돌이보다 청소 시간이 더 걸려 가격이 높습니다
- 청소 후 냄새·소음이 지속되면 24시간 내 재방문 AS 가능합니다`,
}
