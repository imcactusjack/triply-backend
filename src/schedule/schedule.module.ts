import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleController } from './api/schedule.controller';
import { ScheduleService } from './application/schedule.service';
import { LLMModule } from '../infrastructure/llm/llm.module';
import { PlacesModule } from '../infrastructure/places/places.module';
import { AuthModule } from '../auth/auth.module';
import { WorkspaceEntity } from '../entity/workspace.entity';
import { ScheduleEntity } from '../entity/schedule.entity';

@Module({
  imports: [AuthModule, LLMModule, PlacesModule, TypeOrmModule.forFeature([WorkspaceEntity, ScheduleEntity])],
  controllers: [ScheduleController],
  providers: [ScheduleService],
})
export class ScheduleModule {}
