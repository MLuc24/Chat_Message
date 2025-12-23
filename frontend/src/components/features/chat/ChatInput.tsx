// ChatInput Component - Message input with send button

import { useState, useRef } from 'react';
import type { FormEvent, KeyboardEvent, ChangeEvent } from 'react';
import { uploadService } from '../../../services/api/uploadService';
import type { UploadProgress } from '../../../services/api/uploadService';
import { EmojiPicker } from './EmojiPicker';
import { VoiceRecorder } from './VoiceRecorder';
import { LocationPicker } from './LocationPicker';

interface ChatInputProps {
    onSend: (message: string) => void;
    onSendMedia?: (mediaUrl: string, type: 'image' | 'video', metadata?: {
        publicId: string;
        width?: number;
        height?: number;
        duration?: number;
        thumbnailUrl?: string;
    }) => void;
    onSendVoice?: (audioBlob: Blob, duration: number) => void;
    onSendLocation?: (location: {
        latitude: number;
        longitude: number;
        accuracy?: number;
        address?: string;
    }) => void;
    onSendFile?: (fileUrl: string, fileName: string, fileSize: number, fileType: string) => void;
    disabled?: boolean;
}

export function ChatInput({ onSend, onSendMedia, onSendVoice, onSendLocation, onSendFile, disabled }: ChatInputProps) {
    const [message, setMessage] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (message.trim() && !isUploading) {
            onSend(message.trim());
            setMessage('');
        }
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            const submitEvent = e as unknown as FormEvent;
            handleSubmit(submitEvent);
        }
    };

    const handleEmojiSelect = (emoji: string) => {
        const cursorPos = inputRef.current?.selectionStart || message.length;
        const newMessage = message.slice(0, cursorPos) + emoji + message.slice(cursorPos);
        setMessage(newMessage);
        
        // Focus back to input and move cursor after emoji
        setTimeout(() => {
            inputRef.current?.focus();
            inputRef.current?.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
        }, 0);
    };

    const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setIsUploading(true);
            setUploadProgress(0);

            // Determine file type
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            
            if (isImage && onSendMedia) {
                // Handle image
                const result = await uploadService.upload(
                    file,
                    'chat_image',
                    '/chat',
                    (progress: UploadProgress) => {
                        setUploadProgress(progress.percentage);
                    }
                );

                onSendMedia(result.secureUrl, 'image', {
                    publicId: result.publicId,
                    width: result.width,
                    height: result.height,
                    thumbnailUrl: result.thumbnailUrl,
                });
            } else if (isVideo && onSendMedia) {
                // Handle video
                const result = await uploadService.upload(
                    file,
                    'chat_video',
                    '/chat',
                    (progress: UploadProgress) => {
                        setUploadProgress(progress.percentage);
                    }
                );

                onSendMedia(result.secureUrl, 'video', {
                    publicId: result.publicId,
                    width: result.width,
                    height: result.height,
                    duration: result.duration,
                    thumbnailUrl: result.thumbnailUrl,
                });
            } else if (onSendFile) {
                // Handle document files
                const result = await uploadService.upload(
                    file,
                    'chat_document',
                    '/chat',
                    (progress: UploadProgress) => {
                        setUploadProgress(progress.percentage);
                    }
                );

                onSendFile(result.secureUrl, file.name, file.size, file.type);
            }

            // Reset input
            if (e.target) e.target.value = '';
        } catch (error) {
            console.error('Failed to upload file:', error);
            alert(error instanceof Error ? error.message : 'Failed to upload file');
        } finally {
            setIsUploading(false);
            setUploadProgress(0);
        }
    };

    const handleVoiceSend = (audioBlob: Blob, duration: number) => {
        if (onSendVoice) {
            onSendVoice(audioBlob, duration);
        }
        setShowVoiceRecorder(false);
    };

    const handleLocationSend = (location: {
        latitude: number;
        longitude: number;
        accuracy?: number;
        address?: string;
    }) => {
        if (onSendLocation) {
            onSendLocation(location);
        }
        setShowLocationPicker(false);
    };

    // If voice recorder is active, show it instead
    if (showVoiceRecorder) {
        return (
            <VoiceRecorder
                onSend={handleVoiceSend}
                onCancel={() => setShowVoiceRecorder(false)}
            />
        );
    }

    return (
        <div className="relative">
            {/* Location Picker */}
            {showLocationPicker && (
                <LocationPicker
                    onSend={handleLocationSend}
                    onCancel={() => setShowLocationPicker(false)}
                />
            )}

            <form onSubmit={handleSubmit} className="border-t border-gray-200 px-4 py-3 bg-white">
                {/* Upload Progress */}
                {isUploading && (
                <div className="mb-2">
                    <div className="flex items-center gap-2 text-sm text-blue-600">
                        <span>Uploading... {uploadProgress}%</span>
                        <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-blue-600 h-full transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center gap-3">
                {/* Hidden file input for all file types */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z"
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={disabled || isUploading}
                />

                {/* Add Media/File Button - supports image, video, and files */}
                <button
                    type="button"
                    className="text-blue-600 hover:bg-blue-50 transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed rounded-full p-1.5"
                    title="Add photo, video or file"
                    disabled={disabled || isUploading}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v8m-4-4h8" />
                    </svg>
                </button>

                {/* Voice Button */}
                <button
                    type="button"
                    className="text-blue-600 hover:bg-blue-50 transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed rounded-full p-1.5"
                    title="Record voice message"
                    disabled={disabled || isUploading}
                    onClick={() => setShowVoiceRecorder(true)}
                >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                    </svg>
                </button>

                {/* Location Button */}
                <button
                    type="button"
                    className="text-blue-600 hover:bg-blue-50 transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed rounded-full p-1.5"
                    title="Share location"
                    disabled={disabled || isUploading}
                    onClick={() => setShowLocationPicker(true)}
                >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                </button>

                {/* Emoji Button */}
                <div className="relative">
                    <button
                        type="button"
                        className="text-blue-600 hover:bg-blue-50 transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed rounded-full p-1.5"
                        title="Add emoji"
                        disabled={disabled || isUploading}
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                        </svg>
                    </button>

                    {/* Emoji Picker */}
                    {showEmojiPicker && (
                        <EmojiPicker
                            onEmojiSelect={handleEmojiSelect}
                            onClose={() => setShowEmojiPicker(false)}
                        />
                    )}
                </div>

                {/* Message input with Aa placeholder */}
                <div className="flex-1 relative">
                    <input
                        ref={inputRef}
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Aa"
                        disabled={disabled || isUploading}
                        className="w-full px-4 py-2.5 bg-gray-100 border-0 rounded-full text-sm focus:outline-none focus:bg-gray-200 transition-colors disabled:opacity-50"
                    />
                </div>

                {/* Send button or Thumbs up */}
                {message.trim() ? (
                    <button
                        type="submit"
                        disabled={disabled || isUploading}
                        className="text-blue-600 hover:bg-blue-50 disabled:text-gray-300 disabled:cursor-not-allowed transition-all flex-shrink-0 rounded-full p-1.5"
                        title="Send message"
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                    </button>
                ) : (
                    <button
                        type="button"
                        className="text-blue-600 hover:bg-blue-50 transition-all flex-shrink-0 disabled:opacity-50 rounded-full p-1.5"
                        title="Send like"
                        onClick={() => onSend('👍')}
                        disabled={disabled || isUploading}
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z" />
                        </svg>
                    </button>
                )}
            </div>
            </form>
        </div>
    );
}
