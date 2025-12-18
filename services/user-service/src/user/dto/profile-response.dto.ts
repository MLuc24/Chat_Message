import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

export class ProfileResponseDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User unique identifier',
  })
  @Expose()
  id: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email address',
  })
  @Expose()
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'User full name',
  })
  @Expose()
  name: string;

  @ApiPropertyOptional({
    example: 'Software Developer passionate about building great products',
    description: 'User bio/description',
  })
  @Expose()
  bio?: string;

  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/demo/image/upload/v1234567890/avatars/user123.jpg',
    description: 'User avatar URL',
  })
  @Expose()
  avatarUrl?: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00Z',
    description: 'Account creation timestamp',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'Last update timestamp',
  })
  @Expose()
  updatedAt: Date;

  @Exclude()
  avatarPublicId?: string;

  constructor(partial: Partial<ProfileResponseDto>) {
    Object.assign(this, partial);
  }
}
