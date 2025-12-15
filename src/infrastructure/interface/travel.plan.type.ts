export interface TravelPlanLLMInput {
  departure: string; // 출발지
  destination: string; // 목적지
  companion: string; // 누구와 ex) 가족, 친구, 연인, 혼자
  startDate: string; // 시작일 ex) yyyy-MM-dd
  endDate: string; // 종료일 ex) yyyy-MM-dd
  concept?: string[]; // 여행 컨셉 ex) 맛집, 관광지, 자연, 휴식, 쇼핑, 액티비티, 핫플 등
  preference?: string; // 추가 입력 (선택사항)
}

export interface TravelActivity {
  order: number; // 활동 순서 (0부터 시작)
  activityStartTime: string | null; // 활동 시작 시간 ex) HH:mm
  activityEndTime: string | null; // 활동 종료 시간 ex) HH:mm
  location: string; // 장소명
  placeSearchQuery?: string; // 구글 Places 검색용 쿼리 "장소명 + 지역명" 형식
  placeId?: string; // Google Places place_id
  coordinates: {
    latitude: number | null; // 위도 (null 가능)
    longitude: number | null; // 경도 (null 가능)
  };
  categories: string[]; // 카테고리 ex) 식당, 명소, 핫플, 숙소, 관광스팟 등
  rating?: number; // 구글 리뷰 별점 (0.0 ~ 5.0)
  operatingHours?: string[]; // 운영 시간 배열. 예: ["월 09:00-18:00", ...]
  travelTime?: number; // 다음 장소까지 이동 시간 ex) 28
  description?: string; // 추가 설명
}

export interface TravelDayPlan {
  day: number;
  date: string;
  activities: TravelActivity[];
}
