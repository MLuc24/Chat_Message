import { IsString, IsIn, IsOptional, IsNumber, IsUrl, ValidateNested, IsObject, IsArray, ArrayMaxSize } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class MediaItemDto {
  @ApiProperty({
    description: 'Media URL from Cloudinary',
    example: 'https://res.cloudinary.com/my-cloud/image/upload/v123/chat-app/messages/images/msg_123.jpg',
  })
  @IsUrl()
  url: string;

  @ApiProperty({
    description: 'Media type',
    example: 'image',
    enum: ['image', 'video'],
  })
  @IsString()
  @IsIn(['image', 'video'])
  type: string;

  @ApiProperty({
    description: 'Media public ID from Cloudinary',
    example: 'chat-app/messages/images/msg_123',
  })
  @IsString()
  publicId: string;

  @ApiPropertyOptional({
    description: 'Media width in pixels',
    example: 1920,
  })
  @IsOptional()
  @IsNumber()
  width?: number;

  @ApiPropertyOptional({
    description: 'Media height in pixels',
    example: 1080,
  })
  @IsOptional()
  @IsNumber()
  height?: number;

  @ApiPropertyOptional({
    description: 'Media duration in seconds (for videos)',
    example: 120.5,
  })
  @IsOptional()
  @IsNumber()
  duration?: number;

  @ApiPropertyOptional({
    description: 'Media thumbnail URL (for videos)',
    example: 'https://res.cloudinary.com/my-cloud/video/upload/so_0/chat-app/messages/videos/video_123.jpg',
  })
  @IsOptional()
  @IsUrl()
  thumbnailUrl?: string;
}

class LocationDto {
  @ApiProperty({ description: 'Latitude', example: 21.028511 })
  @IsNumber()
  latitude: number;

  @ApiProperty({ description: 'Longitude', example: 105.804817 })
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ description: 'Accuracy in meters', example: 10 })
  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @ApiPropertyOptional({ description: 'Address', example: 'Hanoi, Vietnam' })
  @IsOptional()
  @IsString()
  address?: string;
}

export class SendMessageDto {
  @ApiProperty({
    description: 'Message type',
    example: 'text',
    enum: ['text', 'image', 'video', 'file', 'audio', 'location', 'media_group'],
  })
  @IsString()
  @IsIn(['text', 'image', 'video', 'file', 'audio', 'location', 'media_group'])
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
    description: 'Media duration in seconds (for videos/audio)',
    example: 120.5,
  })
  @IsOptional()
  @IsNumber()
  mediaDuration?: number;

  @ApiPropertyOptional({
    description: 'File URL (for file messages)',
    example: 'https://res.cloudinary.com/my-cloud/raw/upload/v123/chat-app/messages/documents/doc_123.pdf',
  })
  @IsOptional()
  @IsUrl()
  fileUrl?: string;

  @ApiPropertyOptional({
    description: 'File name',
    example: 'document.pdf',
  })
  @IsOptional()
  @IsString()
  fileName?: string;

  @ApiPropertyOptional({
    description: 'File size in bytes',
    example: 1024000,
  })
  @IsOptional()
  @IsNumber()
  fileSize?: number;

  @ApiPropertyOptional({
    description: 'File MIME type',
    example: 'application/pdf',
  })
  @IsOptional()
  @IsString()
  fileType?: string;

  @ApiPropertyOptional({
    description: 'Array of media items (for media_group messages)',
    type: [MediaItemDto],
    maxItems: 10,
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10, { message: 'Maximum 10 media items allowed' })
  @ValidateNested({ each: true })
  @Type(() => MediaItemDto)
  mediaItems?: MediaItemDto[];

  @ApiPropertyOptional({
    description: 'Location data (for location messages)',
    type: LocationDto,
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;
}

export class UpdateMessageDto {
  @IsString()
  text: string;
}
