/**
 * Cloudinary Configuration
 * Manages Cloudinary SDK setup and provides utility functions
 */

import { v2 as cloudinary } from 'cloudinary';
import { ConfigService } from '@nestjs/config';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class CloudinaryConfig {
  private readonly logger = new Logger(CloudinaryConfig.name);

  constructor(private readonly configService: ConfigService) {
    this.initCloudinary();
  }

  private initCloudinary(): void {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      this.logger.warn('Cloudinary credentials not configured');
      return;
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true,
    });

    this.logger.log('Cloudinary initialized successfully');
  }

  getCloudinary() {
    return cloudinary;
  }
}

// Upload options for different media types
export const UPLOAD_OPTIONS = {
  AVATAR: {
    folder: 'chat-app/avatars',
    transformation: [
      { width: 500, height: 500, crop: 'fill', gravity: 'face' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
    ],
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    max_file_size: 5 * 1024 * 1024, // 5MB
  },
  CHAT_IMAGE: {
    folder: 'chat-app/messages/images',
    transformation: [
      { width: 1920, height: 1080, crop: 'limit' },
      { quality: 'auto:good' },
      { fetch_format: 'auto' },
    ],
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    max_file_size: 10 * 1024 * 1024, // 10MB
  },
  CHAT_VIDEO: {
    folder: 'chat-app/messages/videos',
    resource_type: 'video',
    transformation: [
      { width: 1280, height: 720, crop: 'limit' },
      { quality: 'auto:good' },
    ],
    allowed_formats: ['mp4', 'mov', 'avi', 'webm'],
    max_file_size: 50 * 1024 * 1024, // 50MB
  },
} as const;
