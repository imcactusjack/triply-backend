import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseDocument } from '../common/document/base.document';

export type WorkspaceDocument = HydratedDocument<Workspace>;

@Schema({ collection: 'workspace', timestamps: true })
export class Workspace extends BaseDocument {
  @Prop({ required: true, maxlength: 100, comment: '워크스페이스 이름' })
  name: string;

  @Prop({ required: true, ref: 'User', comment: '워크스페이스 개설한 유저 ID(UserDocument.id)' })
  ownerId: string;

  @Prop({ required: true, array: true, ref: 'User', comment: '워크스페이스 참여 유저 ID(UserDocument.id)' })
  memberUserIds: string[];
}

export const WorkspaceSchema = SchemaFactory.createForClass(Workspace);
