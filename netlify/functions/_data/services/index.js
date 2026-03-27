export const SERVICES = {
  move: {
    key: 'move', name: '소형이사',
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
    knowledge: '소형이사 FAQ:\n- 엘리베이터 없는 경우 층당 5,000원 추가 (출발·도착 각각 적용)\n- 보조 인력 1인 추가 시 +50,000원\n- 1톤 탑차는 비·먼지 차단이 필요한 정밀 기기·가전에 권장\n- 거리 기반 가격: 기본 30,000원 + km당 1,500원',
  },
  clean: {
    key: 'clean', name: '청소',
    steps: [
      { field: 'category', q: '청소 종류가 어떻게 되나요?', card: { type: 'choices', data: { field: 'category', options: ['입주청소 (공실)', '이사청소 (퇴거)', '거주청소 (짐 있음)'] } } },
      { field: 'size', q: '몇 평인가요?', card: { type: 'choices', data: { field: 'size', options: ['10평 이하', '20평 이하', '30평', '40평', '50평 이상'] } } },
      { field: 'room_count', q: '방이 몇 개인가요?', card: { type: 'choices', data: { field: 'room_count', options: ['1개', '2개', '3개', '4개 이상'] } } },
      { field: 'condition', q: '오염 정도가 어느 정도인가요?', card: { type: 'choices', data: { field: 'condition', options: ['가벼움', '보통', '심함 (+20%)'] } } },
      { field: 'start_address', q: '청소할 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '청소 주소' } } },
      { field: 'date', q: '청소 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
    ],
    knowledge: '청소 FAQ:\n- 입주청소: 공실 상태에서 새로 입주하기 전 청소\n- 이사청소: 이사 나가면서 퇴거 시 청소\n- 거주청소: 짐이 있는 상태에서 청소 (입주청소의 약 70% 수준)\n- 서비스 완료 후 24시간 내 불만족 시 재청소 또는 환불 처리',
  },
  waste: {
    key: 'waste', name: '폐기물 수거',
    steps: [
      { field: 'category', q: '어떤 폐기물을 수거할까요?', card: { type: 'choices', data: { field: 'category', options: ['가구 폐기', '가전 폐기', '생활 폐기물', '철거 포함 정리'] } } },
      { field: 'items', q: '버릴 품목을 구체적으로 알려주세요. (예: 냉장고 1대, 소파 1개)', card: null },
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
      { field: 'category', q: '무엇을 설치할까요?', card: { type: 'choices', data: { field: 'category', options: ['가구 (침대·책상·장롱)', '가전 (세탁기·냉장고·건조기)', 'TV 벽걸이', '커튼·블라인드', '조명'] } } },
      { field: 'items', q: '구체적인 품목과 수량을 알려주세요. (예: 55인치 TV 1대)', card: null },
      { field: 'helper', q: '기존 제품 철거·분리가 필요한가요?', card: { type: 'choices', data: { field: 'helper', options: ['필요없음', '기존 제품 철거 포함 (+20,000원)'] } } },
      { field: 'floor', q: '몇 층인가요? (대형 가전·가구인 경우)', card: { type: 'choices', data: { field: 'floor', options: ['1층', '2층', '3층', '4층', '5층 이상', '해당없음'] } } },
      { field: 'start_address', q: '설치할 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '설치 주소' } } },
      { field: 'date', q: '설치 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
    ],
    knowledge: '설치 FAQ:\n- TV 벽걸이 설치 시 타공이 필요한 경우 +30,000원\n- 가스·수도 연결이 필요한 경우 별도 추가 비용 발생\n- 기존 제품 철거 후 폐기도 가능합니다 (폐기물 수거 서비스 연계)',
  },
  errand: {
    key: 'errand', name: '심부름',
    steps: [
      { field: 'category', q: '어떤 심부름이 필요하신가요?', card: { type: 'choices', data: { field: 'category', options: ['서류·물건 전달', '장보기·구매 대행', '픽업·수령 대행', '동행·현장 보조', '생활 심부름'] } } },
      { field: 'items', q: '구체적으로 어떤 내용인지 알려주세요.', card: null },
      { field: 'size', q: '짐 크기가 어떻게 되나요?', card: { type: 'choices', data: { field: 'size', options: ['소형 (서류·소형물품)', '중형 (박스 크기)', '대형'] } } },
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
      { field: 'last_clean', q: '마지막으로 청소하신 게 언제쯤인가요?', card: { type: 'choices', data: { field: 'last_clean', options: ['1년 미만', '1~2년', '2년 이상', '처음'] } } },
      { field: 'condition', q: '현재 에어컨 상태가 어떤가요?', card: { type: 'choices', data: { field: 'condition', options: ['냄새남', '물 떨어짐', '소음 있음', '이상 없음'] } } },
      { field: 'start_address', q: '서비스 받을 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '서비스 주소' } } },
      { field: 'date', q: '방문 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
    ],
    knowledge: '에어컨 청소 FAQ:\n- 청소 후 1주일 이내 이상 발생 시 무상 AS 제공\n- 시스템에어컨은 1way/2way/4way에 따라 가격이 달라집니다 (82,000~150,000원)\n- 냄새·물 떨어짐·소음은 청소로 대부분 해결됩니다',
  },
  appliance_clean: {
    key: 'appliance_clean', name: '가전 청소',
    steps: [
      { field: 'category', q: '어떤 가전을 청소할까요?', card: { type: 'choices', data: { field: 'category', options: ['세탁기 (통돌이)', '세탁기 (드럼)', '건조기', '냉장고 (양문형)', '냉장고 (일반)', '주방후드', '식기세척기'] } } },
      { field: 'qty', q: '몇 대 청소할까요?', card: { type: 'choices', data: { field: 'qty', options: ['1대', '2대', '3대 이상'] } } },
      { field: 'last_clean', q: '마지막으로 청소하신 게 언제쯤인가요?', card: { type: 'choices', data: { field: 'last_clean', options: ['1년 미만', '1~2년', '2년 이상', '처음'] } } },
      { field: 'condition', q: '현재 이상 증상이 있나요?', card: { type: 'choices', data: { field: 'condition', options: ['냄새남', '소음 있음', '성능 저하', '이상 없음'] } } },
      { field: 'start_address', q: '서비스 받을 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '서비스 주소' } } },
      { field: 'date', q: '방문 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
    ],
    knowledge: '가전 청소 FAQ:\n- 드럼세탁기는 통돌이보다 청소 시간이 더 걸려 가격이 높습니다\n- 청소 후 냄새·소음이 지속되면 24시간 내 재방문 AS 가능합니다',
  },
  golf: {
    key: 'golf', name: '골프 레슨',
    steps: [
      { field: 'category', q: '어떤 골프 레슨을 받고 싶으신가요?', card: { type: 'choices', data: { field: 'category', options: ['입문 (기본 자세)', '필드 레슨', '숏게임 교정 (퍼팅·어프로치)', '스윙·비거리 교정'] } } },
      { field: 'level', q: '현재 골프 경력이 어느 정도인가요?', card: { type: 'choices', data: { field: 'level', options: ['입문자 (처음)', '초급 (1~2년)', '중급 (3년 이상)'] } } },
      { field: 'duration', q: '레슨 시간을 선택해주세요.', card: { type: 'choices', data: { field: 'duration', options: ['30분', '1시간', '1시간 30분', '2시간'] } } },
      { field: 'location_type', q: '어떤 장소에서 레슨받고 싶으신가요?', card: { type: 'choices', data: { field: 'location_type', options: ['실내 연습장', '스크린 골프', '야외 필드'] } } },
      { field: 'start_address', q: '희망 지역이나 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '레슨 장소' } } },
      { field: 'date', q: '레슨 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
    ],
    knowledge: '골프 레슨 FAQ:\n- 1시간 기준 입문 70,000원, 필드레슨 120,000원, 숏게임·스윙교정 85,000원\n- 30분 레슨은 1시간의 60% 요금 적용\n- 장소(연습장) 대여비는 별도입니다',
  },
  pt: {
    key: 'pt', name: 'PT',
    steps: [
      { field: 'category', q: '어떤 PT를 받고 싶으신가요?', card: { type: 'choices', data: { field: 'category', options: ['체중감량 다이어트 PT', '근력강화', '체형교정', '재활운동'] } } },
      { field: 'level', q: '현재 운동 경력이 어느 정도인가요?', card: { type: 'choices', data: { field: 'level', options: ['없음 (처음)', '6개월 미만', '1년 이상'] } } },
      { field: 'goal', q: '구체적인 목표가 있으신가요? (예: 체중 -5kg, 어깨 교정)', card: null },
      { field: 'duration', q: 'PT 시간을 선택해주세요.', card: { type: 'choices', data: { field: 'duration', options: ['30분', '1시간', '1시간 30분'] } } },
      { field: 'location_type', q: '어디서 PT를 받고 싶으신가요?', card: { type: 'choices', data: { field: 'location_type', options: ['헬스장', '홈트레이닝', '공원·야외'] } } },
      { field: 'start_address', q: '희망 지역이나 주소를 알려주세요.', card: { type: 'address_picker', data: { label: 'PT 장소' } } },
      { field: 'date', q: 'PT 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
    ],
    knowledge: 'PT FAQ:\n- 1시간 기준 개인PT 70,000원, 다이어트PT 78,000원, 근력·체형교정 82,000원\n- 홈트레이닝의 경우 트레이너가 직접 방문합니다\n- 부상 이력이 있으시면 예약 시 미리 알려주세요',
  },
  vocal: {
    key: 'vocal', name: '보컬 레슨',
    steps: [
      { field: 'category', q: '어떤 보컬 레슨을 받고 싶으신가요?', card: { type: 'choices', data: { field: 'category', options: ['취미 보컬', '오디션·입시', '축가·행사', '녹음·디렉팅'] } } },
      { field: 'level', q: '현재 경력이 어느 정도인가요?', card: { type: 'choices', data: { field: 'level', options: ['처음', '1년 미만', '1년 이상'] } } },
      { field: 'duration', q: '레슨 시간을 선택해주세요.', card: { type: 'choices', data: { field: 'duration', options: ['30분', '1시간', '1시간 30분', '2시간'] } } },
      { field: 'goal', q: '희망 장르나 목표를 간단히 알려주세요. (예: 발라드, 고음 강화)', card: null },
      { field: 'start_address', q: '희망 지역이나 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '레슨 장소' } } },
      { field: 'date', q: '레슨 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
    ],
    knowledge: '보컬 레슨 FAQ:\n- 1시간 기준: 취미보컬 60,000원, 오디션·입시 85,000원, 축가·행사 70,000원, 녹음·디렉팅 75,000원\n- 축가 레슨은 보통 1~2회 집중 레슨으로 진행됩니다',
  },
  tutor: {
    key: 'tutor', name: '과외',
    steps: [
      { field: 'category', q: '어떤 과외가 필요하신가요?', card: { type: 'choices', data: { field: 'category', options: ['영어', '수학 (초중고 교과)', '입시·시험대비', '성인 취미·자격증'] } } },
      { field: 'level', q: '학년이나 수준을 알려주세요.', card: { type: 'choices', data: { field: 'level', options: ['초등', '중등', '고등', '성인'] } } },
      { field: 'duration', q: '수업 시간을 선택해주세요.', card: { type: 'choices', data: { field: 'duration', options: ['30분', '1시간', '1시간 30분', '2시간'] } } },
      { field: 'location_type', q: '수업 방식을 선택해주세요.', card: { type: 'choices', data: { field: 'location_type', options: ['방문 수업 (선생님이 방문)', '학생 자택', '카페·스터디카페'] } } },
      { field: 'start_address', q: '수업 장소 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '수업 장소' } } },
      { field: 'date', q: '수업 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
    ],
    knowledge: '과외 FAQ:\n- 1시간 기준: 영어 65,000원, 수학 60,000원, 입시·시험대비 80,000원, 성인취미·자격 70,000원\n- 과목·목표는 첫 수업 시 상세 조율 가능합니다',
  },
  counseling: {
    key: 'counseling', name: '심리상담',
    steps: [
      { field: 'category', q: '어떤 상담이 필요하신가요?', card: { type: 'choices', data: { field: 'category', options: ['개인상담', '커플·부부상담', '가족상담', '청소년상담'] } } },
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
      { field: 'category', q: '어떤 인테리어 작업이 필요하신가요?', card: { type: 'choices', data: { field: 'category', options: ['부분 인테리어', '도배·장판', '집수리·보수', '상담·실측'] } } },
      { field: 'qty', q: '작업할 공간이 몇 개인가요?', card: { type: 'choices', data: { field: 'qty', options: ['1공간', '2공간', '3공간 이상'] } } },
      { field: 'size', q: '전체 평수가 어떻게 되나요?', card: { type: 'choices', data: { field: 'size', options: ['10평 이하', '20평 이하', '30평', '40평', '50평 이상'] } } },
      { field: 'items', q: '희망 마감재나 요청사항을 알려주세요. (없으면 "없음" 입력)', card: null },
      { field: 'start_address', q: '시공할 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '시공 주소' } } },
      { field: 'date', q: '시공 희망 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
    ],
    knowledge: '인테리어 FAQ:\n- 공간당 기준: 부분인테리어 180,000원~, 도배·장판 160,000원~, 집수리·보수 150,000원~\n- 상담·실측은 70,000원이며, 시공 계약 시 견적 비용이 차감됩니다\n- 대규모 공사는 실측 후 정확한 견적 안내 드립니다',
  },
  interior_help: {
    key: 'interior_help', name: '인테리어 보조',
    steps: [
      { field: 'category', q: '어떤 보조 작업이 필요하신가요?', card: { type: 'choices', data: { field: 'category', options: ['자재 운반', '가구·집기 이동', '철거 후 정리', '하루 현장 보조'] } } },
      { field: 'qty', q: '작업 건수가 어떻게 되나요?', card: { type: 'choices', data: { field: 'qty', options: ['1건', '2건', '3건 이상'] } } },
      { field: 'items', q: '현장 조건을 알려주세요. (층수, 엘베 여부, 주차 등)', card: null },
      { field: 'start_address', q: '현장 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '현장 주소' } } },
      { field: 'date', q: '작업 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
    ],
    knowledge: '인테리어 보조 FAQ:\n- 자재운반 100,000원~, 가구·집기이동 90,000원~, 철거후정리 110,000원~, 하루현장보조 130,000원~\n- 무거운 자재나 대형 가구 이동 시 2인 이상 투입 가능합니다',
  },
  marketing: {
    key: 'marketing', name: '마케팅',
    steps: [
      { field: 'category', q: '어떤 마케팅 서비스가 필요하신가요?', card: { type: 'choices', data: { field: 'category', options: ['SNS 관리·운영', '블로그 포스팅', '광고 대행', '콘텐츠 제작', '영상 제작·편집', '사진 촬영·보정', '카피라이팅', 'SEO', '브랜딩·로고', '이메일·문자 마케팅'] } } },
      { field: 'items', q: '업종과 업체를 간단히 소개해주세요. (예: 서울 강남 카페)', card: null },
      { field: 'goal', q: '마케팅 목표가 무엇인가요?', card: { type: 'choices', data: { field: 'goal', options: ['브랜드 인지도', '매출 증대', '팔로워 증가', '기타'] } } },
      { field: 'qty', q: '건수나 기간을 알려주세요. (예: 월 4회, 3개월)', card: null },
      { field: 'date', q: '시작 희망 날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
    ],
    knowledge: '마케팅 FAQ:\n- SNS관리 150,000원~/월, 블로그포스팅 60,000원~/건, 영상제작 250,000원~/건\n- 계약 전 포트폴리오 확인 가능합니다\n- 월 단위 계약은 장기 할인이 적용될 수 있습니다',
  },
  yongdal: {
    key: 'yongdal', name: '용달',
    steps: [
      { field: 'start_address', q: '출발지 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '출발지' } } },
      { field: 'floor', q: '출발지 몇 층인가요?', card: { type: 'choices', data: { field: 'floor', options: ['1층', '2층', '3층', '4층', '5층 이상'] } } },
      { field: 'elevator_start', q: '출발지에 엘리베이터가 있나요?', card: { type: 'choices', data: { field: 'elevator_start', options: ['있음', '없음'] } } },
      { field: 'end_address', q: '도착지 주소를 알려주세요.', card: { type: 'address_picker', data: { label: '도착지' } } },
      { field: 'floor_end', q: '도착지 몇 층인가요?', card: { type: 'choices', data: { field: 'floor_end', options: ['1층', '2층', '3층', '4층', '5층 이상'] } } },
      { field: 'elevator_end', q: '도착지에 엘리베이터가 있나요?', card: { type: 'choices', data: { field: 'elevator_end', options: ['있음', '없음'] } } },
      { field: 'size', q: '짐 규모가 어느 정도인가요?', card: { type: 'choices', data: { field: 'size', options: ['소형 (가방·모니터·소형가전, 30,000원~)', '중형 (책상·행거·자전거, 60,000원~)', '대형 (냉장고·침대·소파, 80,000원~)'] } } },
      { field: 'items', q: '구체적인 품목 목록을 알려주세요.', card: null },
      { field: 'helper', q: '기사 도움이 필요하신가요?', card: { type: 'choices', data: { field: 'helper', options: ['없음 (기사 운전만)', '출발지 도움 (+10,000원)', '도착지 도움 (+10,000원)', '동승 (+20,000원)'] } } },
      { field: 'date', q: '날짜를 선택해주세요.', card: { type: 'date_picker', data: {} } },
    ],
    knowledge: '용달 FAQ:\n- 기본 파손 보상 최대 30만원 포함, 고가품은 사전에 알려주세요\n- 엘리베이터 없는 경우 층당 5,000원 추가\n- 거리 기반 가격: 소형 30,000원~, 중형 60,000원~, 대형 80,000원~',
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
