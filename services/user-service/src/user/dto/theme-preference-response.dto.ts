import { ApiProperty } from '@nestjs/swagger';

export class ThemePreferenceResponseDto {
  @ApiProperty({
    description: 'ID của user',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  userId: string;

  @ApiProperty({
    description: 'ID của theme đang sử dụng',
    example: 'summer',
  })
  themeId: string;

  @ApiProperty({
    description: 'Thời gian áp dụng theme',
    example: '2024-01-20T10:30:00.000Z',
  })
  appliedAt: Date;
}
