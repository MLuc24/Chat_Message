import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Themes')
@Controller('themes')
export class ThemeController {
  /**
   * Get all available themes
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ 
    summary: 'Get all available themes',
    description: 'Returns list of all predefined themes',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of themes',
  })
  async getAllThemes() {
    // Return predefined themes
    return [
      {
        id: 'default',
        name: 'Mặc định',
        description: 'Theme mặc định của ứng dụng',
      },
      {
        id: 'superhero',
        name: 'Siêu nhân',
        description: 'Theme năng động như siêu anh hùng',
      },
      {
        id: 'summer',
        name: 'The Summer I Turned Pretty',
        description: 'Theme mùa hè tươi mát',
        author: 'Mùa 3',
      },
      {
        id: 'ocean',
        name: 'Vậy nước',
        description: 'Theme đại dương sâu thẳm',
      },
      {
        id: 'heart-drive',
        name: 'Heart Drive',
        description: 'Theme lãng mạn và ấm áp',
        author: 'Tác phẩm của Digital Joy',
      },
      {
        id: 'autumn',
        name: 'Xúc cảm mùa hè',
        description: 'Theme ấm áp mùa thu',
        author: 'Tác phẩm của Thomas Burden',
      },
      {
        id: 'karol-g',
        name: 'Karol G',
        description: 'Theme sôi động và đầy màu sắc',
        author: 'Tropicoqueta',
      },
      {
        id: 'dark',
        name: 'Benson Boone',
        description: 'Theme tối hiện đại',
      },
    ];
  }
}
