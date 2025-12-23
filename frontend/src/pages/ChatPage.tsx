// ChatPage - Main chat interface

import { useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { ConversationList } from '../components/features/chat/ConversationList';
import { ChatWindow } from '../components/features/chat/ChatWindow';
import { VoiceCallModal } from '../components/features/chat/VoiceCallModal';
import { VideoCallModal } from '../components/features/chat/VideoCallModal';
import { GroupVoiceCallModal } from '../components/features/chat/GroupVoiceCallModal';
import { GroupVideoCallModal } from '../components/features/chat/GroupVideoCallModal';
import { useVoiceCall } from '../hooks/useVoiceCall';
import { useVideoCall } from '../hooks/useVideoCall';
import { useGroupVoiceCall } from '../hooks/useGroupVoiceCall';
import { useGroupVideoCall } from '../hooks/useGroupVideoCall';
import { useChat } from '../hooks/useChat';

export function ChatPage() {
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const { callState, startCall, answerCall, rejectCall, endCall } = useVoiceCall();
    const { 
        callState: videoCallState, 
        startCall: startVideoCall, 
        answerCall: answerVideoCall, 
        rejectCall: rejectVideoCall, 
        endCall: endVideoCall,
        toggleCamera,
        toggleMicrophone,
        toggleScreenShare,
        localStream,
        remoteStream,
    } = useVideoCall();
    
    // Group call hooks
    const {
        callState: groupVoiceCallState,
        startCall: startGroupVoiceCall,
        answerCall: answerGroupVoiceCall,
        rejectCall: rejectGroupVoiceCall,
        endCall: endGroupVoiceCall,
        leaveCall: leaveGroupVoiceCall,
        toggleMute: toggleGroupVoiceMute,
    } = useGroupVoiceCall();
    
    const {
        callState: groupVideoCallState,
        localStream: groupVideoLocalStream,
        startCall: startGroupVideoCall,
        answerCall: answerGroupVideoCall,
        rejectCall: rejectGroupVideoCall,
        endCall: endGroupVideoCall,
        leaveCall: leaveGroupVideoCall,
        toggleMicrophone: toggleGroupVideoMic,
        toggleCamera: toggleGroupVideoCamera,
        toggleScreenShare: toggleGroupVideoScreenShare,
        getParticipantStreams,
    } = useGroupVideoCall();
    
    const { conversations } = useChat(activeConversationId || undefined);

    // Get the other user in the voice call
    const getCallUser = () => {
        if (callState.isIncoming && callState.callerId) {
            // For incoming calls, find caller in conversations
            const conversation = conversations?.find((c) =>
                c.participants?.some((p) => p.id === callState.callerId)
            );
            return conversation?.participants?.find((p) => p.id === callState.callerId);
        } else if (callState.targetUserId) {
            // For outgoing calls, find target user
            const conversation = conversations?.find((c) =>
                c.participants?.some((p) => p.id === callState.targetUserId)
            );
            return conversation?.participants?.find((p) => p.id === callState.targetUserId);
        }
        return undefined;
    };

    // Get the other user in the video call
    const getVideoCallUser = () => {
        if (videoCallState.isIncoming && videoCallState.callerId) {
            // For incoming calls, find caller in conversations
            const conversation = conversations?.find((c) =>
                c.participants?.some((p) => p.id === videoCallState.callerId)
            );
            return conversation?.participants?.find((p) => p.id === videoCallState.callerId);
        } else if (videoCallState.targetUserId) {
            // For outgoing calls, find target user
            const conversation = conversations?.find((c) =>
                c.participants?.some((p) => p.id === videoCallState.targetUserId)
            );
            return conversation?.participants?.find((p) => p.id === videoCallState.targetUserId);
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
                        onStartVideoCall={startVideoCall}
                        onStartGroupVoiceCall={startGroupVoiceCall}
                        onStartGroupVideoCall={startGroupVideoCall}
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

            {/* Video Call Modal */}
            <VideoCallModal
                isOpen={videoCallState.isActive}
                callState={videoCallState}
                otherUser={getVideoCallUser()}
                localStream={localStream}
                remoteStream={remoteStream}
                onAnswer={() => {
                    const incomingData = (window as any).__incomingVideoCallData;
                    if (incomingData) {
                        answerVideoCall(incomingData);
                    }
                }}
                onReject={() => {
                    if (videoCallState.callerId) {
                        rejectVideoCall(videoCallState.callerId);
                    }
                }}
                onEnd={endVideoCall}
                onToggleCamera={toggleCamera}
                onToggleMicrophone={toggleMicrophone}
                onToggleScreenShare={toggleScreenShare}
            />

            {/* Group Voice Call Modal */}
            <GroupVoiceCallModal
                isOpen={groupVoiceCallState.isActive}
                callState={groupVoiceCallState}
                onAnswer={answerGroupVoiceCall}
                onReject={rejectGroupVoiceCall}
                onEnd={endGroupVoiceCall}
                onLeave={leaveGroupVoiceCall}
                onToggleMute={toggleGroupVoiceMute}
            />

            {/* Group Video Call Modal */}
            <GroupVideoCallModal
                isOpen={groupVideoCallState.isActive}
                callState={groupVideoCallState}
                localStream={groupVideoLocalStream}
                getParticipantStreams={getParticipantStreams}
                onAnswer={answerGroupVideoCall}
                onReject={rejectGroupVideoCall}
                onEnd={endGroupVideoCall}
                onLeave={leaveGroupVideoCall}
                onToggleMicrophone={toggleGroupVideoMic}
                onToggleCamera={toggleGroupVideoCamera}
                onToggleScreenShare={toggleGroupVideoScreenShare}
            />
        </MainLayout>
    );
}
