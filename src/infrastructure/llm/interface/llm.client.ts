export interface TravelPlanLLMInput {
  departure: string; // 출발지
  destination: string; // 목적지
  companions: string; // 누구와 ex) 가족, 친구, 연인, 혼자
  dates: {
    startDate: string; // 시작일 ex) yyyy-MM-dd
    endDate: string; // 종료일 ex) yyyy-MM-dd
  };
  concepts: string[]; // 여행 컨셉 ex) 맛집, 관광지, 자연, 휴식, 쇼핑, 액티비티, 핫플 등
  preferences?: string; // 추가 입력 (선택사항)
}

export interface TravelActivity {
  time: string; // 시간대 ex) 09:00-12:00
  location: string; // 장소명
  placeSearchQuery?: string; // 구글 Places 검색용 쿼리 "장소명 + 지역명" 형식
  coordinates: {
    latitude: number | null; // 위도 (null 가능)
    longitude: number | null; // 경도 (null 가능)
  };
  categories: string[]; // 카테고리 ex) 식당, 명소, 핫플, 숙소, 관광스팟 등
  rating?: number; // 구글 리뷰 별점 (0.0 ~ 5.0)
  operatingHours?: string; // 운영 시간 ex) 10:00~17:00
  travelTime?: string; // 다음 장소까지 이동 시간 ex) 28분
  description?: string; // 추가 설명
}

export interface TravelDayPlan {
  day: number;
  date: string;
  activities: TravelActivity[];
}

export interface TravelPlanLLMResponse {
  recommendedPlaces: string[]; // 추천 여행지 목록
  schedule: TravelDayPlan[]; // 일정 (Day 1 ~ N)
  summary: string; // 전체 일정 요약
}

export interface LLMClient {
  /**
   * 사용자 입력을 기반으로 여행 일정 초안을 생성합니다.
   * @param input 여행 계획 입력 정보
   * @returns 여행 일정 초안 (추천 여행지, 일정, 요약)
   */
  generateTravelPlan(input: TravelPlanLLMInput): Promise<TravelPlanLLMResponse>;
}
