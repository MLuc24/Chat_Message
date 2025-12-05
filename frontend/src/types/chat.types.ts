// Chat-related types

import type { User } from './user.types';

export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    type?: 'text' | 'image' | 'file';
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
    content: string;
    type?: 'text' | 'image' | 'file';
}

export interface CreateConversationDto {
    participantIds: string[];
}
