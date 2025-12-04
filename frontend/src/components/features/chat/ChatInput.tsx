// ChatInput Component - Message input with send button

import { useState } from 'react';
import type { FormEvent, KeyboardEvent } from 'react';
import { Button } from '@/components/common/Button';

interface ChatInputProps {
    onSend: (message: string) => void;
    disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
    const [message, setMessage] = useState('');

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();
        if (message.trim()) {
            onSend(message.trim());
            setMessage('');
        }
    };

    const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as any);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4">
            <div className="flex gap-2">
                <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    disabled={disabled}
                    className="flex-1 resize-none border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows={1}
                />
                <Button type="submit" disabled={disabled || !message.trim()}>
                    Send
                </Button>
            </div>
        </form>
    );
}
