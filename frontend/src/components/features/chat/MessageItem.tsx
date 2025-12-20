// MessageItem Component - Individual chat message bubble

import { memo, useState, useRef } from 'react';
import { Avatar } from '../../common/Avatar';
import type { Message } from '../../../types/chat.types';
import type { User } from '../../../types/user.types';

interface MessageItemProps {
    message: Message;
    isOwn: boolean;
    sender?: User;
    showAvatar?: boolean;
    onMediaClick?: (message: Message) => void;
}

function formatMessageTime(date: Date | string): string {
    const messageDate = new Date(date);
    return messageDate.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

export const MessageItem = memo(function MessageItem({
    message,
    isOwn,
    sender,
    showAvatar = true,
    onMediaClick
}: MessageItemProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    const handleMediaClick = () => {
        if ((message.type === 'image' || message.type === 'video') && onMediaClick) {
            onMediaClick(message);
        }
    };

    const toggleAudioPlayback = () => {
        if (!audioRef.current) return;

        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleAudioTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleAudioEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
    };

    const formatAudioTime = (seconds: number): string => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${String(secs).padStart(2, '0')}`;
    };

    // Kiểm tra xem tin nhắn có phải chỉ là emoji không
    const isOnlyEmoji = (text: string): boolean => {
        if (!text) return false;
        const trimmed = text.trim();
        // Regex chặt chẽ hơn: chỉ emoji, không có chữ cái, số, ký tự đặc biệt
        const emojiRegex = /^[\p{Emoji_Presentation}\p{Emoji}\uFE0F\u200D]+$/u;
        // Loại bỏ các ký tự không phải emoji
        const withoutSpaces = trimmed.replace(/\s/g, '');
        return withoutSpaces.length > 0 && withoutSpaces.length <= 10 && emojiRegex.test(withoutSpaces);
    };

    const isEmojiMessage = message.type === 'text' && message.text && isOnlyEmoji(message.text);

    return (
        <div className={`flex items-start ${isOwn ? 'justify-end' : 'justify-start'} mb-1 gap-2`}>
            {/* Avatar for received messages - only show on last message in group */}
            {!isOwn && (
                <div className="w-7 h-7 mt-2.5 flex-shrink-0">
                    {showAvatar && sender && (
                        <Avatar
                            src={sender.avatarUrl}
                            alt={sender.name}
                            name={sender.name}
                            size="sm"
                        />
                    )}
                </div>
            )}

            <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[65%]`}>
                {/* Message bubble */}
                <div
                    className={`rounded-2xl overflow-hidden ${
                        isEmojiMessage 
                            ? '' // Không có padding và background cho emoji
                            : message.type === 'text'
                                ? 'px-4 py-2.5'
                                : (message.type === 'audio' || message.type === 'location')
                                    ? ''
                                    : 'p-1'
                        } ${
                        isEmojiMessage
                            ? 'bg-transparent' // Không có background cho emoji
                            : message.type === 'text' 
                                ? isOwn
                                    ? 'bg-blue-600 text-white rounded-br-sm'
                                    : 'bg-gray-200 text-gray-900 rounded-bl-sm'
                                : (message.type === 'audio' || message.type === 'location')
                                    ? 'bg-transparent'
                                    : 'bg-transparent'
                        }`}
                >
                    {/* Text message */}
                    {message.type === 'text' && message.text && (
                        <p className={`${isEmojiMessage ? 'text-3xl' : 'text-sm'} break-words whitespace-pre-wrap leading-relaxed`}>
                            {message.text}
                        </p>
                    )}

                    {/* Image message */}
                    {message.type === 'image' && (
                        <>
                            {message.mediaUrl ? (
                                <div className="relative group cursor-pointer overflow-hidden rounded-2xl shadow-md" onClick={handleMediaClick}>
                                    <img
                                        src={message.mediaUrl}
                                        alt="Shared image"
                                        className="max-w-[280px] max-h-[320px] object-cover hover:scale-105 transition-transform duration-300"
                                        onError={(e) => {
                                            console.error('Failed to load image:', message.mediaUrl);
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                    {/* Hover overlay with icon */}
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/40 via-black/20 to-transparent">
                                        <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 transform group-hover:scale-110 transition-transform">
                                            <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="px-4 py-2 text-sm text-gray-500">Image not available</div>
                            )}
                        </>
                    )}

                    {/* Video message */}
                    {message.type === 'video' && (
                        <>
                            {message.mediaUrl ? (
                                <div className="relative group cursor-pointer overflow-hidden rounded-2xl shadow-md" onClick={handleMediaClick}>
                                    <video
                                        src={message.mediaUrl}
                                        className="max-w-[320px] max-h-[360px] pointer-events-none"
                                        poster={message.thumbnailUrl}
                                    />
                                    {/* Play button overlay */}
                                    <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-t from-black/50 via-black/30 to-transparent group-hover:from-black/60 group-hover:via-black/40 transition-all">
                                        <div className="w-16 h-16 rounded-full bg-white/95 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-white transition-all shadow-lg">
                                            <svg className="w-7 h-7 text-blue-600 ml-0.5" fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="px-4 py-2 text-sm text-gray-500">Video not available</div>
                            )}
                        </>
                    )}

                    {/* Audio/Voice message */}
                    {message.type === 'audio' && (
                        <>
                            {message.mediaUrl ? (
                                <div className={`flex items-center gap-3 px-4 py-3 min-w-[240px] ${
                                    isOwn ? 'bg-blue-600' : 'bg-gray-200'
                                } rounded-2xl`}>
                                    {/* Play/Pause button */}
                                    <button 
                                        onClick={toggleAudioPlayback}
                                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                            isOwn ? 'bg-white/20 hover:bg-white/30' : 'bg-gray-300 hover:bg-gray-400'
                                        } transition-colors`}
                                    >
                                        {isPlaying ? (
                                            <svg className={`w-5 h-5 ${
                                                isOwn ? 'text-white' : 'text-gray-700'
                                            }`} fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                        ) : (
                                            <svg className={`w-5 h-5 ml-0.5 ${
                                                isOwn ? 'text-white' : 'text-gray-700'
                                            }`} fill="currentColor" viewBox="0 0 20 20">
                                                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
                                            </svg>
                                        )}
                                    </button>

                                    {/* Waveform visualization */}
                                    <div className="flex items-center gap-0.5 flex-1 h-8">
                                        {[30, 50, 40, 60, 35, 55, 45, 65, 40, 50, 35, 55, 45, 60, 35].map((height, idx) => {
                                            const progress = message.mediaDuration ? (currentTime / message.mediaDuration) * 15 : 0;
                                            const isActive = idx < progress;
                                            return (
                                                <div
                                                    key={idx}
                                                    className={`w-1 rounded-full transition-colors ${
                                                        isActive 
                                                            ? isOwn ? 'bg-white' : 'bg-blue-600'
                                                            : isOwn ? 'bg-white/40' : 'bg-gray-400'
                                                    }`}
                                                    style={{ height: `${height}%` }}
                                                />
                                            );
                                        })}
                                    </div>

                                    {/* Duration */}
                                    <span className={`text-xs font-medium ${
                                        isOwn ? 'text-white/90' : 'text-gray-600'
                                    }`}>
                                        {isPlaying ? formatAudioTime(currentTime) : formatAudioTime(message.mediaDuration || 0)}
                                    </span>

                                    {/* Audio element */}
                                    <audio 
                                        ref={audioRef}
                                        src={message.mediaUrl}
                                        onTimeUpdate={handleAudioTimeUpdate}
                                        onEnded={handleAudioEnded}
                                        className="hidden"
                                    />
                                </div>
                            ) : (
                                <div className="px-4 py-2 text-sm text-gray-500">Audio not available</div>
                            )}
                        </>
                    )}

                    {/* Location message */}
                    {message.type === 'location' && message.location && (
                        <div className="w-[280px] rounded-2xl overflow-hidden shadow-md bg-white">
                            {/* Map preview */}
                            <div className="relative h-48 bg-gray-200">
                                <iframe
                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${message.location.longitude - 0.005},${message.location.latitude - 0.005},${message.location.longitude + 0.005},${message.location.latitude + 0.005}&layer=mapnik&marker=${message.location.latitude},${message.location.longitude}`}
                                    className="w-full h-full border-0"
                                    title="Location map"
                                />
                            </div>

                            {/* Location details */}
                            <div className="p-3 border-t border-gray-200">
                                <div className="flex items-start gap-2">
                                    <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                                    </svg>
                                    <div className="flex-1 min-w-0">
                                        {message.location.address ? (
                                            <p className="text-sm text-gray-900 font-medium">
                                                {message.location.address}
                                            </p>
                                        ) : (
                                            <p className="text-xs text-gray-500">
                                                {message.location.latitude.toFixed(6)}, {message.location.longitude.toFixed(6)}
                                            </p>
                                        )}
                                        {message.location.address && (
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {message.location.latitude.toFixed(6)}, {message.location.longitude.toFixed(6)}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Open in maps button */}
                                <a
                                    href={`https://www.google.com/maps?q=${message.location.latitude},${message.location.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-2 flex items-center justify-center gap-1.5 w-full px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                    </svg>
                                    Open in Google Maps
                                </a>
                            </div>
                        </div>
                    )}
                </div>

                {/* Timestamp - only show on last message in group */}
                {showAvatar && (
                    <div className={`flex items-center gap-1 mt-1`}>
                        <span className="text-xs text-gray-500">
                            {formatMessageTime(message.createdAt)}
                        </span>

                        {/* Read status for sent messages */}
                        {isOwn && (
                            <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});

