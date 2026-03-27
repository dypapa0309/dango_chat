import move from './move.js'
import clean from './clean.js'
import waste from './waste.js'
import install from './install.js'
import errand from './errand.js'
import organize from './organize.js'
import ac_clean from './ac_clean.js'
import appliance_clean from './appliance_clean.js'
import golf from './golf.js'
import pt from './pt.js'
import vocal from './vocal.js'
import tutor from './tutor.js'
import counseling from './counseling.js'
import interior from './interior.js'
import interior_help from './interior_help.js'
import marketing from './marketing.js'
import yongdal from './yongdal.js'

export const SERVICES = {
  move, clean, waste, install, errand, organize,
  ac_clean, appliance_clean,
  golf, pt, vocal, tutor, counseling,
  interior, interior_help, marketing, yongdal,
}

// Greeting phase용 서비스 요약 (짧게)
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
