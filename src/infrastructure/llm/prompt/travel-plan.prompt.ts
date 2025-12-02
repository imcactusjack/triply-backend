import { TravelPlanLLMInput } from '../interface/llm.client';

/**
 * 여행 일정 기간을 계산합니다.
 */
function calculateDuration(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return diffDays;
}

/**
 * 여행 일정 생성을 위한 프롬프트를 생성합니다.
 * @param input 여행 계획 입력 정보
 * @returns 생성된 프롬프트 문자열
 */
export function buildTravelPlanPrompt(input: TravelPlanLLMInput): string {
  const duration = calculateDuration(input.dates.startDate, input.dates.endDate);

  return `당신은 전문 여행 플래너입니다. 사용자의 요구사항을 바탕으로 상세한 여행 일정을 생성해주세요.

**여행 정보:**
- 출발지: ${input.departure}
- 목적지: ${input.destination}
- 동행자: ${input.companions}
- 여행 기간: ${input.dates.startDate} ~ ${input.dates.endDate} (${duration}일)
- 여행 컨셉: ${input.concept}
${input.preferences ? `- 추가 선호사항: ${input.preferences}` : ''}

**핵심 요구사항:**
1. 출발지(${input.departure})에서 목적지(${input.destination})로의 이동 경로와 동선을 구글 맵 기준으로 고려하여 일정을 작성해주세요.
2. 출발지 기준으로 목적지까지의 거리와 이동 시간을 구글 맵 기준으로 계산하여, 첫날과 마지막날의 일정을 현실적으로 계획해주세요.
3. 목적지와 주변 지역에서 추천할 만한 여행지를 일자별로 동선을 생각하면서 하루의 처음부터 끝까지 모든 일정을 추천해주세요.
4. ${duration}일 동안의 상세한 일정을 작성해주세요.
5. 각 일차별로 시간대별 활동 계획을 포함해주세요 (오전, 오후, 저녁).
6. 동행자(${input.companions})와 여행 컨셉(${input.concept})에 맞는 활동을 추천해주세요.
7. 현실적이고 실행 가능한 일정으로 작성해주세요.
8. **중요: 숙소(호텔, 펜션, 게스트하우스, 리조트 등)는 추천하지 마세요. 식당, 관광지, 카페, 쇼핑, 액티비티 등 방문 장소만 추천해주세요.**
9. 각 장소마다 반드시 다음 정보를 포함해주세요:
   - 장소명: location (정확한 이름)
   - 카테고리: category (식당, 명소, 핫플, 관광스팟, 카페, 쇼핑, 액티비티 등, 숙소 제외)
   - 구글 리뷰 별점: rating (실제 구글 리뷰 기준, 0.0 ~ 5.0)
   - 운영 시간: operatingHours (영업 시간 정보가 있다면 "10:00~17:00" 형식으로, 없으면 "정보없음")
   - 이동 시간: travelTime (다음 장소까지 구글 맵 기준 차량 이동 시간, "28분" 형식, 마지막 장소는 제외)
   - 좌표: coordinates (장소의 위도 latitude와 경도 longitude, 소수점 6자리까지 정확하게 제공)
   - 설명: description (장소에 대한 설명)

**동선 계획 원칙:**
- 장소 간 이동 거리와 시간을 최소화하도록 동선을 최적화해주세요.
- 구글 맵 기준 차량 이동 시간을 정확하게 계산하여 일정에 반영해주세요.
- 같은 지역이나 가까운 장소들을 연속으로 배치하여 이동 시간을 줄여주세요.
- 각 장소의 운영 시간을 고려하여 방문 시간을 설정해주세요.

**카테고리 분류 (숙소 제외):**
- 식당: 한식, 중식, 일식, 양식 등 모든 음식점
- 명소: 유명한 관광지, 랜드마크
- 핫플: 최근 인기 있는 장소, SNS 유명 장소
- 관광스팟: 박물관, 전시관, 공원, 해변 등
- 카페: 카페, 디저트 전문점
- 쇼핑: 쇼핑몰, 시장, 기념품점
- 액티비티: 체험, 레저, 스포츠 등

**제외 사항:**
- 숙소(호텔, 펜션, 게스트하우스, 리조트 등)는 추천하지 마세요.

다음 JSON 형식으로 응답해주세요:
{
  "recommendedPlaces": ["여행지1", "여행지2", "여행지3", "...."],
  "schedule": [
    {
      "day": 1,
      "date": "${input.dates.startDate}",
      "activities": [
        {
          "time": "09:00-12:00",
          "location": "장소명",
          "category": "식당",
          "rating": 4.4,
          "operatingHours": "10:00~17:00",
          "travelTime": "28분",
          "coordinates": {
            "latitude": 37.566536,
            "longitude": 126.977966
          },
          "description": "활동 설명"
        }
      ]
    }
  ],
  "summary": "전체 일정에 대한 요약 설명"
}`;
}
