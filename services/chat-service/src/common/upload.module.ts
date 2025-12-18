import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryConfig } from './config/cloudinary.config';
import { UploadService } from './services/upload.service';

/**
 * Upload Module
 * Global module for handling media uploads via Cloudinary
 * Exported as Global to be used across all services
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [CloudinaryConfig, UploadService],
  exports: [UploadService],
})
export class UploadModule {}
