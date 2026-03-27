export default {
  key: 'vocal',
  name: '보컬 레슨',
  steps: [
    { field: 'category', q: '어떤 보컬 레슨을 받고 싶으신가요?', card: { type: 'choices', data: { field: 'category', options: ['취미 보컬', '오디션·입시', '축가·행사', '녹음·디렉팅'] } } },
    { field: 'level', q: '현재 경력이 어느 정도인가요?', card: { type: 'choices', data: { field: 'level', options: ['처음', '1년 미만', '1년 이상'] } } },
    { field: 'duration', q: '레슨 시간을 선택해주세요.', card: { type: 'choices', data: { field: 'duration', options: ['30분', '1시간', '1시간 30분', '2시간'] } } },
    { field: 'goal', q: '희망 장르나 목표를 간단히 알려주세요. (예: 발라드, 고음 강화)', card: null },
    { field: 'start_address', q: '희망 지역이나 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '레슨 장소' } } },
    { field: 'date', q: '레슨 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
  ],
  knowledge: `보컬 레슨 FAQ:
- 1시간 기준: 취미보컬 60,000원, 오디션·입시 85,000원, 축가·행사 70,000원, 녹음·디렉팅 75,000원
- 축가 레슨은 보통 1~2회 집중 레슨으로 진행됩니다`,
}
