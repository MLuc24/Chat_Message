// Chat-related types

import type { User } from './user.types';

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    text?: string;
    type: 'text' | 'image' | 'video' | 'file' | 'audio' | 'location';
    
    // Media fields (for images/videos uploaded to Cloudinary)
    mediaUrl?: string;
    mediaPublicId?: string;
    thumbnailUrl?: string; // For videos
    mediaWidth?: number;
    mediaHeight?: number;
    mediaDuration?: number; // For videos/audio (in seconds)
    
    // Location fields (for location messages)
    location?: {
        latitude: number;
        longitude: number;
        accuracy?: number;
        address?: string;
    };
    
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
    joinedAt?: string;
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
    type: 'text' | 'image' | 'video' | 'file' | 'audio' | 'location';
    
    // Media fields (for Cloudinary uploads)
    mediaUrl?: string;
    mediaPublicId?: string;
    thumbnailUrl?: string;
    mediaWidth?: number;
    mediaHeight?: number;
    mediaDuration?: number;
    
    // Location fields
    location?: {
        latitude: number;
        longitude: number;
        accuracy?: number;
        address?: string;
    };
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
    updatedBy: string;
}
