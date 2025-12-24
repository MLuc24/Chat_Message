// Message Reaction DTOs

import { IsString, IsNotEmpty, MaxLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddReactionDto {
  @ApiProperty({
    example: '❤️',
    description: 'Unicode emoji (max 10 characters)',
    maxLength: 10,
  })
  @IsString()
  @IsNotEmpty({ message: 'Emoji is required' })
  @MaxLength(10, { message: 'Emoji must not exceed 10 characters' })
  @Matches(/[\p{Emoji_Presentation}\p{Emoji}\uFE0F\u200D]+/u, {
    message: 'Invalid emoji format',
  })
  emoji: string;
}
