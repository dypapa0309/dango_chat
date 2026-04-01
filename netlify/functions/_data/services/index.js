export const SERVICES = {
  move: {
    key: 'move', name: '소형이사',
    steps: [
      { field: 'start_address', q: '출발지 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '출발지' } } },
      { field: 'packing', q: '이사 방식을 선택해주세요.', card: { type: 'choices', data: { field: 'packing', options: ['일반이사', '반포장이사 (+30%)', '포장이사 (+50%)'] } } },
      { field: 'floor', q: '출발지 몇 층인가요?', card: { type: 'choices', data: { field: 'floor', options: ['1층', '2층', '3층', '4층', '5층 이상'] } } },
      { field: 'elevator_start', q: '출발지에 엘리베이터가 있나요?', card: { type: 'choices', data: { field: 'elevator_start', options: ['있음', '없음'] } } },
      { field: 'end_address', q: '도착지 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '도착지' } } },
      { field: 'floor_end', q: '도착지 몇 층인가요?', card: { type: 'choices', data: { field: 'floor_end', options: ['1층', '2층', '3층', '4층', '5층 이상'] } } },
      { field: 'elevator_end', q: '도착지에 엘리베이터가 있나요?', card: { type: 'choices', data: { field: 'elevator_end', options: ['있음', '없음'] } } },
      { field: 'special_items', q: '특수 품목이 있나요? (복수 선택 가능)', card: { type: 'multi_select', data: { field: 'special_items', options: ['피아노 (+80,000원)', '금고 (+50,000원)', '에어컨 분리·설치 (+50,000원)', '없음'] } } },
      { field: 'category', q: '차량 종류를 선택해주세요.', card: { type: 'choices', data: { field: 'category', options: ['1톤 카고 (오픈형, 일반 이사짐)', '1톤 탑차 (박스형, 비·먼지 차단)'] } } },
      { field: 'helper', q: '보조 인력이 필요하신가요?', card: { type: 'choices', data: { field: 'helper', options: ['없음', '+1인 추가 (+50,000원)'] } } },
      { field: 'date', q: '이사 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
    ],
    knowledge: '소형이사 FAQ:\n- 엘리베이터 없는 경우 층당 5,000원 추가 (출발·도착 각각 적용)\n- 반포장이사: 가전·가구만 포장\n- 포장이사: 전 짐 포장·해체 포함\n- 피아노·금고 등 특수 품목은 별도 요금 발생\n- 거리 기반 가격: 기본 30,000원 + km당 1,500원',
  },
  clean: {
    key: 'clean', name: '청소',
    steps: [
      { field: 'category', q: '청소 종류가 어떻게 되나요?', card: { type: 'choices', data: { field: 'category', options: ['입주청소 (공실)', '이사청소 (퇴거)', '거주청소 (짐 있음)'] } } },
      { field: 'size', q: '몇 평인가요?', card: { type: 'choices', data: { field: 'size', options: ['10평 이하', '15평', '20평', '25평', '30평', '40평', '50평 이상'] } } },
      { field: 'room_count', q: '방이 몇 개인가요?', card: { type: 'choices', data: { field: 'room_count', options: ['1개', '2개', '3개', '4개 이상'] } } },
      { field: 'bathroom_count', q: '화장실이 몇 개인가요?', card: { type: 'choices', data: { field: 'bathroom_count', options: ['1개', '2개', '3개 이상'] } } },
      { field: 'balcony_count', q: '베란다/발코니가 있나요?', card: { type: 'choices', data: { field: 'balcony_count', options: ['없음', '1개', '2개 이상'] } } },
      { field: 'condition', q: '오염 정도가 어느 정도인가요?', card: { type: 'choices', data: { field: 'condition', options: ['가벼움', '보통', '심함 (+20%)'] } } },
      { field: 'options', q: '추가 청소 항목이 있나요? (복수 선택 가능)', card: { type: 'multi_select', data: { field: 'options', options: ['냉장고 내부 (+30,000원)', '오븐/전자레인지 (+20,000원)', '새시/창문 (+30,000원)', '빌트인 후드 (+30,000원)', '욕조 때 제거 (+20,000원)', '없음'] } } },
      { field: 'start_address', q: '청소할 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '청소 주소' } } },
      { field: 'date', q: '청소 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
    ],
    knowledge: '청소 FAQ:\n- 입주청소: 공실 상태 (가격 기준 100%)\n- 이사청소: 퇴거 시 청소 (입주청소의 약 90% 수준)\n- 거주청소: 짐 있는 상태 (입주청소의 약 70% 수준, 가장 저렴)\n- 예) 20평 입주청소 200,000원이면, 거주청소는 약 140,000원\n- 화장실 2개부터 추가 요금 발생\n- 오염 심함 선택 시 +20% 추가\n- 서비스 완료 후 24시간 내 불만족 시 재청소 또는 환불 처리',
  },
  waste: {
    key: 'waste', name: '폐기물 수거',
    steps: [
      { field: 'category', q: '어떤 폐기물을 수거할까요?', card: { type: 'choices', data: { field: 'category', options: ['가구 폐기', '가전 폐기', '생활 폐기물', '철거 포함 정리'] } } },
      { field: 'items', q: '수거할 품목을 선택해주세요. (복수 선택 가능)', card: { type: 'multi_select', data: { field: 'items', options: ['냉장고 (소형)', '냉장고 (대형)', '세탁기 (통돌이)', '세탁기 (드럼)', 'TV (50인치 이하)', 'TV (50인치 이상)', '소파', '침대+매트리스', '옷장', '책상/테이블', '기타 소형'] } } },
      { field: 'size', q: '전체 규모가 어느 정도인가요?', card: { type: 'choices', data: { field: 'size', options: ['소형 (소형가구 1~2개)', '중형 (가구 3~5개)', '대형 (가구 6개 이상 또는 이삿짐 수준)'] } } },
      { field: 'floor', q: '몇 층인가요?', card: { type: 'choices', data: { field: 'floor', options: ['1층', '2층', '3층', '4층', '5층 이상'] } } },
      { field: 'elevator_start', q: '엘리베이터가 있나요?', card: { type: 'choices', data: { field: 'elevator_start', options: ['있음', '없음'] } } },
      { field: 'helper', q: '해체·분리 작업이 필요한가요?', card: { type: 'choices', data: { field: 'helper', options: ['필요없음', '해체·분리 필요 (+30,000원)'] } } },
      { field: 'start_address', q: '수거할 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '수거 주소' } } },
      { field: 'date', q: '수거 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
    ],
    knowledge: '폐기물 수거 FAQ:\n- 폐기물 스티커는 당고 전문가가 직접 처리하므로 별도 구매 불필요\n- 냉장고·세탁기·대형 가전은 추가 요금이 발생할 수 있습니다\n- 엘리베이터 없는 경우 층당 8,000원 추가',
  },
  install: {
    key: 'install', name: '설치',
    steps: [
      { field: 'category', q: '무엇을 설치할까요?', card: { type: 'choices', data: { field: 'category', options: ['에어컨 (벽걸이)', '에어컨 (스탠드)', '세탁기/건조기', 'TV 벽걸이', '가구 조립 (침대·책상·장롱)', '커튼·블라인드', '조명'] } } },
      { field: 'items_count', q: '몇 개 설치할까요?', card: { type: 'choices', data: { field: 'items_count', options: ['1개', '2개', '3개 이상'] } } },
      { field: 'helper', q: '기존 제품 철거·분리가 필요한가요?', card: { type: 'choices', data: { field: 'helper', options: ['필요없음', '기존 제품 철거 포함 (+20,000원)'] } } },
      { field: 'floor', q: '몇 층인가요?', card: { type: 'choices', data: { field: 'floor', options: ['1층', '2층', '3층', '4층', '5층 이상', '해당없음'] } } },
      { field: 'start_address', q: '설치할 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '설치 주소' } } },
      { field: 'date', q: '설치 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
    ],
    knowledge: '설치 FAQ:\n- TV 벽걸이 설치 시 타공이 필요한 경우 +30,000원\n- 가스·수도 연결이 필요한 경우 별도 추가 비용 발생\n- 기존 제품 철거 후 폐기도 가능합니다 (폐기물 수거 서비스 연계)',
  },
  errand: {
    key: 'errand', name: '심부름',
    steps: [
      { field: 'category', q: '어떤 심부름이 필요하신가요?', card: { type: 'choices', data: { field: 'category', options: ['장보기 대행', '서류·물건 전달', '픽업·수령 대행', '동행·현장 보조', '반려동물 산책', '줄서기 대행', '관공서 서류 대행'] } } },
      { field: 'size', q: '짐 크기가 어떻게 되나요?', card: { type: 'choices', data: { field: 'size', options: ['소형 (서류·소형물품)', '중형 (박스 크기)', '대형', '해당없음'] } } },
      { field: 'start_address', q: '출발 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '출발 주소' } } },
      { field: 'end_address', q: '목적지 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '목적지' } } },
      { field: 'date', q: '날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
    ],
    knowledge: '심부름 FAQ:\n- 왕복 심부름은 편도 대비 +15,000원\n- 긴급(2시간 이내) 요청은 +12,000원\n- 대기 시간 발생 시 10분당 3,000원 추가',
  },
  organize: {
    key: 'organize', name: '정리수납',
    steps: [
      { field: 'category', q: '어떤 정리수납이 필요하신가요?', card: { type: 'choices', data: { field: 'category', options: ['옷장·드레스룸', '주방', '이사 전후 정리', '집 전체'] } } },
      { field: 'qty', q: '몇 공간을 정리할까요?', card: { type: 'choices', data: { field: 'qty', options: ['1공간', '2공간', '3공간 이상'] } } },
      { field: 'duration', q: '예상 작업 시간을 선택해주세요.', card: { type: 'choices', data: { field: 'duration', options: ['2시간', '4시간', '6시간', '8시간 이상'] } } },
      { field: 'condition', q: '현재 짐 상태가 어느 정도인가요?', card: { type: 'choices', data: { field: 'condition', options: ['보통', '많음', '매우 많음'] } } },
      { field: 'helper', q: '수납용품 구매도 포함할까요?', card: { type: 'choices', data: { field: 'helper', options: ['포함 안 함', '수납용품 구매 포함 (추가 비용)'] } } },
      { field: 'start_address', q: '정리할 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '서비스 주소' } } },
      { field: 'date', q: '날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
    ],
    knowledge: '정리수납 FAQ:\n- 추가 공간은 기본가의 40% 할인 적용\n- 수납용품(바구니·옷걸이 등) 구매 대행 시 실비 + 서비스 비용 별도\n- 이사 전후 정리는 이사 당일도 가능합니다',
  },
  ac_clean: {
    key: 'ac_clean', name: '에어컨 청소',
    steps: [
      { field: 'category', q: '어떤 에어컨을 청소할까요?', card: { type: 'choices', data: { field: 'category', options: ['벽걸이 (56,000원)', '스탠드 (92,000원)', '2in1 세트 (139,000원)', '시스템에어컨 (82,000원~)'] } } },
      { field: 'qty', q: '몇 대 청소할까요?', card: { type: 'choices', data: { field: 'qty', options: ['1대', '2대', '3대', '4대 이상'] } } },
      { field: 'clean_type', q: '청소 방식을 선택해주세요.', card: { type: 'choices', data: { field: 'clean_type', options: ['기본 청소', '분해 청소 (+50%)'] } } },
      { field: 'last_clean', q: '마지막으로 청소하신 게 언제쯤인가요?', card: { type: 'choices', data: { field: 'last_clean', options: ['1년 미만', '1~2년', '2년 이상', '처음'] } } },
      { field: 'condition', q: '현재 에어컨 상태를 선택해주세요. (복수 선택 가능)', card: { type: 'multi_select', data: { field: 'condition', options: ['냄새남', '물 떨어짐', '소음 있음', '이상 없음'] } } },
      { field: 'options', q: '추가 서비스를 선택해주세요. (복수 선택 가능)', card: { type: 'multi_select', data: { field: 'options', options: ['항균/탈취 코팅 (+15,000원/대)', '필터 교체 (+10,000원/대)', '없음'] } } },
      { field: 'start_address', q: '서비스 받을 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '서비스 주소' } } },
      { field: 'date', q: '방문 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
    ],
    knowledge: '에어컨 청소 FAQ:\n- 벽걸이 기본 56,000원 / 분해청소 84,000원\n- 스탠드 기본 92,000원 / 분해청소 138,000원\n- 2in1 기본 139,000원 / 분해청소 208,500원\n- 분해청소는 기본청소 대비 50% 추가 (내부까지 완전 분해)\n- 청소 후 1주일 이내 이상 발생 시 무상 AS 제공\n- 시스템에어컨은 1way/2way/4way에 따라 82,000~150,000원',
  },
  appliance_clean: {
    key: 'appliance_clean', name: '가전 청소',
    steps: [
      { field: 'category', q: '어떤 가전을 청소할까요?', card: { type: 'choices', data: { field: 'category', options: ['세탁기 (통돌이)', '세탁기 (드럼)', '건조기', '냉장고 (일반)', '냉장고 (양문형/4도어)', '주방후드', '식기세척기', '오븐'] } } },
      { field: 'qty', q: '몇 대 청소할까요?', card: { type: 'choices', data: { field: 'qty', options: ['1대', '2대', '3대 이상'] } } },
      { field: 'last_clean', q: '마지막으로 청소하신 게 언제쯤인가요?', card: { type: 'choices', data: { field: 'last_clean', options: ['1년 미만', '1~2년', '2년 이상', '처음'] } } },
      { field: 'condition', q: '현재 이상 증상을 선택해주세요. (복수 선택 가능)', card: { type: 'multi_select', data: { field: 'condition', options: ['냄새남', '소음 있음', '성능 저하', '이상 없음'] } } },
      { field: 'start_address', q: '서비스 받을 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '서비스 주소' } } },
      { field: 'date', q: '방문 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
    ],
    knowledge: '가전 청소 FAQ:\n- 드럼세탁기는 통돌이보다 청소 시간이 더 걸려 가격이 높습니다\n- 냉장고 양문형/4도어는 일반형보다 추가 요금 발생\n- 청소 후 냄새·소음이 지속되면 24시간 내 재방문 AS 가능합니다',
  },
  golf: {
    key: 'golf', name: '골프 레슨',
    steps: [
      { field: 'category', q: '어떤 골프 레슨을 받고 싶으신가요?', card: { type: 'choices', data: { field: 'category', options: ['입문 (기본 자세)', '필드 레슨', '숏게임 교정 (퍼팅·어프로치)', '스윙·비거리 교정'] } } },
      { field: 'class_type', q: '수업 형태를 선택해주세요.', card: { type: 'choices', data: { field: 'class_type', options: ['1:1 개인레슨', '1:2 세미개인 (-15%)', '그룹 3~5인 (-30%)'] } } },
      { field: 'level', q: '현재 골프 경력이 어느 정도인가요?', card: { type: 'choices', data: { field: 'level', options: ['입문자 (처음)', '초급 (1~2년)', '중급 (3년 이상)'] } } },
      { field: 'duration', q: '레슨 시간을 선택해주세요.', card: { type: 'choices', data: { field: 'duration', options: ['30분', '1시간', '1시간 30분', '2시간'] } } },
      { field: 'location_type', q: '어떤 장소에서 레슨받고 싶으신가요?', card: { type: 'choices', data: { field: 'location_type', options: ['실내 연습장', '스크린 골프', '야외 필드'] } } },
      { field: 'start_address', q: '희망 지역이나 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '레슨 장소' } } },
      { field: 'date', q: '레슨 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
    ],
    knowledge: '골프 레슨 FAQ:\n- 1시간 기준 입문 70,000원, 필드레슨 120,000원, 숏게임·스윙교정 85,000원\n- 그룹 레슨은 인원에 따라 할인 적용\n- 장소(연습장) 대여비는 별도입니다',
  },
  pt: {
    key: 'pt', name: 'PT',
    steps: [
      { field: 'category', q: '어떤 PT를 받고 싶으신가요?', card: { type: 'choices', data: { field: 'category', options: ['체중감량 다이어트 PT', '근력강화', '체형교정', '재활운동'] } } },
      { field: 'level', q: '현재 운동 경력이 어느 정도인가요?', card: { type: 'choices', data: { field: 'level', options: ['없음 (처음)', '6개월 미만', '1년 이상'] } } },
      { field: 'goal', q: '주요 목표를 선택해주세요.', card: { type: 'choices', data: { field: 'goal', options: ['체중 감량', '근육 증가', '체형 교정', '부상 회복', '스포츠 퍼포먼스'] } } },
      { field: 'duration', q: 'PT 시간을 선택해주세요.', card: { type: 'choices', data: { field: 'duration', options: ['40분', '1시간', '1시간 30분'] } } },
      { field: 'location_type', q: '어디서 PT를 받고 싶으신가요?', card: { type: 'choices', data: { field: 'location_type', options: ['헬스장', '홈트레이닝 (방문)', '공원·야외'] } } },
      { field: 'start_address', q: '희망 지역이나 주소를 알려주세요.', card: { type: 'address_picker', data: { label: 'PT 장소' } } },
      { field: 'date', q: 'PT 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
    ],
    knowledge: 'PT FAQ:\n- 1시간 기준 개인PT 70,000원, 다이어트PT 78,000원, 근력·체형교정 82,000원\n- 홈트레이닝의 경우 트레이너가 직접 방문합니다\n- 부상 이력이 있으시면 예약 시 미리 알려주세요',
  },
  vocal: {
    key: 'vocal', name: '보컬 레슨',
    steps: [
      { field: 'category', q: '어떤 보컬 레슨을 받고 싶으신가요?', card: { type: 'choices', data: { field: 'category', options: ['취미 보컬', '오디션·입시', '축가·행사', '녹음·디렉팅'] } } },
      { field: 'genre', q: '희망 장르를 선택해주세요.', card: { type: 'choices', data: { field: 'genre', options: ['팝/가요', '뮤지컬', 'CCM', '재즈', '클래식', '랩/힙합'] } } },
      { field: 'level', q: '현재 경력이 어느 정도인가요?', card: { type: 'choices', data: { field: 'level', options: ['처음', '1년 미만', '1년 이상'] } } },
      { field: 'duration', q: '레슨 시간을 선택해주세요.', card: { type: 'choices', data: { field: 'duration', options: ['30분', '1시간', '1시간 30분', '2시간'] } } },
      { field: 'start_address', q: '희망 지역이나 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '레슨 장소' } } },
      { field: 'date', q: '레슨 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
    ],
    knowledge: '보컬 레슨 FAQ:\n- 1시간 기준: 취미보컬 60,000원, 오디션·입시 85,000원, 축가·행사 70,000원, 녹음·디렉팅 75,000원\n- 축가 레슨은 보통 1~2회 집중 레슨으로 진행됩니다',
  },
  tutor: {
    key: 'tutor', name: '과외',
    steps: [
      { field: 'category', q: '어떤 과외가 필요하신가요?', card: { type: 'choices', data: { field: 'category', options: ['영어', '수학 (초중고 교과)', '입시·시험대비', '성인 취미·자격증'] } } },
      { field: 'level', q: '학년이나 수준을 알려주세요.', card: { type: 'choices', data: { field: 'level', options: ['초등', '중등', '고등', '수능/N수', '성인'] } } },
      { field: 'tutor_type', q: '선생님 유형을 선택해주세요.', card: { type: 'choices', data: { field: 'tutor_type', options: ['대학생 튜터', '전문 강사 (+30%)'] } } },
      { field: 'duration', q: '수업 시간을 선택해주세요.', card: { type: 'choices', data: { field: 'duration', options: ['1시간', '1시간 30분', '2시간'] } } },
      { field: 'location_type', q: '수업 방식을 선택해주세요.', card: { type: 'choices', data: { field: 'location_type', options: ['방문 수업 (선생님이 방문)', '학생 자택', '화상 수업 (-20%)'] } } },
      { field: 'start_address', q: '수업 장소 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '수업 장소' } } },
      { field: 'date', q: '수업 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
    ],
    knowledge: '과외 FAQ:\n- 1시간 기준: 영어 65,000원, 수학 60,000원, 입시·시험대비 80,000원, 성인취미·자격 70,000원\n- 전문 강사는 대학생 튜터 대비 30% 추가\n- 화상 수업은 대면 대비 20% 할인\n- 과목·목표는 첫 수업 시 상세 조율 가능합니다',
  },
  counseling: {
    key: 'counseling', name: '심리상담',
    steps: [
      { field: 'category', q: '어떤 상담이 필요하신가요?', card: { type: 'choices', data: { field: 'category', options: ['개인상담', '커플·부부상담', '가족상담', '청소년상담'] } } },
      { field: 'topic', q: '주요 상담 주제를 선택해주세요.', card: { type: 'choices', data: { field: 'topic', options: ['우울/불안', '대인관계', '연애·결혼', '직장·진로', '가족관계', '트라우마·스트레스', '자존감', '기타'] } } },
      { field: 'level', q: '이전에 상담 경험이 있으신가요?', card: { type: 'choices', data: { field: 'level', options: ['처음', '경험 있음'] } } },
      { field: 'location_type', q: '상담 방식을 선택해주세요.', card: { type: 'choices', data: { field: 'location_type', options: ['대면 상담', '온라인 (화상) 상담'] } } },
      { field: 'duration', q: '상담 시간을 선택해주세요.', card: { type: 'choices', data: { field: 'duration', options: ['50분', '1시간 30분', '2시간'] } } },
      { field: 'start_address', q: '상담 장소 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '상담 장소' } } },
      { field: 'date', q: '상담 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
    ],
    knowledge: '심리상담 FAQ:\n- 1시간 기준: 개인상담 80,000원, 커플·부부 100,000원, 가족상담 110,000원\n- 온라인 상담은 Zoom/Google Meet으로 진행됩니다\n- 상담 내용은 철저히 비밀이 보장됩니다',
  },
  interior: {
    key: 'interior', name: '인테리어',
    steps: [
      { field: 'category', q: '어떤 인테리어 작업이 필요하신가요?', card: { type: 'choices', data: { field: 'category', options: ['도배', '장판', '도배+장판', '욕실 리모델링', '부분 인테리어', '상담·실측'] } } },
      { field: 'material_grade', q: '자재 등급을 선택해주세요.', card: { type: 'choices', data: { field: 'material_grade', options: ['일반 (합지/PVC 장판)', '고급 (실크/강화마루 +80%)'] } } },
      { field: 'qty', q: '작업할 공간이 몇 개인가요?', card: { type: 'choices', data: { field: 'qty', options: ['1공간', '2공간', '3공간 이상'] } } },
      { field: 'size', q: '전체 평수가 어떻게 되나요?', card: { type: 'choices', data: { field: 'size', options: ['10평 이하', '15평', '20평', '25평', '30평', '40평', '50평 이상'] } } },
      { field: 'start_address', q: '시공할 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '시공 주소' } } },
      { field: 'date', q: '시공 희망 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
    ],
    knowledge: '인테리어 FAQ:\n- 도배: 합지 30~50만원/20평, 실크 60~120만원/20평\n- 장판: PVC 30~60만원/20평, 강화마루 80~180만원/20평\n- 상담·실측은 70,000원이며, 시공 계약 시 차감됩니다\n- 대규모 공사는 실측 후 정확한 견적 안내 드립니다',
  },
  interior_help: {
    key: 'interior_help', name: '인테리어 보조',
    steps: [
      { field: 'category', q: '어떤 보조 작업이 필요하신가요?', card: { type: 'choices', data: { field: 'category', options: ['자재 운반', '가구·집기 이동', '철거 후 정리', '하루 현장 보조'] } } },
      { field: 'qty', q: '작업 건수가 어떻게 되나요?', card: { type: 'choices', data: { field: 'qty', options: ['1건', '2건', '3건 이상'] } } },
      { field: 'start_address', q: '현장 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '현장 주소' } } },
      { field: 'date', q: '작업 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
    ],
    knowledge: '인테리어 보조 FAQ:\n- 자재운반 100,000원~, 가구·집기이동 90,000원~, 철거후정리 110,000원~, 하루현장보조 130,000원~\n- 무거운 자재나 대형 가구 이동 시 2인 이상 투입 가능합니다',
  },
  marketing: {
    key: 'marketing', name: '마케팅',
    steps: [
      { field: 'channel', q: '어떤 채널 마케팅이 필요하신가요?', card: { type: 'choices', data: { field: 'channel', options: ['인스타그램', '블로그 (네이버)', '유튜브', '틱톡', '카카오 채널', '전체 채널 통합 관리'] } } },
      { field: 'category', q: '어떤 마케팅 서비스가 필요하신가요?', card: { type: 'choices', data: { field: 'category', options: ['계정 운영 대행', '콘텐츠 제작', '광고 운영 대행', 'SEO 최적화', '영상 제작·편집', '사진 촬영·보정'] } } },
      { field: 'goal', q: '마케팅 목표가 무엇인가요?', card: { type: 'choices', data: { field: 'goal', options: ['브랜드 인지도', '매출 증대', '팔로워 증가', '검색 노출'] } } },
      { field: 'qty', q: '월 게시 횟수 또는 제작 건수를 선택해주세요.', card: { type: 'choices', data: { field: 'qty', options: ['월 4회', '월 8회', '월 12회', '월 20회 이상'] } } },
      { field: 'date', q: '시작 희망 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
    ],
    knowledge: '마케팅 FAQ:\n- SNS관리 150,000원~/월, 블로그포스팅 60,000원~/건, 영상제작 250,000원~/건\n- 계약 전 포트폴리오 확인 가능합니다\n- 월 단위 계약은 장기 할인이 적용될 수 있습니다',
  },
  yongdal: {
    key: 'yongdal', name: '용달',
    steps: [
      { field: 'start_address', q: '출발지 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '출발지' } } },
      { field: 'vehicle_size', q: '차량 크기를 선택해주세요.', card: { type: 'choices', data: { field: 'vehicle_size', options: ['다마스 0.5톤 (소형 짐·박스)', '1톤 트럭 (일반)', '1.4톤 (중형 이상)', '2.5톤 (대형·가전·가구)'] } } },
      { field: 'floor', q: '출발지 몇 층인가요?', card: { type: 'choices', data: { field: 'floor', options: ['1층', '2층', '3층', '4층', '5층 이상'] } } },
      { field: 'elevator_start', q: '출발지에 엘리베이터가 있나요?', card: { type: 'choices', data: { field: 'elevator_start', options: ['있음', '없음'] } } },
      { field: 'end_address', q: '도착지 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '도착지' } } },
      { field: 'floor_end', q: '도착지 몇 층인가요?', card: { type: 'choices', data: { field: 'floor_end', options: ['1층', '2층', '3층', '4층', '5층 이상'] } } },
      { field: 'elevator_end', q: '도착지에 엘리베이터가 있나요?', card: { type: 'choices', data: { field: 'elevator_end', options: ['있음', '없음'] } } },
      { field: 'items', q: '주요 품목을 선택해주세요. (복수 선택 가능)', card: { type: 'multi_select', data: { field: 'items', options: ['소형가전/박스', '자전거/킥보드', '냉장고', '세탁기', '소파', '침대', '책상/테이블', '옷장', '기타 대형'] } } },
      { field: 'helper', q: '기사 도움이 필요하신가요?', card: { type: 'choices', data: { field: 'helper', options: ['없음 (기사 운전만)', '출발지 도움 (+10,000원)', '도착지 도움 (+10,000원)', '동승 (+20,000원)'] } } },
      { field: 'date', q: '날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
    ],
    knowledge: '용달 FAQ:\n- 다마스(0.5톤): 소형 짐, 박스 이동에 적합\n- 기본 파손 보상 최대 30만원 포함, 고가품은 사전에 알려주세요\n- 엘리베이터 없는 경우 층당 5,000원 추가\n- 거리 기반 가격: 기본 30,000원 + km당 1,500원',
  },
}

export const SERVICE_SUMMARY = `## 제공 서비스
- move (소형이사): 원룸·오피스텔 이사
- clean (청소): 입주청소·이사청소·가정청소
- waste (폐기물 수거): 가구·가전 폐기
- install (설치): 가구·가전·TV·조명 설치
- errand (심부름): 배달·장보기·픽업
- organize (정리수납): 옷장·주방 정리
- ac_clean (에어컨 청소): 벽걸이·스탠드·시스템
- appliance_clean (가전 청소): 세탁기·냉장고·건조기
- golf (골프 레슨): 스윙·숏게임 교정
- pt (PT): 개인 트레이닝
- vocal (보컬 레슨): 취미·오디션·축가·녹음
- tutor (과외): 영어·수학·입시 1:1 과외
- counseling (심리상담): 개인·커플·가족 상담
- interior (인테리어): 도배·장판·부분 공사
- interior_help (인테리어 보조): 자재 운반·현장 보조
- marketing (마케팅): SNS·광고·콘텐츠 제작
- yongdal (용달): 짐 운반·이삿짐 운반`
