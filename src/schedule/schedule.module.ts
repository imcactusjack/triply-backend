import { Module } from '@nestjs/common';
import { ScheduleController } from './api/schedule.controller';
import { ScheduleService } from './application/schedule.service';
import { LLMModule } from '../infrastructure/llm/llm.module';
import { PlacesModule } from '../infrastructure/places/places.module';

@Module({
  imports: [LLMModule, PlacesModule],
  controllers: [ScheduleController],
  providers: [ScheduleService],
})
export class ScheduleModule {}
