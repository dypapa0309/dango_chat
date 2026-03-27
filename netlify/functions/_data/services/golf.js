export default {
  key: 'golf',
  name: '골프 레슨',
  steps: [
    { field: 'category', q: '어떤 골프 레슨을 받고 싶으신가요?', card: { type: 'choices', data: { field: 'category', options: ['입문 (기본 자세)', '필드 레슨', '숏게임 교정 (퍼팅·어프로치)', '스윙·비거리 교정'] } } },
    { field: 'level', q: '현재 골프 경력이 어느 정도인가요?', card: { type: 'choices', data: { field: 'level', options: ['입문자 (처음)', '초급 (1~2년)', '중급 (3년 이상)'] } } },
    { field: 'duration', q: '레슨 시간을 선택해주세요.', card: { type: 'choices', data: { field: 'duration', options: ['30분', '1시간', '1시간 30분', '2시간'] } } },
    { field: 'location_type', q: '어떤 장소에서 레슨받고 싶으신가요?', card: { type: 'choices', data: { field: 'location_type', options: ['실내 연습장', '스크린 골프', '야외 필드'] } } },
    { field: 'start_address', q: '희망 지역이나 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '레슨 장소' } } },
    { field: 'date', q: '레슨 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
  ],
  knowledge: `골프 레슨 FAQ:
- 1시간 기준 입문 70,000원, 필드레슨 120,000원, 숏게임·스윙교정 85,000원
- 30분 레슨은 1시간의 60% 요금 적용
- 장소(연습장) 대여비는 별도입니다`,
}
