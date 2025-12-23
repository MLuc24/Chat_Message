import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CloudinaryConfig, UPLOAD_OPTIONS } from '../config/cloudinary.config';
import {
  GenerateUploadSignatureDto,
  UploadSignatureResponseDto,
  MediaUrlDto,
} from '../dto/upload.dto';

/**
 * Upload Service
 * Handles Cloudinary signed upload URL generation for direct client uploads
 * This approach is optimal as it:
 * 1. Reduces backend load (no file streaming through server)
 * 2. Faster uploads (direct to Cloudinary CDN)
 * 3. Better scalability
 */
@Injectable()
export class UploadService {
  private readonly logger = new Logger(UploadService.name);
  private readonly cloudinary;

  constructor(
    private readonly cloudinaryConfig: CloudinaryConfig,
    private readonly configService: ConfigService,
  ) {
    this.cloudinary = this.cloudinaryConfig.getCloudinary();
  }

  /**
   * Generate signed upload parameters for client-side direct upload
   * Client will use these parameters to upload directly to Cloudinary
   * 
   * @param dto - Upload signature generation parameters
   * @returns Signed upload parameters
   */
  async generateUploadSignature(
    dto: GenerateUploadSignatureDto,
  ): Promise<UploadSignatureResponseDto> {
    this.logger.debug(`Generating upload signature for type: ${dto.uploadType}`);

    const uploadOptions = this.getUploadOptions(dto.uploadType);
    const timestamp = Math.round(Date.now() / 1000);
    
    // Build upload parameters
    const params: Record<string, any> = {
      timestamp,
      folder: uploadOptions.folder,
    };

    // Add public_id if provided
    if (dto.publicId) {
      params.public_id = dto.publicId;
    }
    
    // Note: resource_type is determined by the upload URL endpoint (image/upload or video/upload)
    // We don't include it in signature params
    // Transformations will be applied by Cloudinary after upload based on folder settings

    // Generate signature
    const signature = this.cloudinary.utils.api_sign_request(
      params,
      this.configService.get<string>('CLOUDINARY_API_SECRET'),
    );

    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    // Determine resource type based on upload type
    let resourceType = 'image';
    if (dto.uploadType === 'chat_video' || dto.uploadType === 'chat_audio') {
      resourceType = 'video';
    } else if (dto.uploadType === 'chat_document') {
      resourceType = 'raw';
    }

    return {
      apiKey: this.configService.get<string>('CLOUDINARY_API_KEY'),
      signature,
      timestamp,
      cloudName,
      folder: uploadOptions.folder,
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      publicId: dto.publicId,
    };
  }

  /**
   * Validate uploaded media URL and extract metadata
   * Call this after client uploads to verify and store media info
   * 
   * @param publicId - Cloudinary public ID
   * @returns Media metadata
   */
  async validateUploadedMedia(publicId: string): Promise<MediaUrlDto> {
    this.logger.debug(`Validating uploaded media: ${publicId}`);

    try {
      // Get resource details from Cloudinary
      const resourceType = publicId.includes('videos') ? 'video' : 'image';
      const result = await this.cloudinary.api.resource(publicId, {
        resource_type: resourceType,
      });

      return {
        url: result.url,
        secureUrl: result.secure_url,
        publicId: result.public_id,
        format: result.format,
        width: result.width,
        height: result.height,
        duration: result.duration,
      };
    } catch (error) {
      this.logger.error(`Failed to validate media: ${error.message}`);
      throw new BadRequestException('Invalid media URL or public ID');
    }
  }

  /**
   * Delete media from Cloudinary
   * 
   * @param publicId - Cloudinary public ID
   */
  async deleteMedia(publicId: string): Promise<void> {
    this.logger.log(`Deleting media: ${publicId}`);

    try {
      const resourceType = publicId.includes('videos') ? 'video' : 'image';
      await this.cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType,
      });
      this.logger.log(`Media deleted successfully: ${publicId}`);
    } catch (error) {
      this.logger.error(`Failed to delete media: ${error.message}`);
      throw new BadRequestException('Failed to delete media');
    }
  }

  /**
   * Get upload options based on upload type
   */
  private getUploadOptions(uploadType: string) {
    switch (uploadType) {
      case 'avatar':
        return UPLOAD_OPTIONS.AVATAR;
      case 'chat_image':
        return UPLOAD_OPTIONS.CHAT_IMAGE;
      case 'chat_video':
        return UPLOAD_OPTIONS.CHAT_VIDEO;
      case 'chat_audio':
        return UPLOAD_OPTIONS.CHAT_AUDIO;
      case 'chat_document':
        return UPLOAD_OPTIONS.CHAT_DOCUMENT;
      default:
        throw new BadRequestException('Invalid upload type');
    }
  }

  /**
   * Get optimized image URL with transformations
   * Use this to generate thumbnail URLs, resized versions, etc.
   * 
   * @param publicId - Cloudinary public ID
   * @param options - Transformation options
   * @returns Optimized image URL
   */
  getOptimizedUrl(
    publicId: string,
    options?: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string;
      format?: string;
    },
  ): string {
    return this.cloudinary.url(publicId, {
      ...options,
      secure: true,
      fetch_format: options?.format || 'auto',
      quality: options?.quality || 'auto',
    });
  }

  /**
   * Get video thumbnail URL
   * 
   * @param publicId - Video public ID
   * @param options - Thumbnail options
   * @returns Thumbnail URL
   */
  getVideoThumbnail(
    publicId: string,
    options?: {
      width?: number;
      height?: number;
    },
  ): string {
    return this.cloudinary.url(publicId, {
      resource_type: 'video',
      format: 'jpg',
      width: options?.width || 640,
      height: options?.height || 360,
      crop: 'fill',
      secure: true,
    });
  }
}
