import { IApiResponse, IResponseMeta, IApiError } from '../interfaces/api-response.interface';

export class ApiResponseDto<T = any> implements IApiResponse<T> {
  success: boolean;
  data?: T;
  meta?: IResponseMeta;
  error?: IApiError;

  constructor(success: boolean, data?: T, meta?: IResponseMeta, error?: IApiError) {
    this.success = success;
    this.data = data;
    this.meta = meta;
    this.error = error;
  }

  static success<T>(data: T, meta?: IResponseMeta): ApiResponseDto<T> {
    return new ApiResponseDto(true, data, meta);
  }

  static error(code: string, message: string, details?: any): ApiResponseDto {
    return new ApiResponseDto(false, undefined, undefined, {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
    });
  }
}
