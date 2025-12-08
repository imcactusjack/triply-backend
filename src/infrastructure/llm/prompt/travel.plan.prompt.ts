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

  return `당신은 AI 전문 여행 플래너이자 JSON Formatter 입니다.  
**당신의 응답은 반드시 JSON 형식만 포함해야 하며, JSON 외의 설명 문장, 불필요한 텍스트는 절대 포함하면 안 됩니다.**  
JSON 시작 전 어떤 말도 하지 마세요. JSON 이외의 텍스트가 하나라도 포함되면 잘못된 출력입니다.

여행 정보를 기반으로 상세 여행 일정을 생성하세요.

여행 정보:
- 출발지: ${input.departure}
- 목적지: ${input.destination}
- 동행자: ${input.companions}
- 여행 기간: ${input.dates.startDate} ~ ${input.dates.endDate} (${duration}일)
- 여행 컨셉: ${input.concepts.join(', ')}
${input.preferences ? `- 추가 선호사항: ${input.preferences}` : ''}

핵심 요구사항:
1. 출발지(${input.departure}) → 목적지(${input.destination}) 동선을 구글맵 기준으로 고려해 일정 구성.
2. 이동 시간·거리(구글 맵 기준)를 반영해 첫날·마지막 날을 현실적 일정으로 작성.
3. 하루 3~5개 장소 추천, 동선 최소화.
4. ${duration}일의 상세 일정 작성.
5. 오전/오후/저녁 단위 시간대별 활동 포함.
6. 동행자(${input.companions})와 여행 컨셉(${input.concepts.join(', ')})에 맞는 장소 선택.
7. 실현 가능한 일정만 작성.
8. 모든 장소는 구글 평점 3.0 이상.
9. **숙소, 공항, 역, 교통 이동 자체는 장소 리스트에 포함하지 말 것. (식당/카페/명소/관광스팟/쇼핑/액티비티 등만 포함)** 
10. 각 장소는 반드시 다음 형식을 포함할 것:

장소 정보 필드:
- location: string
- placeSearchQuery: string (구글 Places / Maps에서 검색하기 좋은 형태로, "장소명 + 지역명" 형식 예: "스타벅스 홍대입구역점, Seoul")
- categories: string[]  (식당, 명소, 핫플, 관광스팟, 카페, 쇼핑, 액티비티)
- rating: number (예: 4.3)
- operatingHours: string ("10:00~17:00" or "정보없음")
- travelTime: string ("28분" 형식) — 마지막 장소는 제외
- coordinates: { latitude: null, longitude: null }  
  (이 단계에서는 절대 임의의 좌표를 생성하지 말고 **항상 null** 로 두세요.  
  실제 좌표는 서버에서 구글 Places API를 사용해 채웁니다.)
- description: string

동선 계획 원칙:
- 이동 최소화
- 운영 시간 고려
- 구글 맵 기준 이동 시간 반영

절대 포함하지 말 것:
- 숙소(호텔, 펜션, 게스트하우스, 리조트)
- 공항/역 정보
- 교통편 설명(비행기, 열차, 버스 등)

---

출력 형식 규칙 (반드시 지킬 것)
- 반드시 아래 JSON 형식 그대로 출력
- JSON 외 텍스트 금지
- null, undefined 대신 빈 문자열 또는 적절한 값 제공 (단, coordinates는 명시적으로 null 사용)
- 모든 날짜는 ISO 포맷 유지

---

출력 JSON 형식:

{
  "recommendedPlaces": ["장소1", "장소2", "장소3"],
  "schedule": [
    {
      "day": 1,
      "date": "${input.dates.startDate}",
      "activities": [
        {
          "time": "09:00-12:00",
          "location": "장소명",
          "placeSearchQuery": "장소명 + 지역명 형태의 검색용 문자열",
          "categories": ["식당", "핫플"],
          "rating": 4.4,
          "operatingHours": "10:00~17:00",
          "travelTime": "28분",
          "coordinates": {
            "latitude": null,
            "longitude": null
          },
          "description": "설명"
        }
      ]
    }
  ],
  "summary": "전체 요약 설명"
}

---

최종 출력은 반드시 위 JSON 구조만 포함해야 합니다.  
JSON 외 텍스트, 마크다운, 설명 문장 포함 시 잘못된 출력입니다.
`;
}
