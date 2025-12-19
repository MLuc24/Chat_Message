// ChatPage - Main chat interface

import { useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { ConversationList } from '../components/features/chat/ConversationList';
import { ChatWindow } from '../components/features/chat/ChatWindow';
import { VoiceCallModal } from '../components/features/chat/VoiceCallModal';
import { useVoiceCall } from '../hooks/useVoiceCall';
import { useChat } from '../hooks/useChat';

export function ChatPage() {
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const { callState, startCall, answerCall, rejectCall, endCall } = useVoiceCall();
    const { conversations } = useChat(activeConversationId || undefined);

    // Get the other user in the call
    const getCallUser = () => {
        if (callState.isIncoming && callState.callerId) {
            // For incoming calls, find caller in conversations
            const conversation = conversations?.find((c) =>
                c.participants.some((p) => p.id === callState.callerId)
            );
            return conversation?.participants.find((p) => p.id === callState.callerId);
        } else if (callState.targetUserId) {
            // For outgoing calls, find target user
            const conversation = conversations?.find((c) =>
                c.participants.some((p) => p.id === callState.targetUserId)
            );
            return conversation?.participants.find((p) => p.id === callState.targetUserId);
        }
        return undefined;
    };

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
                    <ChatWindow
                        conversationId={activeConversationId}
                        onStartVoiceCall={startCall}
                    />
                </div>
            </div>

            {/* Voice Call Modal */}
            <VoiceCallModal
                isOpen={callState.isActive}
                isIncoming={callState.isIncoming}
                isConnected={callState.isConnected}
                otherUser={getCallUser()}
                duration={callState.duration}
                onAnswer={answerCall}
                onReject={rejectCall}
                onEnd={endCall}
            />
        </MainLayout>
    );
}
