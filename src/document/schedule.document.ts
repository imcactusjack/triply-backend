import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';
import { BaseDocument } from '../common/document/base.document';

export type ScheduleDocument = HydratedDocument<Schedule>;

// Activity 스키마 (여행 활동)
const ActivitySchema = new MongooseSchema(
  {
    time: { type: String, required: true, comment: '시간대 ex) 09:00-12:00' },
    location: { type: String, required: true, comment: '장소명' },
    category: {
      type: String,
      required: true,
      comment: '카테고리 ex) 식당, 명소, 핫플, 관광스팟, 카페, 쇼핑, 액티비티 등',
    },
    rating: { type: Number, required: false, comment: '구글 리뷰 별점 ex) 0.0 ~ 5.0' },
    operatingHours: { type: String, required: false, comment: '운영 시간 ex) 10:00~17:00' },
    travelTime: { type: String, required: false, comment: '다음 장소까지 이동 시간 ex) 28분' },
    description: {
      type: String,
      required: false,
      comment: '장소에 대한 설명 ex) 좋은 식당, 명소, 핫플, 관광스팟, 카페, 쇼핑, 액티비티 등',
    },
    // 구글맵 좌표 정보
    coordinates: {
      latitude: { type: Number, required: false, comment: '위도 (latitude)' },
      longitude: { type: Number, required: false, comment: '경도 (longitude)' },
    },
    // GeoJSON 형식 (MongoDB 지리 공간 쿼리용, 선택사항)
    locationGeoJson: {
      type: { type: String, enum: ['Point'], required: false, comment: 'GeoJSON 타입' },
      coordinates: { type: [Number], required: false, comment: 'GeoJSON 좌표 [longitude, latitude]' },
    },
  },
  { _id: false },
);

// DayPlan 스키마 (여행 일정)
const DayPlanSchema = new MongooseSchema(
  {
    day: { type: Number, required: true, comment: '일차' },
    date: { type: String, required: true, comment: '날짜 ex) yyyy-MM-dd' },
    activities: { type: [ActivitySchema], required: true, default: [], comment: '활동 목록' },
  },
  { _id: false },
);

@Schema({ collection: 'schedule', timestamps: true })
export class Schedule extends BaseDocument {
  @Prop({ required: true, ref: 'Workspace', comment: '워크스페이스 ID(WorkspaceDocument.id)' })
  workspaceId: string;

  @Prop({
    type: String,
    required: true,
    enum: ['ai_generated', 'user_custom'],
    comment: '생성 타입: ai_generated(AI 추천), user_custom(유저 커스텀)',
  })
  type: 'ai_generated' | 'user_custom';

  @Prop({ type: [String], required: false, default: [], comment: '추천 여행지 목록' })
  recommendedDestinations: string[];

  @Prop({ type: [DayPlanSchema], required: true, default: [], comment: '일정 (Day 1 ~ N)' })
  schedule: Array<{
    day: number;
    date: string;
    activities: Array<{
      time: string;
      location: string;
      category: string;
      rating?: number;
      operatingHours?: string;
      travelTime?: string;
      description?: string;
      coordinates?: {
        latitude: number;
        longitude: number;
      };
      locationGeoJson?: {
        type: 'Point';
        coordinates: [number, number];
      };
    }>;
  }>;

  // AI 생성인 경우 원본 입력 정보 저장
  @Prop({ type: MongooseSchema.Types.Mixed, required: false, comment: 'AI 생성 시 원본 입력 정보' })
  originalInput?: {
    departure: string;
    destination: string;
    companions: string;
    dates: {
      startDate: string;
      endDate: string;
    };
    concept: string;
    preferences?: string;
  };
}

export const ScheduleSchema = SchemaFactory.createForClass(Schedule);
