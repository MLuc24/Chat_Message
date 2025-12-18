import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for generating signed upload parameters
 */
export class GenerateUploadSignatureDto {
  @ApiProperty({
    description: 'Upload type (avatar, chat_image, chat_video)',
    example: 'chat_image',
    enum: ['avatar', 'chat_image', 'chat_video'],
  })
  @IsString()
  uploadType: 'avatar' | 'chat_image' | 'chat_video';

  @ApiPropertyOptional({
    description: 'Optional public ID for the uploaded file',
    example: 'conversation_123_img_456',
  })
  @IsOptional()
  @IsString()
  publicId?: string;
}

/**
 * Response DTO containing signed upload parameters
 */
export class UploadSignatureResponseDto {
  @ApiProperty({
    description: 'Cloudinary API key',
    example: '123456789012345',
  })
  apiKey: string;

  @ApiProperty({
    description: 'Upload signature',
    example: 'a1b2c3d4e5f6...',
  })
  signature: string;

  @ApiProperty({
    description: 'Timestamp for the signature',
    example: 1640000000,
  })
  timestamp: number;

  @ApiProperty({
    description: 'Cloudinary cloud name',
    example: 'my-cloud',
  })
  cloudName: string;

  @ApiProperty({
    description: 'Upload folder path',
    example: 'chat-app/messages/images',
  })
  folder: string;

  @ApiProperty({
    description: 'Upload URL',
    example: 'https://api.cloudinary.com/v1_1/my-cloud/image/upload',
  })
  uploadUrl: string;

  @ApiPropertyOptional({
    description: 'Optional public ID',
  })
  publicId?: string;

  @ApiProperty({
    description: 'Upload preset transformations',
  })
  transformation?: string;
}

/**
 * DTO for media URL response
 */
export class MediaUrlDto {
  @ApiProperty({
    description: 'Public URL of the uploaded media',
    example: 'https://res.cloudinary.com/my-cloud/image/upload/v1234567890/chat-app/messages/images/msg_123.jpg',
  })
  url: string;

  @ApiProperty({
    description: 'Secure HTTPS URL of the uploaded media',
    example: 'https://res.cloudinary.com/my-cloud/image/upload/v1234567890/chat-app/messages/images/msg_123.jpg',
  })
  secureUrl: string;

  @ApiProperty({
    description: 'Public ID of the uploaded media',
    example: 'chat-app/messages/images/msg_123',
  })
  publicId: string;

  @ApiProperty({
    description: 'Media format',
    example: 'jpg',
  })
  format: string;

  @ApiProperty({
    description: 'Media width in pixels',
    example: 1920,
  })
  width: number;

  @ApiProperty({
    description: 'Media height in pixels',
    example: 1080,
  })
  height: number;

  @ApiPropertyOptional({
    description: 'Media duration in seconds (for videos)',
    example: 120.5,
  })
  duration?: number;
}
