// Chat-related types

import type { User } from './user.types';

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    text?: string;
    type: 'text' | 'image' | 'video' | 'file' | 'audio';
    
    // Media fields (for images/videos uploaded to Cloudinary)
    mediaUrl?: string;
    mediaPublicId?: string;
    thumbnailUrl?: string; // For videos
    mediaWidth?: number;
    mediaHeight?: number;
    mediaDuration?: number; // For videos/audio (in seconds)
    
    // Legacy file fields (for backward compatibility)
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    
    isEdited?: boolean;
    isDeleted?: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface ConversationMember {
    userId: string;
    role: 'admin' | 'member';
}

export interface Conversation {
    id: string;
    type: 'direct' | 'group';
    name?: string; // for group conversations
    avatarUrl?: string; // for group conversations
    members: ConversationMember[];
    participants?: User[]; // populated members data (optional)
    lastMessage?: Message;
    unreadCount?: number;
    createdBy: string;
    createdAt: string;
    updatedAt: string;
}

export interface SendMessageDto {
    conversationId: string;
    text?: string;
    type: 'text' | 'image' | 'video' | 'file' | 'audio';
    
    // Media fields (for Cloudinary uploads)
    mediaUrl?: string;
    mediaPublicId?: string;
    thumbnailUrl?: string;
    mediaWidth?: number;
    mediaHeight?: number;
    mediaDuration?: number;
}

export interface CreateConversationDto {
    type: 'direct' | 'group';
    participantIds: string[];
    name?: string;
}
