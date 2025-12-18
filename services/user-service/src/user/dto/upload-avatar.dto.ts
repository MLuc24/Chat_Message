import { ApiProperty } from '@nestjs/swagger';

export class UploadAvatarDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Avatar image file (max 5MB, allowed: jpg, jpeg, png)',
  })
  file: Express.Multer.File;
}
