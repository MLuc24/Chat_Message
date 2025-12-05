import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: 'OldPassword123' })
  @IsString()
  currentPassword: string;

  @ApiProperty({ 
    example: 'NewPassword123',
    description: 'New password must be at least 8 characters with uppercase, lowercase, and number'
  })
  @IsString()
  @MinLength(8, { message: 'New password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'New password must contain uppercase, lowercase, and number',
  })
  newPassword: string;
}
