import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SaveThemePreferenceDto {
  @ApiProperty({
    description: 'ID của theme muốn áp dụng',
    example: 'summer',
  })
  @IsString()
  @IsNotEmpty()
  themeId: string;
}
