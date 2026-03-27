export default {
  key: 'tutor',
  name: '과외',
  steps: [
    { field: 'category', q: '어떤 과외가 필요하신가요?', card: { type: 'choices', data: { field: 'category', options: ['영어', '수학 (초중고 교과)', '입시·시험대비', '성인 취미·자격증'] } } },
    { field: 'level', q: '학년이나 수준을 알려주세요.', card: { type: 'choices', data: { field: 'level', options: ['초등', '중등', '고등', '성인'] } } },
    { field: 'duration', q: '수업 시간을 선택해주세요.', card: { type: 'choices', data: { field: 'duration', options: ['30분', '1시간', '1시간 30분', '2시간'] } } },
    { field: 'location_type', q: '수업 방식을 선택해주세요.', card: { type: 'choices', data: { field: 'location_type', options: ['방문 수업 (선생님이 방문)', '학생 자택', '카페·스터디카페'] } } },
    { field: 'start_address', q: '수업 장소 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '수업 장소' } } },
    { field: 'date', q: '수업 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
  ],
  knowledge: `과외 FAQ:
- 1시간 기준: 영어 65,000원, 수학 60,000원, 입시·시험대비 80,000원, 성인취미·자격 70,000원
- 과목·목표는 첫 수업 시 상세 조율 가능합니다`,
}
