// Chat API Service

import { http } from '../http';
import type {
    Conversation,
    Message,
    SendMessageDto,
    CreateConversationDto,
    UpdateGroupDto,
    AddMemberDto,
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

    async updateConversation(conversationId: string, dto: UpdateGroupDto): Promise<Conversation> {
        const { data } = await http.put<Conversation>(
            API_ENDPOINTS.CHAT.CONVERSATION(conversationId),
            dto
        );
        return data;
    }

    async addMember(conversationId: string, dto: AddMemberDto): Promise<void> {
        await http.post(
            `${API_ENDPOINTS.CHAT.CONVERSATIONS}/${conversationId}/members`,
            dto
        );
    }

    async removeMember(conversationId: string, userId: string): Promise<void> {
        await http.delete(
            `${API_ENDPOINTS.CHAT.CONVERSATIONS}/${conversationId}/members/${userId}`
        );
    }

    async leaveGroup(conversationId: string): Promise<void> {
        await http.delete(
            `${API_ENDPOINTS.CHAT.CONVERSATIONS}/${conversationId}/leave`
        );
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

    async getSharedMedia(conversationId: string): Promise<Message[]> {
        const { data } = await http.get<Message[]>(
            `${API_ENDPOINTS.CHAT.CONVERSATIONS}/${conversationId}/shared-media`
        );
        return data;
    }

    async getSharedDocuments(conversationId: string): Promise<Message[]> {
        const { data } = await http.get<Message[]>(
            `${API_ENDPOINTS.CHAT.CONVERSATIONS}/${conversationId}/shared-documents`
        );
        return data;
    }

    async getConversationSettings(conversationId: string): Promise<{
        mute: boolean;
        sound: boolean;
        popups: boolean;
        hide: boolean;
    }> {
        const { data } = await http.get(
            `${API_ENDPOINTS.CHAT.CONVERSATIONS}/${conversationId}/settings`
        );
        return data;
    }

    async updateConversationSettings(
        conversationId: string,
        settings: {
            mute?: boolean;
            sound?: boolean;
            popups?: boolean;
            hide?: boolean;
        }
    ): Promise<void> {
        await http.put(
            `${API_ENDPOINTS.CHAT.CONVERSATIONS}/${conversationId}/settings`,
            settings
        );
    }
}

export const chatService = new ChatService();
