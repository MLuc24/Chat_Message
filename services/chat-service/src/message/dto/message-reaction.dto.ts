// Message Reaction Response DTO

import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class MessageReactionDto {
  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Expose()
  id: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Expose()
  messageId: string;

  @ApiProperty({ example: '550e8400-e29b-41d4-a716-446655440000' })
  @Expose()
  userId: string;

  @ApiProperty({ example: '❤️' })
  @Expose()
  emoji: string;

  @ApiProperty({ example: '2024-12-24T10:00:00Z' })
  @Expose()
  createdAt: Date;

  constructor(partial: Partial<MessageReactionDto>) {
    Object.assign(this, partial);
  }
}
