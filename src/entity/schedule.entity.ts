import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../common/entity/base.entity';

@Entity({ name: 'schedule' })
export class ScheduleEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'int',
    comment: '워크스페이스 ID FK) Workspace.id',
  })
  workspaceId: number;

  @Column({
    type: 'text',
    comment: '일정 본문(JSON 문자열)',
  })
  schedule: string;
}
