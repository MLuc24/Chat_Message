import { IsBoolean, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateConversationSettingsDto {
  @ApiPropertyOptional({ description: 'Mute notifications for this conversation' })
  @IsBoolean()
  @IsOptional()
  mute?: boolean;

  @ApiPropertyOptional({ description: 'Enable sound for notifications' })
  @IsBoolean()
  @IsOptional()
  sound?: boolean;

  @ApiPropertyOptional({ description: 'Enable pop-up notifications' })
  @IsBoolean()
  @IsOptional()
  popups?: boolean;

  @ApiPropertyOptional({ description: 'Hide conversation from list' })
  @IsBoolean()
  @IsOptional()
  hide?: boolean;

  @ApiPropertyOptional({ description: 'Default emoji for quick reactions', example: '👍' })
  @IsString()
  @IsOptional()
  defaultEmoji?: string;
}
