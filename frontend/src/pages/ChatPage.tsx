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
                <div className="w-80 border-r border-gray-200 bg-white flex flex-col">
                    <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 bg-white">
                        <h2 className="text-lg font-semibold text-gray-900">Messages</h2>
                    </div>
                    <ConversationList
                        onSelectConversation={setActiveConversationId}
                        activeConversationId={activeConversationId}
                    />
                </div>

                {/* Right Side - Chat Window */}
                <div className="flex-1">
                    <ChatWindow conversationId={activeConversationId} />
                </div>
            </div>
        </MainLayout>
    );
}
