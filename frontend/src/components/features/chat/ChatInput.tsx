// ChatInput Component - Message input with send button

import { useState, useRef } from 'react';
import type { FormEvent, KeyboardEvent, ChangeEvent } from 'react';
import { uploadService } from '../../../services/api/uploadService';
import type { UploadProgress } from '../../../services/api/uploadService';

interface ChatInputProps {
    onSend: (message: string) => void;
    onSendMedia?: (mediaUrl: string, type: 'image' | 'video', metadata?: {
        publicId: string;
        width?: number;
        height?: number;
        duration?: number;
        thumbnailUrl?: string;
    }) => void;
    disabled?: boolean;
}

export function ChatInput({ onSend, onSendMedia, disabled }: ChatInputProps) {
    const [message, setMessage] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const imageInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

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
            handleSubmit(e as any);
        }
    };

    const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
        const file = e.target.files?.[0];
        if (!file || !onSendMedia) return;

        try {
            setIsUploading(true);
            setUploadProgress(0);

            const uploadType = type === 'image' ? 'chat_image' : 'chat_video';
            
            const result = await uploadService.upload(
                file,
                uploadType,
                '/chat',
                (progress: UploadProgress) => {
                    setUploadProgress(progress.percentage);
                }
            );

            // Send media message
            onSendMedia(result.secureUrl, type, {
                publicId: result.publicId,
                width: result.width,
                height: result.height,
                duration: result.duration,
                thumbnailUrl: result.thumbnailUrl,
            });

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

    return (
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

            <div className="flex items-center gap-2">
                {/* Hidden file inputs */}
                <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, 'image')}
                    disabled={disabled || isUploading}
                />
                <input
                    ref={videoInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e, 'video')}
                    disabled={disabled || isUploading}
                />

                {/* Add Media Circle Plus */}
                <button
                    type="button"
                    className="text-blue-600 hover:text-blue-700 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Add media"
                    disabled={disabled || isUploading}
                    onClick={() => videoInputRef.current?.click()}
                >
                    <svg className="w-9 h-9" fill="currentColor" viewBox="0 0 24 24">
                        <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M13 8h-2v3H8v2h3v3h2v-3h3v-2h-3z" />
                    </svg>
                </button>

                {/* Image Icon */}
                <button
                    type="button"
                    className="text-blue-600 hover:text-blue-700 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Add photo"
                    disabled={disabled || isUploading}
                    onClick={() => imageInputRef.current?.click()}
                >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zm-5.04-6.71l-2.75 3.54-1.96-2.36L6.5 17h11l-3.54-4.71z" />
                    </svg>
                </button>

                {/* Sticker Icon */}
                <button
                    type="button"
                    className="text-blue-600 hover:text-blue-700 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Add sticker"
                    disabled={disabled || isUploading}
                >
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                    </svg>
                </button>

                {/* Message input with Aa placeholder */}
                <div className="flex-1 relative">
                    <input
                        type="text"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Aa"
                        disabled={disabled || isUploading}
                        className="w-full px-3 py-2 bg-gray-100 border-0 rounded-full text-sm focus:outline-none focus:bg-gray-200 transition-colors disabled:opacity-50"
                    />
                </div>

                {/* Send button or Thumbs up */}
                {message.trim() ? (
                    <button
                        type="submit"
                        disabled={disabled || isUploading}
                        className="text-blue-600 hover:text-blue-700 disabled:text-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                        title="Send message"
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                    </button>
                ) : (
                    <button
                        type="button"
                        className="text-blue-600 hover:text-blue-700 transition-colors flex-shrink-0 disabled:opacity-50"
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
    );
}
