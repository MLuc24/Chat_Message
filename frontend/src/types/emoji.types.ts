// Emoji Types
export interface Emoji {
  emoji: string;
  name: string;
  keywords: string[];
}

export interface EmojiCategory {
  id: string;
  name: string;
  icon: string;
  emojis: Emoji[];
}

export type EmojiCategoryId = 
  | 'smileys' 
  | 'people' 
  | 'animals' 
  | 'food' 
  | 'travel' 
  | 'activities' 
  | 'objects' 
  | 'symbols' 
  | 'flags';
