import { http } from '../http';
import type { Theme, ThemePreference } from '@/types/theme.types';

export interface SaveThemePreferenceDto {
  themeId: string;
}

class ThemeService {
  private readonly basePath = '/users';
  
  /**
   * Get all available themes
   */
  async getThemes(): Promise<Theme[]> {
    const { data } = await http.get('/themes');
    return data;
  }
  
  /**
   * Get user's current theme preference
   */
  async getUserThemePreference(): Promise<ThemePreference | null> {
    try {
      const { data } = await http.get(`${this.basePath}/me/theme`);
      return data;
    } catch {
      // If user has no preference, return null
      return null;
    }
  }
  
  /**
   * Save user's theme preference
   */
  async saveThemePreference(dto: SaveThemePreferenceDto): Promise<ThemePreference> {
    const { data } = await http.put(`${this.basePath}/me/theme`, dto);
    return data;
  }
  
  /**
   * Delete user's theme preference (reset to default)
   */
  async deleteThemePreference(): Promise<void> {
    await http.delete(`${this.basePath}/me/theme`);
  }
}

export const themeService = new ThemeService();
