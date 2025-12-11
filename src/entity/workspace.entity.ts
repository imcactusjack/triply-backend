import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../common/entity/base.entity';

@Entity({ name: 'workspace' })
export class WorkspaceEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'varchar',
    comment: '워크스페이스 이름',
    length: 100,
  })
  name: string;

  @Column({
    type: 'varchar',
    comment: '워크스페이스 소유자 ID',
    length: 255,
  })
  ownerId: string;

  @Column({
    type: 'varchar',
    comment: '워크스페이스 멤버 사용자 ID 목록',
    nullable: true,
  })
  memberUserIds: string | null;
}
