export default {
  key: 'pt',
  name: 'PT',
  steps: [
    { field: 'category', q: '어떤 PT를 받고 싶으신가요?', card: { type: 'choices', data: { field: 'category', options: ['체중감량 다이어트 PT', '근력강화', '체형교정', '재활운동'] } } },
    { field: 'level', q: '현재 운동 경력이 어느 정도인가요?', card: { type: 'choices', data: { field: 'level', options: ['없음 (처음)', '6개월 미만', '1년 이상'] } } },
    { field: 'goal', q: '구체적인 목표가 있으신가요? (예: 체중 -5kg, 어깨 교정)', card: null },
    { field: 'duration', q: 'PT 시간을 선택해주세요.', card: { type: 'choices', data: { field: 'duration', options: ['30분', '1시간', '1시간 30분'] } } },
    { field: 'location_type', q: '어디서 PT를 받고 싶으신가요?', card: { type: 'choices', data: { field: 'location_type', options: ['헬스장', '홈트레이닝', '공원·야외'] } } },
    { field: 'start_address', q: '희망 지역이나 주소를 알려주세요.', card: { type: 'address_picker', data: { label: 'PT 장소' } } },
    { field: 'date', q: 'PT 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
  ],
  knowledge: `PT FAQ:
- 1시간 기준 개인PT 70,000원, 다이어트PT 78,000원, 근력·체형교정 82,000원
- 홈트레이닝의 경우 트레이너가 직접 방문합니다
- 부상 이력이 있으시면 예약 시 미리 알려주세요`,
}
