(function () {
  const SERVICE = document.body?.dataset.defaultService || "waste";

  const CONFIG = {
    waste: {
      label: "폐기물",
      cheer: {
        1: "좋아요. 이제 하나씩 넣으면 돼요. 먼저 어떤 폐기물 접수인지 골라주세요.",
        2: "좋아요. 이제 하나씩 넣으면 돼요. 수거 주소와 날짜를 먼저 정리하면 됩니다.",
        3: "좋아요. 이제 하나씩 넣으면 돼요. 버릴 품목과 양을 실제에 가깝게 넣어주세요.",
        4: "좋아요. 이제 하나씩 넣으면 돼요. 층수와 철거, 추가 장비 여부를 정리하면 됩니다.",
        5: "좋아요. 이제 거의 끝났어요. 금액과 접수 내용을 확인하면 됩니다."
      }
    },
    install: {
      label: "설치",
      cheer: {
        1: "좋아요. 이제 하나씩 넣으면 돼요. 어떤 설치인지 먼저 골라주세요.",
        2: "좋아요. 이제 하나씩 넣으면 돼요. 설치 주소와 날짜를 정리하면 됩니다.",
        3: "좋아요. 이제 하나씩 넣으면 돼요. 품목 수량과 모델명을 넣어주세요.",
        4: "좋아요. 이제 하나씩 넣으면 돼요. 타공이나 연결 작업, 추가 요청을 확인하면 됩니다.",
        5: "좋아요. 이제 거의 끝났어요. 금액과 진행 방식을 확인하면 됩니다."
      }
    },
    errand: {
      label: "심부름",
      cheer: {
        1: "좋아요. 이제 하나씩 넣으면 돼요. 어떤 심부름인지 먼저 골라주세요.",
        2: "좋아요. 이제 하나씩 넣으면 돼요. 필요한 주소와 날짜를 정리하면 됩니다.",
        3: "좋아요. 이제 하나씩 넣으면 돼요. 물건 크기와 건수를 실제에 가깝게 넣어주세요.",
        4: "좋아요. 이제 하나씩 넣으면 돼요. 대기 시간이나 추가 요청을 정리하면 됩니다.",
        5: "좋아요. 이제 거의 끝났어요. 금액과 접수 내용을 확인하면 됩니다."
      }
    },
    organize: {
      label: "정리수납",
      cheer: {
        1: "좋아요. 이제 하나씩 넣으면 돼요. 어떤 정리수납인지 먼저 골라주세요.",
        2: "좋아요. 이제 하나씩 넣으면 돼요. 방문 주소와 날짜를 정리하면 됩니다.",
        3: "좋아요. 이제 하나씩 넣으면 돼요. 범위와 건수를 실제에 맞게 넣어주세요.",
        4: "좋아요. 이제 하나씩 넣으면 돼요. 추가 요청과 방문 조건을 정리하면 됩니다.",
        5: "좋아요. 이제 거의 끝났어요. 금액과 접수 내용을 확인하면 됩니다."
      }
    },
    ac_clean: {
      label: "에어컨청소",
      cheer: {
        1: "좋아요. 이제 하나씩 넣으면 돼요. 어떤 에어컨 청소인지 먼저 골라주세요.",
        2: "좋아요. 이제 하나씩 넣으면 돼요. 방문 주소와 날짜를 정리하면 됩니다.",
        3: "좋아요. 이제 하나씩 넣으면 돼요. 대수와 모델 정보를 넣어주세요.",
        4: "좋아요. 이제 하나씩 넣으면 돼요. 분해 세척과 추가 요청을 정리하면 됩니다.",
        5: "좋아요. 이제 거의 끝났어요. 금액과 접수 내용을 확인하면 됩니다."
      }
    },
    appliance_clean: {
      label: "가전청소",
      cheer: {
        1: "좋아요. 이제 하나씩 넣으면 돼요. 어떤 가전 청소인지 먼저 골라주세요.",
        2: "좋아요. 이제 하나씩 넣으면 돼요. 방문 주소와 날짜를 정리하면 됩니다.",
        3: "좋아요. 이제 하나씩 넣으면 돼요. 대수와 모델 정보를 넣어주세요.",
        4: "좋아요. 이제 하나씩 넣으면 돼요. 분해 세척과 추가 요청을 정리하면 됩니다.",
        5: "좋아요. 이제 거의 끝났어요. 금액과 접수 내용을 확인하면 됩니다."
      }
    },
    interior: {
      label: "인테리어",
      cheer: {
        1: "좋아요. 이제 하나씩 넣으면 돼요. 어떤 인테리어인지 먼저 골라주세요.",
        2: "좋아요. 이제 하나씩 넣으면 돼요. 현장 주소와 날짜를 정리하면 됩니다.",
        3: "좋아요. 이제 하나씩 넣으면 돼요. 공사 범위와 건수를 넣어주세요.",
        4: "좋아요. 이제 하나씩 넣으면 돼요. 실측이나 추가 요청을 정리하면 됩니다.",
        5: "좋아요. 이제 거의 끝났어요. 금액과 접수 내용을 확인하면 됩니다."
      }
    },
    interior_help: {
      label: "인테리어 보조",
      cheer: {
        1: "좋아요. 이제 하나씩 넣으면 돼요. 어떤 보조 작업인지 먼저 골라주세요.",
        2: "좋아요. 이제 하나씩 넣으면 돼요. 현장 주소와 날짜를 정리하면 됩니다.",
        3: "좋아요. 이제 하나씩 넣으면 돼요. 필요한 건수와 범위를 넣어주세요.",
        4: "좋아요. 이제 하나씩 넣으면 돼요. 자재 이동이나 추가 요청을 정리하면 됩니다.",
        5: "좋아요. 이제 거의 끝났어요. 금액과 접수 내용을 확인하면 됩니다."
      }
    },
    pt: {
      label: "PT",
      cheer: {
        1: "좋아요. 이제 하나씩 넣으면 돼요. 어떤 PT인지 먼저 골라주세요.",
        2: "좋아요. 이제 하나씩 넣으면 돼요. 수업 지역과 날짜를 정리하면 됩니다.",
        3: "좋아요. 이제 하나씩 넣으면 돼요. 횟수와 방향을 넣어주세요.",
        4: "좋아요. 이제 하나씩 넣으면 돼요. 방문 수업이나 추가 요청을 정리하면 됩니다.",
        5: "좋아요. 이제 거의 끝났어요. 금액과 접수 내용을 확인하면 됩니다."
      }
    },
    vocal: {
      label: "보컬",
      cheer: {
        1: "좋아요. 이제 하나씩 넣으면 돼요. 어떤 보컬 수업인지 먼저 골라주세요.",
        2: "좋아요. 이제 하나씩 넣으면 돼요. 수업 지역과 날짜를 정리하면 됩니다.",
        3: "좋아요. 이제 하나씩 넣으면 돼요. 횟수와 방향을 넣어주세요.",
        4: "좋아요. 이제 하나씩 넣으면 돼요. 방문 수업이나 추가 요청을 정리하면 됩니다.",
        5: "좋아요. 이제 거의 끝났어요. 금액과 접수 내용을 확인하면 됩니다."
      }
    },
    golf: {
      label: "골프",
      cheer: {
        1: "좋아요. 이제 하나씩 넣으면 돼요. 어떤 골프 레슨인지 먼저 골라주세요.",
        2: "좋아요. 이제 하나씩 넣으면 돼요. 수업 지역과 날짜를 정리하면 됩니다.",
        3: "좋아요. 이제 하나씩 넣으면 돼요. 횟수와 방향을 넣어주세요.",
        4: "좋아요. 이제 하나씩 넣으면 돼요. 방문 수업이나 추가 요청을 정리하면 됩니다.",
        5: "좋아요. 이제 거의 끝났어요. 금액과 접수 내용을 확인하면 됩니다."
      }
    },
    tutor: {
      label: "과외",
      cheer: {
        1: "좋아요. 이제 하나씩 넣으면 돼요. 어떤 과외인지 먼저 골라주세요.",
        2: "좋아요. 이제 하나씩 넣으면 돼요. 수업 지역과 날짜를 정리하면 됩니다.",
        3: "좋아요. 이제 하나씩 넣으면 돼요. 횟수와 방향을 넣어주세요.",
        4: "좋아요. 이제 하나씩 넣으면 돼요. 방문 수업이나 추가 요청을 정리하면 됩니다.",
        5: "좋아요. 이제 거의 끝났어요. 금액과 접수 내용을 확인하면 됩니다."
      }
    },
    counseling: {
      label: "심리상담",
      cheer: {
        1: "좋아요. 이제 하나씩 넣으면 돼요. 어떤 상담인지 먼저 골라주세요.",
        2: "좋아요. 이제 하나씩 넣으면 돼요. 상담 지역과 날짜를 정리하면 됩니다.",
        3: "좋아요. 이제 하나씩 넣으면 돼요. 횟수와 방향을 넣어주세요.",
        4: "좋아요. 이제 하나씩 넣으면 돼요. 대면이나 추가 요청을 정리하면 됩니다.",
        5: "좋아요. 이제 거의 끝났어요. 금액과 접수 내용을 확인하면 됩니다."
      }
    }
  };

  const WASTE_CATEGORIES = {
    furniture: { label: "가구 폐기", base: 50000 },
    appliance: { label: "가전 폐기", base: 70000 },
    living: { label: "생활 폐기물", base: 45000 },
    cleanup: { label: "철거 포함 정리", base: 100000 }
  };

  const INSTALL_CATEGORIES = {
    furniture: { label: "가구 설치", base: 60000 },
    appliance: { label: "가전 설치", base: 70000 },
    tv: { label: "TV 설치", base: 90000 },
    curtain: { label: "커튼·블라인드", base: 50000 },
    lighting: { label: "조명 설치", base: 50000 }
  };

  const ERRAND_CATEGORIES = {
    delivery: { label: "서류·물건 전달", base: 35000 },
    shopping: { label: "장보기·구매 대행", base: 40000 },
    pickup: { label: "픽업·수령 대행", base: 38000 },
    accompany: { label: "동행·현장 보조", base: 50000 },
    life: { label: "생활 심부름", base: 45000 }
  };

  const GENERIC_SERVICE_CONFIG = {
    organize: {
      categories: {
        closet: { label: "옷장·드레스룸 정리", base: 70000 },
        kitchen: { label: "주방 정리수납", base: 80000 },
        movein: { label: "이사 전후 정리", base: 90000 },
        wholehome: { label: "집 전체 정리수납", base: 140000 }
      },
      detailLabel: "정리할 공간이나 요청 내용을 적어주세요.",
      optionLabels: {
        visitEstimate: "방문 견적이 먼저 필요해요",
        homeVisit: "당일 방문 진행이 필요해요",
        urgent: "빠른 일정이 필요해요",
        group: "2인 이상 정리가 필요해요",
        parking: "주차나 현장 진입 확인이 필요해요",
        premium: "정리 후 수납 제안까지 원해요"
      }
    },
    ac_clean: {
      categories: {
        wall: { label: "벽걸이 에어컨", base: 90000 },
        stand: { label: "스탠드 에어컨", base: 120000 },
        twoinone: { label: "2in1 에어컨", base: 180000 },
        system: { label: "시스템 에어컨", base: 130000 }
      },
      detailLabel: "브랜드나 모델명이 있으면 적어주세요.",
      optionLabels: {
        visitEstimate: "현장 확인이 먼저 필요해요",
        homeVisit: "당일 방문이 필요해요",
        urgent: "빠른 일정이 필요해요",
        group: "2대 이상 같이 진행해요",
        parking: "주차나 사다리 조건이 있어요",
        premium: "완전 분해 세척으로 요청해요"
      }
    },
    appliance_clean: {
      categories: {
        washer: { label: "세탁기 청소", base: 90000 },
        dryer: { label: "건조기 청소", base: 80000 },
        fridge: { label: "냉장고 청소", base: 70000 },
        kitchen: { label: "주방가전 청소", base: 85000 }
      },
      detailLabel: "모델명이나 오염 상태를 적어주세요.",
      optionLabels: {
        visitEstimate: "현장 확인이 먼저 필요해요",
        homeVisit: "당일 방문이 필요해요",
        urgent: "빠른 일정이 필요해요",
        group: "2대 이상 같이 진행해요",
        parking: "주차나 이동 조건이 있어요",
        premium: "분해 세척으로 요청해요"
      }
    },
    interior: {
      categories: {
        partial: { label: "부분 인테리어", base: 180000 },
        wallpaper: { label: "도배·장판", base: 160000 },
        repair: { label: "집수리·보수", base: 150000 },
        consulting: { label: "상담·실측", base: 90000 }
      },
      detailLabel: "희망 범위나 평수, 사진 설명을 적어주세요.",
      optionLabels: {
        visitEstimate: "실측이 먼저 필요해요",
        homeVisit: "현장 방문 상담이 필요해요",
        urgent: "빠른 일정이 필요해요",
        group: "동시 진행 공간이 있어요",
        parking: "주차나 자재 진입 확인이 필요해요",
        premium: "브랜드 마감재 상담도 원해요"
      }
    },
    interior_help: {
      categories: {
        material: { label: "자재 운반 보조", base: 100000 },
        moving: { label: "가구·집기 이동 보조", base: 90000 },
        cleanup: { label: "철거 후 정리 보조", base: 110000 },
        daily: { label: "하루 현장 보조", base: 130000 }
      },
      detailLabel: "필요한 보조 작업을 적어주세요.",
      optionLabels: {
        visitEstimate: "현장 확인이 먼저 필요해요",
        homeVisit: "당일 현장 투입이 필요해요",
        urgent: "빠른 일정이 필요해요",
        group: "2인 이상 보조가 필요해요",
        parking: "주차나 자재 진입 확인이 필요해요",
        premium: "장시간 상주가 필요해요"
      }
    },
    pt: {
      categories: {
        personal: { label: "개인 PT", base: 70000 },
        duo: { label: "커플·2인 PT", base: 90000 },
        diet: { label: "다이어트 PT", base: 75000 },
        balance: { label: "근력·체형 교정", base: 80000 }
      },
      detailLabel: "운동 목적이나 희망 강도를 적어주세요.",
      optionLabels: {
        visitEstimate: "사전 상담이 먼저 필요해요",
        homeVisit: "방문 PT가 필요해요",
        urgent: "빠른 일정이 필요해요",
        group: "동반 수업이 있어요",
        parking: "주차나 센터 입장 안내가 필요해요",
        premium: "식단 코칭까지 함께 원해요"
      }
    },
    vocal: {
      categories: {
        hobby: { label: "취미 보컬", base: 60000 },
        audition: { label: "오디션·입시 보컬", base: 85000 },
        event: { label: "축가·행사용", base: 70000 },
        recording: { label: "녹음·디렉팅", base: 75000 }
      },
      detailLabel: "희망 장르나 목표를 적어주세요.",
      optionLabels: {
        visitEstimate: "사전 상담이 먼저 필요해요",
        homeVisit: "방문 수업이 필요해요",
        urgent: "빠른 일정이 필요해요",
        group: "그룹 수업이에요",
        parking: "연습실 위치 안내가 필요해요",
        premium: "녹음 피드백까지 원해요"
      }
    },
    golf: {
      categories: {
        basic: { label: "입문 레슨", base: 70000 },
        field: { label: "필드 레슨", base: 120000 },
        shortgame: { label: "숏게임 교정", base: 85000 },
        swing: { label: "스윙 교정", base: 85000 }
      },
      detailLabel: "현재 구력이나 목표를 적어주세요.",
      optionLabels: {
        visitEstimate: "사전 상담이 먼저 필요해요",
        homeVisit: "방문 또는 외부 레슨이 필요해요",
        urgent: "빠른 일정이 필요해요",
        group: "동반 레슨이에요",
        parking: "연습장 위치 안내가 필요해요",
        premium: "영상 분석까지 원해요"
      }
    },
    tutor: {
      categories: {
        english: { label: "영어 과외", base: 65000 },
        school: { label: "초중고 과외", base: 60000 },
        exam: { label: "입시·시험 대비", base: 80000 },
        adult: { label: "성인 취미·자격 과외", base: 70000 }
      },
      detailLabel: "과목, 학년, 목표를 적어주세요.",
      optionLabels: {
        visitEstimate: "사전 상담이 먼저 필요해요",
        homeVisit: "방문 수업이 필요해요",
        urgent: "빠른 일정이 필요해요",
        group: "그룹 수업이에요",
        parking: "교재나 준비물이 있어요",
        premium: "숙제 관리까지 원해요"
      }
    },
    counseling: {
      categories: {
        personal: { label: "개인 상담", base: 80000 },
        couple: { label: "부부·커플 상담", base: 100000 },
        family: { label: "가족 상담", base: 110000 },
        career: { label: "진로·직무 상담", base: 75000 }
      },
      detailLabel: "상담 주제나 현재 고민을 적어주세요.",
      optionLabels: {
        visitEstimate: "사전 상담이 먼저 필요해요",
        homeVisit: "대면 상담이 필요해요",
        urgent: "빠른 일정이 필요해요",
        group: "동반 상담이에요",
        parking: "상담 장소 안내가 필요해요",
        premium: "장기 상담으로 보고 있어요"
      }
    }
  };

  const GENERIC_SERVICES = new Set(Object.keys(GENERIC_SERVICE_CONFIG));

  const DETAIL_SELECTION_CONFIG = {
    organize: {
      title: "정리할 공간을 골라주세요.",
      summaryTitle: "정리할 공간",
      unit: "곳",
      items: {
        closet: { label: "옷장", desc: "붙박이장, 작은 옷장 정리", price: 30000 },
        dressroom: { label: "드레스룸", desc: "드레스룸 전체 구역 정리", price: 50000 },
        kitchen: { label: "주방", desc: "상부장, 하부장, 조리대 정리", price: 40000 },
        pantry: { label: "팬트리", desc: "팬트리, 수납장, 창고형 선반", price: 35000 },
        kidsroom: { label: "아이방", desc: "장난감, 책장, 수납함 정리", price: 35000 },
        storage: { label: "창고", desc: "베란다, 다용도실, 창고 정리", price: 30000 },
        study: { label: "서재", desc: "책상, 책장, 문서 정리", price: 30000 }
      }
    },
    ac_clean: {
      title: "청소할 에어컨 종류와 대수를 골라주세요.",
      summaryTitle: "에어컨 종류",
      unit: "대",
      items: {
        wall: { label: "벽걸이", desc: "가정용 벽걸이 에어컨", price: 90000 },
        stand: { label: "스탠드", desc: "스탠드형 에어컨", price: 120000 },
        twoinone: { label: "2in1", desc: "벽걸이+스탠드 세트", price: 180000 },
        system1: { label: "시스템 1way", desc: "천장형 1way", price: 130000 },
        system2: { label: "시스템 2way", desc: "천장형 2way", price: 160000 },
        system4: { label: "시스템 4way", desc: "천장형 4way", price: 220000 }
      }
    },
    appliance_clean: {
      title: "청소할 가전 종류와 수량을 골라주세요.",
      summaryTitle: "가전 종류",
      unit: "대",
      items: {
        topWasher: { label: "통돌이 세탁기", desc: "통돌이 분해 세척", price: 90000 },
        drumWasher: { label: "드럼 세탁기", desc: "드럼 세탁기 분해 세척", price: 110000 },
        dryer: { label: "건조기", desc: "건조기 먼지와 필터 청소", price: 80000 },
        sideFridge: { label: "양문형 냉장고", desc: "양문형 냉장고 내부 청소", price: 80000 },
        regularFridge: { label: "일반 냉장고", desc: "일반형 냉장고 청소", price: 70000 },
        hood: { label: "주방후드", desc: "후드망과 내부 기름때 청소", price: 60000 },
        oven: { label: "오븐", desc: "오븐 내부 기름때 청소", price: 65000 },
        dishwasher: { label: "식기세척기", desc: "필터와 내부 세척", price: 70000 }
      }
    },
    interior: {
      title: "필요한 공정이나 범위를 골라주세요.",
      summaryTitle: "공사 범위",
      unit: "항목",
      items: {
        wallpaper: { label: "도배", desc: "벽지 교체와 마감", price: 180000 },
        flooring: { label: "장판", desc: "장판 또는 바닥재 교체", price: 180000 },
        lighting: { label: "조명", desc: "등기구 교체와 설치", price: 90000 },
        tile: { label: "타일", desc: "욕실, 주방, 부분 타일", price: 200000 },
        paint: { label: "도장", desc: "페인트 도장 작업", price: 150000 },
        film: { label: "필름", desc: "문, 몰딩, 가구 필름 시공", price: 170000 },
        builtin: { label: "붙박이장", desc: "붙박이장 제작 또는 교체", price: 250000 },
        demolition: { label: "부분 철거", desc: "철거와 폐기 정리 포함", price: 220000 }
      }
    },
    interior_help: {
      title: "보조가 필요한 작업을 골라주세요.",
      summaryTitle: "보조 작업",
      unit: "건",
      items: {
        material: { label: "자재 운반", desc: "현장 자재 이동 보조", price: 100000 },
        moving: { label: "가구 이동", desc: "가구, 집기 현장 이동", price: 90000 },
        waste: { label: "폐기물 정리", desc: "잔재와 폐기물 정리 보조", price: 110000 },
        lifting: { label: "양중", desc: "상하차, 층간 운반", price: 130000 },
        cleanup: { label: "현장 청소", desc: "작업 후 현장 정리", price: 85000 },
        demolitionHelp: { label: "철거 보조", desc: "철거 현장 보조 작업", price: 120000 }
      }
    }
  };

  const WASTE_ITEM_PRICES = {
    chair: 10000,
    table: 20000,
    mattress: 30000,
    refrigerator: 50000,
    washer: 40000,
    wardrobe: 50000
  };

  const state = {
    currentStep: 1,
    address: "",
    extraAddress: "",
    moveDate: "",
    timeSlot: "",
    memo: "",
    category: "",
    wasteScale: "small",
    wasteItems: {},
    noElevator: false,
    floor: 1,
    vehicleHard: false,
    dismantle: false,
    ladder: false,
    helper: false,
    installQty: 1,
    genericQty: 1,
    drilling: false,
    anchorFix: false,
    electric: false,
    gas: false,
    water: false,
    oldRemoval: false,
    modelName: "",
    errandItemSize: "small",
    errandQty: 1,
    errandRoundTrip: false,
    errandWaitMinutes: 0,
    errandUrgent: false,
    detailSelections: {}
  };

  function $(selector) {
    return document.querySelector(selector);
  }

  function $$(selector) {
    return Array.from(document.querySelectorAll(selector));
  }

  function formatWon(value) {
    return `${Number(value || 0).toLocaleString("ko-KR")}원`;
  }

  function normalizePhone(value) {
    return String(value || "").replace(/\D+/g, "");
  }

  function getAttribution() {
    const params = new URLSearchParams(window.location.search);
    return {
      source: params.get("utm_source") || "direct",
      medium: params.get("utm_medium") || null,
      campaign: params.get("utm_campaign") || null
    };
  }

  function labelFromMap(map, key, fallback) {
    return map[key]?.label || fallback;
  }

  function getWasteScaleLabel(scale) {
    const map = { small: "소형", medium: "중형", large: "대형" };
    return map[scale] || "소형";
  }

  function getErrandSizeLabel(size) {
    const map = { small: "서류·소형", medium: "중형 박스", large: "대형 짐" };
    return map[size] || "서류·소형";
  }

  function wasteItemLabel(key) {
    const map = {
      chair: "의자",
      table: "테이블",
      mattress: "매트리스",
      refrigerator: "냉장고",
      washer: "세탁기",
      wardrobe: "장롱"
    };
    return map[key] || key;
  }

  function genericCategoryMap() {
    return GENERIC_SERVICE_CONFIG[SERVICE]?.categories || {};
  }

  function detailSelectionConfig() {
    return DETAIL_SELECTION_CONFIG[SERVICE] || null;
  }

  function ensureDetailSelectionState() {
    const config = detailSelectionConfig();
    if (!config) return;
    Object.keys(config.items).forEach((key) => {
      if (typeof state.detailSelections[key] !== "number") {
        state.detailSelections[key] = 0;
      }
    });
  }

  function getDetailSelectionEntries() {
    const config = detailSelectionConfig();
    if (!config) return [];
    return Object.entries(config.items).filter(([key]) => Number(state.detailSelections[key] || 0) > 0);
  }

  function getDetailSelectionTotalQty() {
    return getDetailSelectionEntries().reduce((sum, [key]) => sum + Number(state.detailSelections[key] || 0), 0);
  }

  function getDetailSelectionTotalPrice() {
    return getDetailSelectionEntries().reduce(
      (sum, [key, item]) => sum + Number(item.price || 0) * Number(state.detailSelections[key] || 0),
      0
    );
  }

  function readState() {
    if (SERVICE === "errand") {
      state.address = $("#serviceAddressFrom")?.value?.trim() || "";
      state.extraAddress = $("#serviceAddressTo")?.value?.trim() || "";
    } else {
      state.address = $("#serviceAddress")?.value?.trim() || "";
      state.extraAddress = "";
    }

    state.moveDate = $("#moveDate")?.value || "";
    state.timeSlot = $('input[name="timeSlot"]:checked')?.value || "";
    state.memo = $("#serviceMemo")?.value?.trim() || "";
    state.ladder = !!$("#needsLadder")?.checked;
    state.helper = !!$("#needsHelper")?.checked;

    if (SERVICE === "waste") {
      state.category = $('input[name="wasteCategory"]:checked')?.value || "";
      state.wasteScale = $('input[name="wasteScale"]:checked')?.value || "small";
      state.noElevator = !!$("#wasteNoElevator")?.checked;
      state.floor = Number($("#wasteFloor")?.value || 1);
      state.vehicleHard = !!$("#vehicleHard")?.checked;
      state.dismantle = !!$("#wasteDismantle")?.checked;
      $$(".waste-item-qty").forEach((input) => {
        state.wasteItems[input.dataset.item] = Number(input.value || 0);
      });
      return;
    }

    if (SERVICE === "install") {
      state.category = $('input[name="installCategory"]:checked')?.value || "";
      state.installQty = Number($("#installQty")?.value || 1);
      state.drilling = !!$("#installDrilling")?.checked;
      state.anchorFix = !!$("#installAnchorFix")?.checked;
      state.electric = !!$("#installElectric")?.checked;
      state.gas = !!$("#installGas")?.checked;
      state.water = !!$("#installWater")?.checked;
      state.oldRemoval = !!$("#oldRemoval")?.checked;
      state.modelName = $("#modelName")?.value?.trim() || "";
      return;
    }

    if (SERVICE === "errand") {
      state.category = $('input[name="errandCategory"]:checked')?.value || "";
      state.errandItemSize = $('input[name="errandItemSize"]:checked')?.value || "small";
      state.errandQty = Number($("#errandQty")?.value || 1);
      state.errandRoundTrip = !!$("#errandRoundTrip")?.checked;
      state.errandWaitMinutes = Number($("#errandWaitMinutes")?.value || 0);
      state.errandUrgent = !!$("#errandUrgent")?.checked;
      return;
    }

    if (GENERIC_SERVICES.has(SERVICE)) {
      state.category = $('input[name="serviceCategory"]:checked')?.value || "";
      if (detailSelectionConfig()) {
        ensureDetailSelectionState();
        $$(".detail-select-card[data-detail-key]").forEach((card) => {
          const key = card.dataset.detailKey;
          const qty = Number(card.querySelector(".detail-select-qty")?.textContent || state.detailSelections[key] || 0);
          state.detailSelections[key] = qty;
        });
        state.genericQty = getDetailSelectionTotalQty();
      } else {
        state.genericQty = Number($("#genericQty")?.value || 1);
      }
      state.modelName = $("#serviceDetailName")?.value?.trim() || "";
      state.drilling = !!$("#optionVisitEstimate")?.checked;
      state.anchorFix = !!$("#optionHomeVisit")?.checked;
      state.electric = !!$("#optionUrgent")?.checked;
      state.gas = !!$("#optionGroup")?.checked;
      state.water = !!$("#optionParking")?.checked;
      state.oldRemoval = !!$("#optionPremium")?.checked;
    }
  }

  function calculateWastePrice() {
    let total = WASTE_CATEGORIES[state.category]?.base || 50000;
    const scaleMap = { small: 0, medium: 25000, large: 55000 };
    total += scaleMap[state.wasteScale] || 0;
    Object.entries(state.wasteItems).forEach(([key, qty]) => {
      total += (WASTE_ITEM_PRICES[key] || 0) * Number(qty || 0);
    });
    if (state.noElevator) total += Math.max(0, Number(state.floor || 1) - 1) * 8000;
    if (state.vehicleHard) total += 20000;
    if (state.dismantle) total += 30000;
    if (state.helper) total += 60000;
    if (state.ladder) total += 120000;
    return Math.round(total);
  }

  function calculateInstallPrice() {
    const base = INSTALL_CATEGORIES[state.category]?.base || 60000;
    const qty = Math.max(1, Number(state.installQty || 1));
    let total = base + Math.max(0, qty - 1) * Math.round(base * 0.5);
    if (state.drilling) total += 30000;
    if (state.anchorFix) total += 20000;
    if (state.electric) total += 30000;
    if (state.gas) total += 50000;
    if (state.water) total += 50000;
    if (state.oldRemoval) total += 20000;
    if (state.helper) total += 60000;
    if (state.ladder) total += 120000;
    return Math.round(total);
  }

  function calculateErrandPrice() {
    const base = ERRAND_CATEGORIES[state.category]?.base || 35000;
    const sizeMap = { small: 0, medium: 12000, large: 28000 };
    const qty = Math.max(1, Number(state.errandQty || 1));
    let total = base + (sizeMap[state.errandItemSize] || 0);
    total += Math.max(0, qty - 1) * 7000;
    if (state.errandRoundTrip) total += 15000;
    total += Math.max(0, Math.round(Number(state.errandWaitMinutes || 0) / 10)) * 3000;
    if (state.errandUrgent) total += 12000;
    if (state.helper) total += 60000;
    if (state.ladder) total += 120000;
    return Math.round(total);
  }

  function calculateGenericPrice() {
    const base = genericCategoryMap()[state.category]?.base || 70000;
    const detailConfig = detailSelectionConfig();
    const qty = Math.max(1, Number(state.genericQty || 1));
    let total = base + Math.max(0, qty - 1) * Math.round(base * 0.4);
    if (detailConfig) {
      total = base + getDetailSelectionTotalPrice();
    }
    if (state.drilling) total += 30000;
    if (state.anchorFix) total += 25000;
    if (state.electric) total += 20000;
    if (state.gas) total += 15000;
    if (state.water) total += 10000;
    if (state.oldRemoval) total += 25000;
    if (state.helper) total += 60000;
    if (state.ladder) total += 120000;
    return Math.round(total);
  }

  function calculatePrice() {
    const total =
      SERVICE === "install"
        ? calculateInstallPrice()
        : SERVICE === "errand"
          ? calculateErrandPrice()
          : GENERIC_SERVICES.has(SERVICE)
            ? calculateGenericPrice()
            : calculateWastePrice();

    const driverAmount = Math.round(total * 0.8);
    return {
      total,
      deposit: total,
      balance: 0,
      driverAmount,
      companyAmount: total - driverAmount
    };
  }

  function validateStep(step) {
    readState();
    if (step === 1) return Boolean(state.category);
    if (step === 2) {
      if (SERVICE === "errand") return (!!state.address || !!state.extraAddress) && !!state.moveDate;
      return !!state.address && !!state.moveDate;
    }
    if (step === 3) {
      if (SERVICE === "waste") return Object.values(state.wasteItems).some((value) => Number(value || 0) > 0);
      if (SERVICE === "install") return Number(state.installQty || 0) > 0;
      if (GENERIC_SERVICES.has(SERVICE)) {
        if (detailSelectionConfig()) return getDetailSelectionTotalQty() > 0;
        return Number(state.genericQty || 0) > 0;
      }
      return Number(state.errandQty || 0) > 0;
    }
    return true;
  }

  function getSummaryLines() {
    if (SERVICE === "waste") {
      const items = Object.entries(state.wasteItems)
        .filter(([, qty]) => Number(qty || 0) > 0)
        .map(([key, qty]) => `${wasteItemLabel(key)} ${qty}개`);
      return [
        `접수 유형: ${labelFromMap(WASTE_CATEGORIES, state.category, "-")}`,
        `수거 주소: ${state.address || "-"}`,
        `희망 날짜: ${state.moveDate || "-"}`,
        `규모: ${getWasteScaleLabel(state.wasteScale)}`,
        items.length ? `폐기물: ${items.join(", ")}` : "폐기물: 선택 없음",
        `추가 요청: ${[
          state.noElevator ? `${state.floor}층 계단` : "엘리베이터 있음",
          state.vehicleHard ? "차량 진입 어려움" : null,
          state.dismantle ? "간단 철거 필요" : null,
          state.helper ? "인부 필요" : null,
          state.ladder ? "사다리차 필요" : null
        ].filter(Boolean).join(" · ")}`
      ];
    }

    if (SERVICE === "install") {
      return [
        `접수 유형: ${labelFromMap(INSTALL_CATEGORIES, state.category, "-")}`,
        `설치 주소: ${state.address || "-"}`,
        `희망 날짜: ${state.moveDate || "-"}`,
        `수량: ${Math.max(1, Number(state.installQty || 1))}건`,
        `모델명: ${state.modelName || "미입력"}`,
        `추가 요청: ${[
          state.drilling ? "타공 있음" : "타공 없음",
          state.anchorFix ? "벽고정" : null,
          state.electric ? "전기 연결" : null,
          state.gas ? "가스 연결" : null,
          state.water ? "수도 연결" : null,
          state.oldRemoval ? "기존 제품 철거" : null,
          state.helper ? "인부 필요" : null,
          state.ladder ? "사다리차 필요" : null
        ].filter(Boolean).join(" · ")}`
      ];
    }

    if (SERVICE === "errand") {
      const errandLocations = [];
      if (state.address) errandLocations.push(`출발지: ${state.address}`);
      if (state.extraAddress) errandLocations.push(`도착지: ${state.extraAddress}`);
      if (!errandLocations.length) errandLocations.push("이동 위치: 미입력");

      return [
        `접수 유형: ${labelFromMap(ERRAND_CATEGORIES, state.category, "-")}`,
        ...errandLocations,
        `희망 날짜: ${state.moveDate || "-"}`,
        `물건 규모: ${getErrandSizeLabel(state.errandItemSize)} ${Math.max(1, Number(state.errandQty || 1))}건`,
        `추가 요청: ${[
          state.errandRoundTrip ? "왕복" : "편도 또는 현장형",
          state.errandWaitMinutes ? `대기 ${state.errandWaitMinutes}분` : null,
          state.errandUrgent ? "긴급 요청" : null,
          state.helper ? "인부 도움" : null
        ].filter(Boolean).join(" · ")}`
      ];
    }

    return [
      `접수 유형: ${labelFromMap(genericCategoryMap(), state.category, "-")}`,
      `방문 주소: ${state.address || "-"}`,
      `희망 날짜: ${state.moveDate || "-"}`,
      detailSelectionConfig()
        ? `${
            detailSelectionConfig().summaryTitle
          }: ${getDetailSelectionEntries().length ? getDetailSelectionEntries().map(([key, item]) => `${item.label} ${state.detailSelections[key]}${detailSelectionConfig().unit}`).join(", ") : "선택 없음"}`
        : `건수: ${Math.max(1, Number(state.genericQty || 1))}건`,
      `상세 내용: ${state.modelName || "미입력"}`,
      `추가 요청: ${[
        state.drilling ? "사전 방문 견적" : null,
        state.anchorFix ? "방문 진행" : null,
        state.electric ? "빠른 일정" : null,
        state.gas ? "그룹 진행" : null,
        state.water ? "주차·현장 확인" : null,
        state.oldRemoval ? "프리미엄 요청" : null,
        state.helper ? "인부 필요" : null,
        state.ladder ? "사다리차 필요" : null
      ].filter(Boolean).join(" · ")}`
    ];
  }

  function renderPrice() {
    readState();
    const pricing = calculatePrice();
    if ($("#stickyPrice")) $("#stickyPrice").textContent = formatWon(pricing.total);
    if ($("#price")) $("#price").textContent = formatWon(pricing.total);
    if ($("#stickyPriceDetail")) {
      $("#stickyPriceDetail").textContent = `기사 정산 예정 ${formatWon(pricing.driverAmount)} / 당고 정산 ${formatWon(pricing.companyAmount)}`;
    }
    if ($("#priceUnder")) {
      $("#priceUnder").textContent = "전체 결제 뒤 바로 주문을 만들고 배차 준비를 시작합니다.";
    }
    if ($("#summary")) {
      $("#summary").innerHTML = getSummaryLines().map((line) => `<div class="mini-summary">${line}</div>`).join("");
    }
  }

  function updateStageShell() {
    const progress = Math.round((state.currentStep / 5) * 100);
    if ($("#wizardStageBar")) $("#wizardStageBar").style.width = `${progress}%`;
    if ($("#wizardCheer")) $("#wizardCheer").textContent = CONFIG[SERVICE].cheer[state.currentStep];
    $$("#wizardStagePills .stage-pill").forEach((pill, index) => {
      pill.classList.toggle("is-active", index + 1 === state.currentStep);
      pill.classList.toggle("is-done", index + 1 < state.currentStep);
    });
  }

  function showStep(step) {
    state.currentStep = Math.max(1, Math.min(5, step));
    $$("[data-step]").forEach((section) => {
      const isActive = String(section.dataset.step) === String(state.currentStep);
      section.hidden = !isActive;
      section.classList.toggle("is-active", isActive);
    });
    updateStageShell();
    renderPrice();
    if ($("#wizardPrev")) $("#wizardPrev").disabled = state.currentStep === 1;
    if ($("#wizardNext")) $("#wizardNext").textContent = state.currentStep === 5 ? "결제 확인하기" : "다음 단계";
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function buildRawText() {
    return [`[${CONFIG[SERVICE].label} 접수]`, ...getSummaryLines(), state.memo ? `메모: ${state.memo}` : null]
      .filter(Boolean)
      .join("\n");
  }

  function buildCheckoutPayload(customerName, customerPhone) {
    readState();
    const pricing = calculatePrice();
    const attribution = getAttribution();
    const isErrand = SERVICE === "errand";

    return {
      service_type: SERVICE,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_note: state.memo || null,
      move_date: state.moveDate,
      start_address: state.address,
      end_address: isErrand ? state.extraAddress : state.address,
      distance_km: 0,
      floor: SERVICE === "waste" && state.noElevator ? state.floor : 0,
      weight_kg: 0,
      item_summary:
        SERVICE === "waste"
          ? { category: state.category, scale: state.wasteScale, wasteItems: state.wasteItems }
          : SERVICE === "install"
            ? {
                category: state.category,
                installQty: state.installQty,
                modelName: state.modelName
              }
            : SERVICE === "errand"
              ? {
                  category: state.category,
                  itemSize: state.errandItemSize,
                  errandQty: state.errandQty,
                  roundTrip: state.errandRoundTrip
                }
              : {
                  category: state.category,
                  quantity: state.genericQty,
                  detailName: state.modelName,
                  detailSelections: detailSelectionConfig() ? { ...state.detailSelections } : null
                },
      option_summary:
        SERVICE === "waste"
          ? {
              noElevator: state.noElevator,
              vehicleHard: state.vehicleHard,
              dismantle: state.dismantle,
              helper: state.helper,
              ladder: state.ladder
            }
          : SERVICE === "install"
            ? {
                drilling: state.drilling,
                anchorFix: state.anchorFix,
                electric: state.electric,
                gas: state.gas,
                water: state.water,
                oldRemoval: state.oldRemoval,
                helper: state.helper,
                ladder: state.ladder
              }
            : SERVICE === "errand"
              ? {
                  waitMinutes: state.errandWaitMinutes,
                  urgent: state.errandUrgent,
                  helper: state.helper
                }
              : {
                  visitEstimate: state.drilling,
                  homeVisit: state.anchorFix,
                  urgent: state.electric,
                  group: state.gas,
                  parking: state.water,
                  premium: state.oldRemoval,
                  helper: state.helper,
                  ladder: state.ladder
                },
      acquisition_source: attribution.source,
      acquisition_medium: attribution.medium,
      acquisition_campaign: attribution.campaign,
      raw_text: buildRawText(),
      price_override: {
        total: pricing.total,
        deposit: pricing.total,
        balance: 0,
        driverAmount: pricing.driverAmount,
        companyAmount: pricing.companyAmount,
        version: `dango-${SERVICE}-v2`
      }
    };
  }

  async function startCheckout() {
    const customerName = ($("#checkoutCustomerName")?.value || "").trim();
    const customerPhone = normalizePhone($("#checkoutCustomerPhone")?.value || "");
    const messageEl = $("#checkoutInlineMessage");
    const button = $("#confirmCheckoutStart");
    if (!customerName || customerPhone.length < 10) {
      if (messageEl) messageEl.textContent = "이름과 연락처를 정확히 넣어주세요.";
      return;
    }
    const originalText = button?.textContent || "";
    if (button) {
      button.disabled = true;
      button.textContent = "결제 페이지를 준비하고 있어요...";
    }
    try {
      const res = await fetch("/.netlify/functions/create-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(buildCheckoutPayload(customerName, customerPhone))
      });
      const data = await res.json();
      if (res.ok && data.job?.id) {
        window.location.href = `../customer/pay.html?jobId=${encodeURIComponent(data.job.id)}`;
        return;
      }
      throw new Error(data.error || "주문 생성 실패");
    } catch (error) {
      if (messageEl) messageEl.textContent = "주문 연결이 늦어지고 있어요. 잠시 후 다시 시도해주세요.";
    } finally {
      if (button) {
        button.disabled = false;
        button.textContent = originalText;
      }
    }
  }

  function bindSteppers() {
    $$(".stepper-btn[data-stepper]").forEach((button) => {
      button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.stepper);
        if (!input) return;
        const value = Math.max(Number(input.min || 0), Number(input.value || 0) + Number(button.dataset.dir || 0));
        input.value = String(value);
        renderPrice();
      });
    });
  }

  function renderDetailSelectionSummary() {
    const config = detailSelectionConfig();
    const summary = $("#detailSelectionSummary");
    const modalSummary = $("#detailSelectionModalSummary");
    const launchStrong = $(".detail-picker-launch strong");
    if (!config || !summary) return;
    const entries = getDetailSelectionEntries();
    if (launchStrong) {
      launchStrong.textContent = `${config.summaryTitle} ${getDetailSelectionTotalQty()}${config.unit}`;
    }
    if (!entries.length) {
      summary.innerHTML = `<div class="detail-selection-empty">${config.summaryTitle}을 아직 고르지 않았어요. 버튼을 눌러 필요한 항목을 선택해보세요.</div>`;
    } else {
      summary.innerHTML = `
        <div class="detail-selection-list">
          ${entries
            .map(
              ([key, item]) => `
                <div class="detail-selection-chip">
                  <span>${item.label}</span>
                  <strong>${state.detailSelections[key]}${config.unit}</strong>
                </div>
              `
            )
            .join("")}
        </div>
        <div class="detail-selection-meta">선택 ${getDetailSelectionTotalQty()}${config.unit} / 추가 금액 ${formatWon(getDetailSelectionTotalPrice())}</div>
      `;
    }
    if (modalSummary) {
      modalSummary.textContent = entries.length
        ? `${config.summaryTitle} ${getDetailSelectionTotalQty()}${config.unit} 선택`
        : `${config.summaryTitle}을 아직 고르지 않았어요.`;
    }
  }

  function renderDetailSelectionModal() {
    const config = detailSelectionConfig();
    const grid = $("#detailSelectionGrid");
    if (!config || !grid) return;
    grid.innerHTML = Object.entries(config.items)
      .map(([key, item]) => {
        const qty = Number(state.detailSelections[key] || 0);
        return `
          <div class="detail-select-card ${qty > 0 ? "is-selected" : ""}" data-detail-key="${key}">
            <div class="detail-select-card__head">
              <div>
                <div class="detail-select-card__title">${item.label}</div>
                <div class="detail-select-card__desc">${item.desc}</div>
              </div>
              <div class="detail-select-card__price">${formatWon(item.price)}</div>
            </div>
            <div class="detail-select-stepper">
              <button type="button" class="detail-step-btn" data-detail-dir="-1" aria-label="${item.label} 줄이기">−</button>
              <div class="detail-select-qty">${qty}</div>
              <button type="button" class="detail-step-btn" data-detail-dir="1" aria-label="${item.label} 늘리기">+</button>
            </div>
          </div>
        `;
      })
      .join("");
    renderDetailSelectionSummary();
  }

  function mountDetailSelectionUi() {
    const config = detailSelectionConfig();
    if (!config) return;
    ensureDetailSelectionState();
    const step3 = document.querySelector('.step-card[data-step="3"]');
    if (!step3) return;
    const heading = step3.querySelector("h2");
    const content = `
      <div class="card">
        <div class="sub">${config.summaryTitle}</div>
        <button type="button" class="detail-picker-launch" data-open-modal="detailSelectionModal">
          <span>세부 항목 선택하기</span>
          <strong>${config.summaryTitle} ${getDetailSelectionTotalQty()}${config.unit}</strong>
        </button>
        <div id="detailSelectionSummary" class="detail-selection-summary"></div>
        <div class="sub" style="margin-top:16px;">상세 요청</div>
        <input type="text" id="serviceDetailName" class="address-input" placeholder="${GENERIC_SERVICE_CONFIG[SERVICE]?.detailLabel || "요청 내용을 적어주세요."}" />
      </div>
    `;
    if (heading) {
      heading.insertAdjacentHTML("afterend", content);
    }
    step3.querySelectorAll(".card").forEach((card, index) => {
      if (index > 0) card.remove();
    });

    if (!$("#detailSelectionModal")) {
      document.body.insertAdjacentHTML(
        "beforeend",
        `
          <div class="modal" id="detailSelectionModal" hidden aria-hidden="true">
            <div class="modal-backdrop" data-close-modal></div>
            <div class="modal-panel modal-panel-wide">
              <div class="modal-head">
                <div class="modal-title">${config.title}</div>
                <button class="modal-x" type="button" data-close-modal aria-label="닫기">×</button>
              </div>
              <div class="modal-body">
                <p class="checkout-modal-copy">${config.summaryTitle}을 실제에 가깝게 골라주세요. 카드 아무 곳이나 누르면 1${config.unit}부터 바로 선택됩니다.</p>
                <div id="detailSelectionGrid" class="detail-selection-grid"></div>
              </div>
              <div class="modal-foot modal-foot--stack">
                <div id="detailSelectionModalSummary" class="mini-summary">아직 선택한 항목이 없어요.</div>
                <button type="button" class="wizard-btn primary large" data-close-modal>선택 완료</button>
              </div>
            </div>
          </div>
        `
      );
    }
    renderDetailSelectionModal();
    renderDetailSelectionSummary();
  }

  function bindWasteItems() {
    $$(".waste-item-row").forEach((row) => {
      row.addEventListener("click", (event) => {
        if (event.target.closest("button") || event.target.tagName === "INPUT") return;
        const input = row.querySelector("input");
        if (!input) return;
        input.value = String(Number(input.value || 0) + 1);
        renderPrice();
      });
    });
    $$(".waste-item-stepper .stepper-btn").forEach((button) => {
      button.addEventListener("click", () => {
        const item = button.dataset.item;
        const input = $(`.waste-item-qty[data-item="${item}"]`);
        if (!input) return;
        input.value = String(Math.max(0, Number(input.value || 0) + Number(button.dataset.dir || 0)));
        renderPrice();
      });
    });
  }

  function openPostcodePicker(targetId) {
    const input = document.getElementById(targetId);
    if (!input) return;
    if (!window.daum?.Postcode) {
      input.focus();
      return;
    }
    new window.daum.Postcode({
      oncomplete(data) {
        const nextAddress = data.roadAddress || data.jibunAddress || data.address || "";
        input.value = nextAddress;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
    }).open();
  }

  function bindAddressPickers() {
    $$("[data-address-target]").forEach((button) => {
      button.addEventListener("click", () => openPostcodePicker(button.dataset.addressTarget));
    });
  }

  function bindDateAndTimeCards() {
    $$(".date-wrap").forEach((wrap) => {
      wrap.addEventListener("click", (event) => {
        if (event.target.closest("input, button")) return;
        const input = wrap.querySelector('input[type="date"]');
        if (!input) return;
        if (typeof input.showPicker === "function") {
          try {
            input.showPicker();
            return;
          } catch (_) {}
        }
        input.focus();
        input.click();
      });
    });

    $$(".time-chip").forEach((chip) => {
      chip.addEventListener("click", (event) => {
        const input = chip.querySelector('input[type="radio"]');
        if (!input || input.disabled) return;
        event.preventDefault();
        input.checked = true;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      });
    });
  }

  function bindOptionCards() {
    document.addEventListener("click", (event) => {
      const optionRow = event.target.closest(".option");
      if (!optionRow) return;

      const tappedInteractive = event.target.closest(
        "input, button, a, label, textarea, select, .stepper, [data-open-modal], [data-close-modal], [data-close]"
      );
      if (tappedInteractive) return;

      const control = optionRow.querySelector('input[type="checkbox"], input[type="radio"]');
      if (!control) return;

      event.preventDefault();
      if (control.type === "checkbox") {
        control.checked = !control.checked;
      } else {
        control.checked = true;
      }
      control.dispatchEvent(new Event("change", { bubbles: true }));
    });
  }

  function bindModals() {
    $$("[data-open-modal]").forEach((button) => {
      button.addEventListener("click", () => {
        const modal = document.getElementById(button.dataset.openModal);
        if (modal) {
          modal.hidden = false;
          modal.setAttribute("aria-hidden", "false");
        }
      });
    });
    $$("[data-close-modal]").forEach((button) => {
      button.addEventListener("click", () => {
        const modal = button.closest(".modal");
        if (modal) {
          modal.hidden = true;
          modal.setAttribute("aria-hidden", "true");
        }
      });
    });
  }

  function bindDetailSelectionCards() {
    document.addEventListener("click", (event) => {
      const card = event.target.closest(".detail-select-card[data-detail-key]");
      if (!card) return;
      const key = card.dataset.detailKey;
      const tappedButton = event.target.closest(".detail-step-btn");
      if (tappedButton) {
        event.preventDefault();
        state.detailSelections[key] = Math.max(
          0,
          Number(state.detailSelections[key] || 0) + Number(tappedButton.dataset.detailDir || 0)
        );
        renderDetailSelectionModal();
        renderPrice();
        return;
      }
      if (state.detailSelections[key] <= 0) {
        state.detailSelections[key] = 1;
        renderDetailSelectionModal();
        renderPrice();
      }
    });
  }

  function bindEvents() {
    bindOptionCards();
    bindSteppers();
    bindWasteItems();
    bindAddressPickers();
    bindDateAndTimeCards();
    bindModals();
    bindDetailSelectionCards();
    $$("#wizardStagePills .stage-pill").forEach((pill, index) => {
      pill.addEventListener("click", () => {
        if (index + 1 <= state.currentStep || validateStep(state.currentStep)) {
          showStep(index + 1);
        }
      });
    });
    $("#wizardPrev")?.addEventListener("click", () => showStep(state.currentStep - 1));
    $("#wizardNext")?.addEventListener("click", () => {
      if (!validateStep(state.currentStep)) {
        alert("현재 단계 입력을 먼저 확인해주세요.");
        return;
      }
      if (state.currentStep === 5) {
        $("#startCheckoutCta")?.click();
        return;
      }
      showStep(state.currentStep + 1);
    });
    document.addEventListener("input", renderPrice);
    document.addEventListener("change", renderPrice);
    $("#confirmCheckoutStart")?.addEventListener("click", startCheckout);
    $("#stickyToggleBtn")?.addEventListener("click", () => {
      const bar = $("#stickyPriceBar");
      const expanded = bar?.classList.toggle("is-expanded");
      bar?.classList.toggle("is-collapsed", !expanded);
      $("#stickyToggleBtn").textContent = expanded ? "접기" : "상세";
      $("#stickyToggleBtn").setAttribute("aria-expanded", expanded ? "true" : "false");
    });
    $(".dd-footer-toggle")?.addEventListener("click", () => {
      const body = $("#ddBizInfo");
      const expanded = $(".dd-footer-toggle").getAttribute("aria-expanded") === "true";
      $(".dd-footer-toggle").setAttribute("aria-expanded", expanded ? "false" : "true");
      if (body) body.hidden = expanded;
    });
  }

  function init() {
    const dateInput = $("#moveDate");
    if (dateInput) dateInput.min = new Date().toISOString().slice(0, 10);
    mountDetailSelectionUi();
    bindEvents();
    renderPrice();
    showStep(1);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
