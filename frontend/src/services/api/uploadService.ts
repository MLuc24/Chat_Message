/**
 * Upload Service
 * Handles direct upload to Cloudinary with progress tracking
 * 
 * Architecture:
 * 1. Get signed upload params from backend
 * 2. Upload directly to Cloudinary (faster, reduces backend load)
 * 3. Send result back to backend to save metadata
 */

import axios, { type AxiosProgressEvent } from 'axios';
import { http } from '../http';

export interface UploadSignatureParams {
  uploadType: 'avatar' | 'chat_image' | 'chat_video' | 'chat_audio';
  publicId?: string;
}

export interface UploadSignature {
  apiKey: string;
  signature: string;
  timestamp: number;
  cloudName: string;
  folder: string;
  uploadUrl: string;
  publicId?: string;
  transformation?: string;
}

export interface UploadResult {
  url: string;
  secureUrl: string;
  publicId: string;
  format: string;
  width: number;
  height: number;
  duration?: number;
  thumbnailUrl?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

/**
 * Upload Service Class
 */
class UploadService {
  /**
   * Get signed upload parameters from backend
   * @param params Upload signature parameters
   * @param serviceUrl Base URL of the service (user-service or chat-service)
   * @returns Signed upload parameters
   */
  async getUploadSignature(
    params: UploadSignatureParams,
    serviceUrl: string = '/api/users',
  ): Promise<UploadSignature> {
    const { data } = await http.post<UploadSignature>(
      `${serviceUrl}/upload/signature`,
      params,
    );
    return data;
  }

  /**
   * Upload Blob (for audio/voice recordings) directly to Cloudinary
   * @param blob Blob to upload
   * @param signature Signed upload parameters
   * @param onProgress Progress callback
   * @returns Upload result
   */
  async uploadBlobToCloudinary(
    blob: Blob,
    signature: UploadSignature,
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<UploadResult> {
    // Build form data
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('api_key', signature.apiKey);
    formData.append('timestamp', signature.timestamp.toString());
    formData.append('signature', signature.signature);
    formData.append('folder', signature.folder);
    formData.append('resource_type', 'auto'); // Auto-detect resource type

    if (signature.publicId) {
      formData.append('public_id', signature.publicId);
    }

    if (signature.transformation) {
      formData.append('transformation', signature.transformation);
    }

    // Upload directly to Cloudinary
    const { data } = await axios.post(signature.uploadUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentage = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage,
          });
        }
      },
    });

    return {
      url: data.url,
      secureUrl: data.secure_url,
      publicId: data.public_id,
      format: data.format,
      width: data.width || 0,
      height: data.height || 0,
      duration: data.duration,
    };
  }

  /**
   * Upload file directly to Cloudinary
   * @param file File to upload
   * @param signature Signed upload parameters
   * @param onProgress Progress callback
   * @returns Upload result
   */
  async uploadToCloudinary(
    file: File,
    signature: UploadSignature,
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<UploadResult> {
    // Build form data
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', signature.apiKey);
    formData.append('timestamp', signature.timestamp.toString());
    formData.append('signature', signature.signature);
    formData.append('folder', signature.folder);

    if (signature.publicId) {
      formData.append('public_id', signature.publicId);
    }

    if (signature.transformation) {
      formData.append('transformation', signature.transformation);
    }

    // Upload directly to Cloudinary
    const { data } = await axios.post(signature.uploadUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent: AxiosProgressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentage = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage,
          });
        }
      },
    });

    // Extract thumbnail URL for videos
    let thumbnailUrl: string | undefined;
    if (data.resource_type === 'video') {
      thumbnailUrl = data.secure_url.replace(
        '/video/upload/',
        '/video/upload/so_0,w_640,h_360,c_fill,f_jpg/',
      );
    }

    return {
      url: data.url,
      secureUrl: data.secure_url,
      publicId: data.public_id,
      format: data.format,
      width: data.width,
      height: data.height,
      duration: data.duration,
      thumbnailUrl,
    };
  }

  /**
   * Complete upload flow for files: get signature -> upload -> return result
   * @param file File to upload
   * @param uploadType Upload type
   * @param serviceUrl Service URL
   * @param onProgress Progress callback
   * @returns Upload result
   */
  async upload(
    file: File,
    uploadType: 'avatar' | 'chat_image' | 'chat_video',
    serviceUrl: string = '/api/users',
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<UploadResult> {
    // Validate file
    this.validateFile(file, uploadType);

    // Get signed upload params
    const signature = await this.getUploadSignature({ uploadType }, serviceUrl);

    // Upload to Cloudinary
    const result = await this.uploadToCloudinary(file, signature, onProgress);

    return result;
  }

  /**
   * Complete upload flow for Blob (audio): get signature -> upload -> return result
   * @param blob Blob to upload
   * @param uploadType Upload type (should be 'audio')
   * @param serviceUrl Service URL
   * @param onProgress Progress callback
   * @returns Upload result
   */
  async uploadFile(
    blob: Blob,
    uploadType: 'audio',
    serviceUrl: string = '/api/chat',
    onProgress?: (progress: UploadProgress) => void,
  ): Promise<UploadResult> {
    // Get signed upload params
    const signature = await this.getUploadSignature(
      { uploadType: 'chat_audio' },
      serviceUrl
    );

    // Upload to Cloudinary
    const result = await this.uploadBlobToCloudinary(blob, signature, onProgress);

    return result;
  }

  /**
   * Validate file before upload
   * @param file File to validate
   * @param uploadType Upload type
   */
  private validateFile(
    file: File,
    uploadType: 'avatar' | 'chat_image' | 'chat_video',
  ): void {
    const maxSizes = {
      avatar: 5 * 1024 * 1024, // 5MB
      chat_image: 10 * 1024 * 1024, // 10MB
      chat_video: 50 * 1024 * 1024, // 50MB
    };

    const allowedFormats = {
      avatar: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      chat_image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
      chat_video: ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'],
    };

    // Check file size
    if (file.size > maxSizes[uploadType]) {
      throw new Error(
        `File size exceeds maximum allowed: ${maxSizes[uploadType] / 1024 / 1024}MB`,
      );
    }

    // Check file type
    if (!allowedFormats[uploadType].includes(file.type)) {
      throw new Error(`File type not allowed: ${file.type}`);
    }
  }

  /**
   * Get optimized image URL
   * @param publicId Cloudinary public ID
   * @param cloudName Cloud name
   * @param options Transformation options
   * @returns Optimized image URL
   */
  getOptimizedImageUrl(
    publicId: string,
    cloudName: string,
    options?: {
      width?: number;
      height?: number;
      crop?: string;
      quality?: string;
    },
  ): string {
    const transformations = [];
    
    if (options?.width || options?.height) {
      const w = options.width ? `w_${options.width}` : '';
      const h = options.height ? `h_${options.height}` : '';
      const c = options.crop ? `c_${options.crop}` : 'c_fill';
      transformations.push([w, h, c].filter(Boolean).join(','));
    }

    if (options?.quality) {
      transformations.push(`q_${options.quality}`);
    } else {
      transformations.push('q_auto');
    }

    transformations.push('f_auto');

    const transformation = transformations.join('/');
    return `https://res.cloudinary.com/${cloudName}/image/upload/${transformation}/${publicId}`;
  }

  /**
   * Get video thumbnail URL
   * @param publicId Video public ID
   * @param cloudName Cloud name
   * @param options Thumbnail options
   * @returns Thumbnail URL
   */
  getVideoThumbnailUrl(
    publicId: string,
    cloudName: string,
    options?: {
      width?: number;
      height?: number;
      time?: number; // Time offset in seconds
    },
  ): string {
    const w = options?.width || 640;
    const h = options?.height || 360;
    const so = options?.time !== undefined ? `so_${options.time}` : 'so_0';
    
    return `https://res.cloudinary.com/${cloudName}/video/upload/${so},w_${w},h_${h},c_fill,f_jpg/${publicId}.jpg`;
  }
}

export const uploadService = new UploadService();
