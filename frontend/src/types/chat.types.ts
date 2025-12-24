// Chat-related types

import type { User } from './user.types';

// Reaction types
export interface MessageReaction {
    emoji: string;
    userId: string;
    user?: User;
    createdAt: string;
}

export interface ReactionSummary {
    emoji: string;
    count: number;
    users: string[]; // User IDs
    hasReacted: boolean; // Whether current user has reacted with this emoji
}

export interface MediaItem {
    url: string;
    type: 'image' | 'video';
    publicId: string;
    width?: number;
    height?: number;
    duration?: number; // For videos (in seconds)
    thumbnailUrl?: string; // For videos
}

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    text?: string;
    type: 'text' | 'image' | 'video' | 'file' | 'audio' | 'location' | 'media_group';
    
    // Media fields (for images/videos uploaded to Cloudinary)
    mediaUrl?: string;
    mediaPublicId?: string;
    thumbnailUrl?: string; // For videos
    mediaWidth?: number;
    mediaHeight?: number;
    mediaDuration?: number; // For videos/audio (in seconds)
    
    // Grouped media (for media_group messages)
    mediaItems?: MediaItem[];
    
    // Location fields (for location messages)
    location?: {
        latitude: number;
        longitude: number;
        accuracy?: number;
        address?: string;
    };
    
    // File fields (for file attachments)
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    fileType?: string; // MIME type
    
    isEdited?: boolean;
    isDeleted?: boolean;
    reactions?: MessageReaction[];
    createdAt: string;
    updatedAt: string;
}

export interface ConversationMember {
    userId: string;
    role: 'admin' | 'member';
    joinedAt?: string;
}

export interface Conversation {
    id: string;
    type: 'direct' | 'group';
    name?: string; // for group conversations
    avatarUrl?: string; // for group conversations
    themeId?: string; // theme for this conversation
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
    type: 'text' | 'image' | 'video' | 'file' | 'audio' | 'location' | 'media_group';
    
    // Media fields (for Cloudinary uploads)
    mediaUrl?: string;
    mediaPublicId?: string;
    thumbnailUrl?: string;
    mediaWidth?: number;
    mediaHeight?: number;
    mediaDuration?: number;
    
    // Grouped media (for media_group messages)
    mediaItems?: MediaItem[];
    
    // Location fields
    location?: {
        latitude: number;
        longitude: number;
        accuracy?: number;
        address?: string;
    };
    
    // File fields (for file attachments)
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
    fileType?: string;
}

export interface CreateConversationDto {
    type: 'direct' | 'group';
    participantIds: string[];
    name?: string;
}

// Group management DTOs
export interface UpdateGroupDto {
    name?: string;
    avatarUrl?: string;
    themeId?: string;
}

export interface AddMemberDto {
    userId: string;
}

// Group WebSocket event payloads
export interface MemberAddedEvent {
    conversationId: string;
    userId: string;
    addedBy: string;
    role: 'admin' | 'member';
}

export interface MemberRemovedEvent {
    conversationId: string;
    userId: string;
    removedBy: string;
}

export interface GroupUpdatedEvent {
    conversationId: string;
    name?: string;
    avatarUrl?: string;
    themeId?: string;
    updatedBy: string;
}

// Reaction event payloads
export interface MessageReactionEvent {
    messageId: string;
    conversationId: string;
    emoji: string;
    userId: string;
    action: 'add' | 'remove';
    createdAt: string;
}
