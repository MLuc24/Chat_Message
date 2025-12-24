import { IsString, IsArray, IsOptional, IsIn } from 'class-validator';

export class CreateConversationDto {
  @IsString()
  @IsIn(['direct', 'group'])
  type: string;

  @IsArray()
  @IsString({ each: true })
  participantIds: string[];

  @IsOptional()
  @IsString()
  name?: string;
}

export class UpdateConversationDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  themeId?: string;
}

export class AddMemberDto {
  @IsString()
  userId: string;
}
