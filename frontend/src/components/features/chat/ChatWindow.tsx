// ChatWindow Component - Main chat container

import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { useChat } from '@/hooks/useChat';
import type { SendMessageDto } from '@/types/chat.types';

interface ChatWindowProps {
    conversationId: string;
}

export function ChatWindow({ conversationId }: ChatWindowProps) {
    const { currentMessages, sendMessage, isLoading } = useChat(conversationId);

    const handleSendMessage = async (content: string) => {
        const dto: SendMessageDto = {
            conversationId,
            content,
            type: 'text',
        };

        try {
            await sendMessage(dto);
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <div className="border-b border-gray-200 p-4 bg-white">
                <h2 className="text-lg font-semibold text-gray-900">Chat</h2>
            </div>

            <MessageList messages={currentMessages} />

            <ChatInput onSend={handleSendMessage} disabled={isLoading} />
        </div>
    );
}
