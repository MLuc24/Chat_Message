// MessageReactionPicker Component - Emoji picker for message reactions

import { memo } from 'react';

interface MessageReactionPickerProps {
    onSelectEmoji: (emoji: string) => void;
    position?: 'top' | 'bottom';
    align?: 'left' | 'right';
}

const QUICK_REACTIONS = [
    '❤️',  // Heart
    '😂',  // Laughing
    '😮',  // Surprised
    '😢',  // Sad
    '😡',  // Angry
    '👍',  // Thumbs up
];

export const MessageReactionPicker = memo(function MessageReactionPicker({
    onSelectEmoji,
    position = 'top',
    align = 'left'
}: MessageReactionPickerProps) {
    return (
        <div 
            className={`absolute z-50 ${position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} ${align === 'right' ? 'right-0' : 'left-0'}`}
            onClick={(e) => e.stopPropagation()}
        >
            <div className="bg-white dark:bg-gray-800 rounded-full shadow-2xl border border-gray-200 dark:border-gray-700 px-2 py-2 flex items-center gap-1 animate-in fade-in zoom-in-95 duration-200">
                {QUICK_REACTIONS.map((emoji) => (
                    <button
                        key={emoji}
                        onClick={() => onSelectEmoji(emoji)}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all transform hover:scale-125 active:scale-110"
                        title={`React with ${emoji}`}
                    >
                        <span className="text-2xl leading-none">{emoji}</span>
                    </button>
                ))}
                
                {/* More reactions button */}
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1" />
                <button
                    onClick={() => {
                        // TODO: Open full emoji picker
                        console.log('Open full emoji picker');
                    }}
                    className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                    title="More reactions"
                >
                    <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                </button>
            </div>
        </div>
    );
});
