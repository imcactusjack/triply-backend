import { TravelDayPlan, TravelPlanLLMInput } from '../../interface/travel.plan.type';

export { TravelActivity, TravelDayPlan, TravelPlanLLMInput } from '../../interface/travel.plan.type';

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
