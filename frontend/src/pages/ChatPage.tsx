// ChatPage - Main chat interface

import { useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { ConversationList } from '../components/features/chat/ConversationList';
import { ChatWindow } from '../components/features/chat/ChatWindow';

export function ChatPage() {
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

    return (
        <MainLayout>
            <div className="flex h-full">
                {/* Left Sidebar - Conversations */}
                <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                    <ConversationList
                        onSelectConversation={setActiveConversationId}
                        activeConversationId={activeConversationId}
                    />
                </div>

                {/* Right Side - Chat Window */}
                <div className="flex-1 bg-white">
                    <ChatWindow conversationId={activeConversationId} />
                </div>
            </div>
        </MainLayout>
    );
}
