import { IsString, IsIn, IsOptional } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsIn(['text', 'image', 'video', 'file', 'audio'])
  type: string;

  @IsOptional()
  @IsString()
  text?: string;
}

export class UpdateMessageDto {
  @IsString()
  text: string;
}
