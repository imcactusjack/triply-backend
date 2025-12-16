import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { LLMClient, TravelPlanLLMResponse } from './interface/llm.client';
import { TravelDayPlan, TravelPlanLLMInput } from '../interface/travel.plan.type';
import { buildTravelPlanPrompt } from './prompt/travel.plan.prompt';

@Injectable()
export class GeminiClient implements LLMClient {
  private readonly logger = new Logger('GEMINI');
  private client: GoogleGenAI;
  private model: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.getOrThrow<string>('GEMINI_API_KEY');
    this.model = this.configService.get<string>('GEMINI_MODEL') || 'gemini-2.5-flash';

    this.client = new GoogleGenAI({
      apiKey,
    });
  }

  async generateTravelPlan(input: TravelPlanLLMInput): Promise<TravelPlanLLMResponse> {
    // 1. Input 값 로그
    this.logger.log('=== 여행 일정 생성 시작 ===');
    this.logger.log(`[INPUT] ${JSON.stringify(input, null, 2)}`);

    // 2. 프롬프트 생성
    const prompt = buildTravelPlanPrompt(input);
    this.logger.log(`[PROMPT] ${prompt}`);

    try {
      // 3. API 호출
      this.logger.log(`[API CALL] 모델: ${this.model}, API 호출 시작...`);
      const response = await this.client.models.generateContent({
        model: this.model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      // 4. API 응답 로그
      const responseText = response.text;
      this.logger.log(`[API RESPONSE] ${responseText}`);

      // 5. JSON 파싱
      this.logger.log('[PARSING] JSON 파싱 시작...');
      const parsedResponse = JSON.parse(responseText!);
      this.logger.log(`[PARSED RESPONSE] ${JSON.stringify(parsedResponse, null, 2)}`);

      // 6. 응답 정규화
      this.logger.log('[NORMALIZING] 응답 정규화 시작...');
      const result = this.parseTravelPlanResponse(parsedResponse, input);
      this.logger.log(`[FINAL RESULT] ${JSON.stringify(result, null, 2)}`);
      this.logger.log('=== 여행 일정 생성 완료 ===');

      return result;
    } catch (error) {
      this.logger.error(`[ERROR] 여행 일정 생성 중 오류 발생: ${error.message}`);
      this.logger.error(`[ERROR STACK] ${error.stack}`);
      throw new Error(`여행 일정 생성 중 오류가 발생했습니다: ${error.message}`);
    }
  }

  private parseTravelPlanResponse(parsedResponse: any, input: TravelPlanLLMInput): TravelPlanLLMResponse {
    // 응답 검증 및 파싱
    if (!parsedResponse.recommendedPlaces || !Array.isArray(parsedResponse.recommendedPlaces)) {
      throw new Error('추천 여행지 정보가 올바르지 않습니다.');
    }

    if (!parsedResponse.schedule || !Array.isArray(parsedResponse.schedule)) {
      throw new Error('일정 정보가 올바르지 않습니다.');
    }

    // 날짜 배열 생성
    const dates = this.generateDateArray(input.startDate, input.endDate);
    const duration = dates.length;

    // 일정 데이터 정규화
    const schedule: TravelDayPlan[] = parsedResponse.schedule
      .map((dayPlan: any, index: number) => {
        if (index >= dates.length) {
          return null;
        }

        return {
          day: dayPlan.day ?? index + 1,
          date: dates[index] ?? dayPlan.date,
          activities: Array.isArray(dayPlan.activities)
            ? dayPlan.activities.map((activity: any, activityIndex: number) => {
                return {
                  order: activity.order ?? activityIndex,
                  activityStartTime: activity.activityStartTime,
                  activityEndTime: activity.activityEndTime,
                  location: activity.location,
                  placeSearchQuery: activity.placeSearchQuery ?? undefined,
                  categories: activity.categories ?? [],
                  travelTime: activity.travelTime,
                  description: activity.description ?? undefined,
                  coordinates: {
                    latitude: null,
                    longitude: null,
                  },
                };
              })
            : [],
        };
      })
      .filter((plan: TravelDayPlan | null) => plan !== null) as TravelDayPlan[];

    // 일정이 부족한 경우 빈 일정 추가
    while (schedule.length < duration) {
      const dayIndex = schedule.length;
      schedule.push({
        day: dayIndex + 1,
        date: dates[dayIndex] ?? '',
        activities: [],
      });
    }

    return {
      recommendedPlaces: parsedResponse.recommendedPlaces,
      schedule: schedule.slice(0, duration),
      summary: parsedResponse.summary,
    };
  }

  private generateDateArray(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    const currentDate = new Date(start);
    while (currentDate <= end) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }
}
