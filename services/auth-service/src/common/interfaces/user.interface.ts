export interface IUser {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserPayload {
  sub: string;
  email: string;
  name: string;
  iat?: number;
  exp?: number;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface IAuthResponse {
  user: Omit<IUser, 'passwordHash'>;
  tokens: IAuthTokens;
}
