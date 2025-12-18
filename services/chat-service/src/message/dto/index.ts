import { IsString, IsIn, IsOptional, IsNumber, IsUrl } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendMessageDto {
  @ApiProperty({
    description: 'Message type',
    example: 'text',
    enum: ['text', 'image', 'video', 'file', 'audio'],
  })
  @IsString()
  @IsIn(['text', 'image', 'video', 'file', 'audio'])
  type: string;

  @ApiPropertyOptional({
    description: 'Message text content',
    example: 'Hello world!',
  })
  @IsOptional()
  @IsString()
  text?: string;

  @ApiPropertyOptional({
    description: 'Media URL (for image/video/file messages)',
    example: 'https://res.cloudinary.com/my-cloud/image/upload/v123/chat-app/messages/images/msg_123.jpg',
  })
  @IsOptional()
  @IsUrl()
  mediaUrl?: string;

  @ApiPropertyOptional({
    description: 'Media public ID from Cloudinary',
    example: 'chat-app/messages/images/msg_123',
  })
  @IsOptional()
  @IsString()
  mediaPublicId?: string;

  @ApiPropertyOptional({
    description: 'Media thumbnail URL (for videos)',
    example: 'https://res.cloudinary.com/my-cloud/video/upload/so_0/chat-app/messages/videos/video_123.jpg',
  })
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;

  @ApiPropertyOptional({
    description: 'Media width in pixels',
    example: 1920,
  })
  @IsOptional()
  @IsNumber()
  mediaWidth?: number;

  @ApiPropertyOptional({
    description: 'Media height in pixels',
    example: 1080,
  })
  @IsOptional()
  @IsNumber()
  mediaHeight?: number;

  @ApiPropertyOptional({
    description: 'Media duration in seconds (for videos)',
    example: 120.5,
  })
  @IsOptional()
  @IsNumber()
  mediaDuration?: number;
}

export class UpdateMessageDto {
  @IsString()
  text: string;
}
