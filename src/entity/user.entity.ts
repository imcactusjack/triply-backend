import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { BaseEntity } from '../common/entity/base.entity';
import { AuthProvider } from '../common/domain/enum/auth.provider';

@Entity({ name: 'users' })
export class UserEntity extends BaseEntity {
  @PrimaryGeneratedColumn()
  id: string;

  @Column({
    type: 'enum',
    comment: 'oauth 제공자 ex) GOOGLE: 구글, KAKAO: 카카오, NAVER: 네이버',
    enum: AuthProvider,
    nullable: true,
  })
  provider?: AuthProvider;

  @Column({
    type: 'varchar',
    comment: '소셜 제공자가 제공하는 유저 고유 social id',
    length: 255,
    nullable: true,
    unique: true,
  })
  socialId: string | null;

  @Column({
    type: 'varchar',
    comment: '유저 이메일',
    length: 255,
    nullable: true,
  })
  email: string | null;

  @Column({
    type: 'varchar',
    length: 500,
    comment: '비밀번호',
    nullable: true,
  })
  password?: string | null;

  @Column({
    type: 'varchar',
    comment: '유저 이름',
    length: 100,
  })
  name: string;
}
