import { Inject, Injectable } from '@nestjs/common';
import { LLMClient, TravelPlanLLMInput } from '../../infrastructure/llm/interface/llm.client';
import { ScheduleRecommendReqDto } from '../api/schedule.req.dto';
import { ScheduleRecommendResDto } from '../api/schedule.res.dto';

@Injectable()
export class ScheduleService {
  constructor(@Inject('ILlmClient') private llmClient: LLMClient) {}

  async recommendSchedule(input: ScheduleRecommendReqDto): Promise<ScheduleRecommendResDto> {
    const llmInput: TravelPlanLLMInput = {
      departure: input.departure,
      destination: input.destination,
      companions: input.companions,
      dates: {
        startDate: input.dates.startDate,
        endDate: input.dates.endDate,
      },
      concept: input.concept,
      preferences: input.preferences,
    };

    const result = await this.llmClient.generateTravelPlan(llmInput);

    return {
      recommendedDestinations: result.recommendedPlaces || [],
      schedule: result.schedule || [],
      summary: result.summary || '',
    };
  }
}
