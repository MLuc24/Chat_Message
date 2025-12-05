export interface IApiResponse<T = any> {
  success: boolean;
  data?: T;
  meta?: IResponseMeta;
  error?: IApiError;
}

export interface IResponseMeta {
  page?: number;
  limit?: number;
  total?: number;
  hasMore?: boolean;
}

export interface IApiError {
  code: string;
  message: string;
  details?: any;
  timestamp?: string;
  path?: string;
}

export interface IPaginationParams {
  page?: number;
  limit?: number;
  cursor?: string;
}
