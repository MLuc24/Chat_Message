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

export interface Conversation {
    id: string;
    participants: User[];
    lastMessage?: Message;
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
