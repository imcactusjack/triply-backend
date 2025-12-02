import { Module } from '@nestjs/common';
import { ScheduleController } from './api/schedule.controller';
import { ScheduleService } from './application/schedule.service';
import { LLMModule } from '../infrastructure/llm/llm.module';

@Module({
  imports: [LLMModule],
  controllers: [ScheduleController],
  providers: [ScheduleService],
})
export class ScheduleModule {}
