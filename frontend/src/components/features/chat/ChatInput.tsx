// ChatInput Component - Message input with send button

import { useState, useRef, useEffect } from 'react';
import type { FormEvent, KeyboardEvent, ChangeEvent } from 'react';
import { uploadService, type UploadProgress, type UploadResult } from '../../../services/api/uploadService';
import type { MediaItem } from '../../../types/chat.types';
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
    onSendMediaGroup?: (mediaItems: MediaItem[]) => void;
    onSendVoice?: (audioBlob: Blob, duration: number) => void;
    onSendLocation?: (location: {
        latitude: number;
        longitude: number;
        accuracy?: number;
        address?: string;
    }) => void;
    onSendFile?: (fileUrl: string, fileName: string, fileSize: number, fileType: string) => void;
    disabled?: boolean;
    onUploadingFilesChange?: (files: UploadingFile[]) => void;
}

interface UploadingFile {
    id: string;
    file: File;
    preview: string;
    progress: number;
    type: 'image' | 'video' | 'file';
}

export function ChatInput({ onSend, onSendMedia, onSendMediaGroup, onSendVoice, onSendLocation, onSendFile, disabled, onUploadingFilesChange }: ChatInputProps) {
    const [message, setMessage] = useState('');
    const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync uploadingFiles with parent
    useEffect(() => {
        if (onUploadingFilesChange) {
            onUploadingFilesChange(uploadingFiles);
        }
    }, [uploadingFiles, onUploadingFilesChange]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (message.trim() && uploadingFiles.length === 0) {
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
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Validate total number of files (max 10 at once)
        if (files.length > 10) {
            alert('You can only upload up to 10 files at once');
            if (e.target) e.target.value = '';
            return;
        }

        // Process each file
        const newUploadingFiles: UploadingFile[] = files.map((file, index) => {
            const isImage = file.type.startsWith('image/');
            const isVideo = file.type.startsWith('video/');
            const fileType = isImage ? 'image' : isVideo ? 'video' : 'file';
            const preview = isImage || isVideo ? URL.createObjectURL(file) : '';
            const fileId = `${Date.now()}-${index}-${Math.random()}`;

            return {
                id: fileId,
                file,
                preview,
                progress: 0,
                type: fileType,
            };
        });
        
        // Add all files to uploading state
        setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

        // Upload all files and collect results
        const uploadResults = await Promise.allSettled(
            newUploadingFiles.map(uploadingFile => 
                uploadSingleFileWithoutSending(uploadingFile)
            )
        );

        // Separate successful uploads by type
        const successfulUploads = uploadResults
            .map((result, index) => ({
                result,
                uploadingFile: newUploadingFiles[index]
            }))
            .filter(({ result }) => result.status === 'fulfilled')
            .map(({ result, uploadingFile }) => ({
                uploadResult: (result as PromiseFulfilledResult<UploadResult>).value,
                fileType: uploadingFile.type
            }));

        // Group media files (images + videos) together
        const mediaUploads = successfulUploads.filter(u => u.fileType === 'image' || u.fileType === 'video');
        const documentUploads = successfulUploads.filter(u => u.fileType === 'file');

        // Send media as grouped message if there are multiple
        if (mediaUploads.length > 0) {
            if (mediaUploads.length === 1 && onSendMedia) {
                // Single media - send normally
                const { uploadResult, fileType } = mediaUploads[0];
                onSendMedia(uploadResult.secureUrl, fileType as 'image' | 'video', {
                    publicId: uploadResult.publicId,
                    width: uploadResult.width,
                    height: uploadResult.height,
                    duration: uploadResult.duration,
                    thumbnailUrl: uploadResult.thumbnailUrl,
                });
            } else if (mediaUploads.length > 1 && onSendMediaGroup) {
                // Multiple media - send as grouped message
                onSendMediaGroup(mediaUploads.map(({ uploadResult, fileType }) => ({
                    url: uploadResult.secureUrl,
                    type: fileType as 'image' | 'video',
                    publicId: uploadResult.publicId,
                    width: uploadResult.width,
                    height: uploadResult.height,
                    duration: uploadResult.duration,
                    thumbnailUrl: uploadResult.thumbnailUrl,
                })));
            }
        }

        // Send document files separately
        if (documentUploads.length > 0 && onSendFile) {
            for (const { uploadResult } of documentUploads) {
                const originalFile = newUploadingFiles.find(f => f.preview === '' && f.type === 'file')?.file;
                if (originalFile) {
                    onSendFile(uploadResult.secureUrl, originalFile.name, originalFile.size, originalFile.type);
                }
            }
        }

        // Reset input
        if (e.target) e.target.value = '';
    };

    const uploadSingleFileWithoutSending = async (uploadingFile: UploadingFile) => {
        const { id: fileId, file, preview, type: fileType } = uploadingFile;
        const isImage = fileType === 'image';
        const isVideo = fileType === 'video';

        try {
            let uploadType: 'chat_image' | 'chat_video' | 'chat_document' = 'chat_image';
            if (isImage) uploadType = 'chat_image';
            else if (isVideo) uploadType = 'chat_video';
            else uploadType = 'chat_document';

            const result = await uploadService.upload(
                file,
                uploadType,
                '/chat',
                (progress: UploadProgress) => {
                    setUploadingFiles(prev => prev.map(f => 
                        f.id === fileId ? { ...f, progress: progress.percentage } : f
                    ));
                }
            );

            // Remove from uploading list
            setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
            if (preview) URL.revokeObjectURL(preview);

            return result;
        } catch (error) {
            console.error('Failed to upload file:', error);
            
            // Remove from uploading on error
            setUploadingFiles(prev => prev.filter(f => f.id !== fileId));
            if (preview) URL.revokeObjectURL(preview);
            
            // Show error for this specific file
            const fileName = file.name.length > 20 ? file.name.substring(0, 20) + '...' : file.name;
            alert(`Failed to upload "${fileName}": ${error instanceof Error ? error.message : 'Unknown error'}`);
            
            throw error;
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

            <div className="flex items-center gap-3">
                {/* Hidden file input for all file types - supports multiple selection */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.zip,.rar,.7z"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                    disabled={disabled || uploadingFiles.length > 0}
                />

                {/* Add Media/File Button - supports image, video, and files */}
                <button
                    type="button"
                    className="hover:bg-blue-50 transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed rounded-full p-1.5 chat-icon"
                    style={{ color: 'var(--chat-icon-secondary)' }}
                    title="Add photos, videos or files (max 10 at once)"
                    disabled={disabled || uploadingFiles.length > 0}
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
                    className="hover:bg-blue-50 transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed rounded-full p-1.5 chat-icon"
                    style={{ color: 'var(--chat-icon-secondary)' }}
                    title="Record voice message"
                    disabled={disabled || uploadingFiles.length > 0}
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
                    className="hover:bg-blue-50 transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed rounded-full p-1.5 chat-icon"
                    style={{ color: 'var(--chat-icon-secondary)' }}
                    title="Share location"
                    disabled={disabled || uploadingFiles.length > 0}
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
                        className="hover:bg-blue-50 transition-all flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed rounded-full p-1.5 chat-icon"
                        style={{ color: 'var(--chat-icon-secondary)' }}
                        title="Add emoji"
                        disabled={disabled || uploadingFiles.length > 0}
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
                        disabled={disabled || uploadingFiles.length > 0}
                        className="w-full px-4 py-2.5 border-0 rounded-full text-sm focus:outline-none transition-colors disabled:opacity-50"
                        style={{ 
                            backgroundColor: 'var(--chat-input-bg)',
                            borderColor: 'var(--chat-input-border)'
                        }}
                    />
                </div>

                {/* Send button or Thumbs up */}
                {message.trim() ? (
                    <button
                        type="submit"
                        disabled={disabled || uploadingFiles.length > 0}
                        className="hover:bg-blue-50 disabled:text-gray-300 disabled:cursor-not-allowed transition-all flex-shrink-0 rounded-full p-1.5 chat-icon"
                        style={{ color: disabled ? undefined : 'var(--chat-icon-primary)' }}
                        title="Send message"
                    >
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                        </svg>
                    </button>
                ) : (
                    <button
                        type="button"
                        className="hover:bg-blue-50 transition-all flex-shrink-0 disabled:opacity-50 rounded-full p-1.5 chat-icon"
                        style={{ color: 'var(--chat-icon-primary)' }}
                        title="Send like"
                        onClick={() => onSend('👍')}
                        disabled={disabled || uploadingFiles.length > 0}
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
