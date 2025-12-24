import { IsString, IsNotEmpty, MaxLength } from 'class-validator';

export class SetNicknameDto {
  @IsString()
  @IsNotEmpty()
  targetUserId: string;

  @IsString()
  @MaxLength(50)
  nickname: string;
}

export class NicknameResponseDto {
  id: string;
  conversationId: string;
  userId: string;
  targetUserId: string;
  nickname: string;
  createdAt: Date;
  updatedAt: Date;
}
