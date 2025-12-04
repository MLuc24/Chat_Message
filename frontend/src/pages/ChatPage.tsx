// ChatPage - Main chat interface

import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Sidebar } from '@/components/layout/Sidebar';
import { ConversationList } from '@/components/features/chat/ConversationList';
import { ChatWindow } from '@/components/features/chat/ChatWindow';

export function ChatPage() {
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

    return (
        <MainLayout>
            <div className="flex h-full">
                <Sidebar>
                    <ConversationList
                        onSelectConversation={setActiveConversationId}
                        activeConversationId={activeConversationId}
                    />
                </Sidebar>

                <div className="flex-1 bg-gray-50">
                    {activeConversationId ? (
                        <ChatWindow conversationId={activeConversationId} />
                    ) : (
                        <div className="h-full flex items-center justify-center text-gray-500">
                            <div className="text-center">
                                <h3 className="text-xl font-semibold  mb-2">Welcome to MessApp</h3>
                                <p>Select a conversation to start chatting</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
