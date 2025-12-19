// Chat API Service

import { http } from '../http';
import type {
    Conversation,
    Message,
    SendMessageDto,
    CreateConversationDto,
} from '@/types/chat.types';
import { API_ENDPOINTS } from '@/utils/constants';

class ChatService {
    async getConversations(): Promise<Conversation[]> {
        const { data } = await http.get<{ conversations: Conversation[] }>(
            `${API_ENDPOINTS.CHAT.CONVERSATIONS}?populate=participants`
        );
        return data.conversations;
    }

    async getConversation(conversationId: string): Promise<Conversation> {
        const { data } = await http.get<Conversation>(
            API_ENDPOINTS.CHAT.CONVERSATION(conversationId)
        );
        return data;
    }

    async createConversation(dto: CreateConversationDto): Promise<Conversation> {
        const { data } = await http.post<Conversation>(API_ENDPOINTS.CHAT.CONVERSATIONS, dto);
        return data;
    }

    async getMessages(conversationId: string): Promise<Message[]> {
        const { data } = await http.get<{ messages: Message[]; hasMore: boolean }>(
            API_ENDPOINTS.CHAT.MESSAGES(conversationId)
        );
        return data.messages;
    }

    async sendMessage(conversationId: string, dto: SendMessageDto): Promise<Message> {
        // Send all message data (conversationId is in URL, so exclude it from body)
        const { conversationId: _, ...messageData } = dto;
        const { data } = await http.post<Message>(
            API_ENDPOINTS.CHAT.SEND_MESSAGE(conversationId),
            messageData
        );
        return data;
    }

    async markConversationAsRead(conversationId: string): Promise<void> {
        await http.post(`${API_ENDPOINTS.CHAT.CONVERSATIONS}/${conversationId}/read`);
    }

    async deleteMessage(messageId: string): Promise<void> {
        await http.delete(API_ENDPOINTS.CHAT.DELETE_MESSAGE(messageId));
    }
}

export const chatService = new ChatService();
