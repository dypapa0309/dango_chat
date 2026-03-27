export default {
  key: 'install',
  name: '설치',
  steps: [
    { field: 'category', q: '무엇을 설치할까요?', card: { type: 'choices', data: { field: 'category', options: ['가구 (침대·책상·장롱)', '가전 (세탁기·냉장고·건조기)', 'TV 벽걸이', '커튼·블라인드', '조명'] } } },
    { field: 'items', q: '구체적인 품목과 수량을 알려주세요. (예: 55인치 TV 1대)', card: null },
    { field: 'helper', q: '기존 제품 철거·분리가 필요한가요?', card: { type: 'choices', data: { field: 'helper', options: ['필요없음', '기존 제품 철거 포함 (+20,000원)'] } } },
    { field: 'floor', q: '몇 층인가요? (대형 가전·가구인 경우)', card: { type: 'choices', data: { field: 'floor', options: ['1층', '2층', '3층', '4층', '5층 이상', '해당없음'] } } },
    { field: 'start_address', q: '설치할 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '설치 주소' } } },
    { field: 'date', q: '설치 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
  ],
  knowledge: `설치 FAQ:
- TV 벽걸이 설치 시 타공이 필요한 경우 +30,000원
- 가스·수도 연결이 필요한 경우 별도 추가 비용 발생
- 기존 제품 철거 후 폐기도 가능합니다 (폐기물 수거 서비스 연계)`,
}
