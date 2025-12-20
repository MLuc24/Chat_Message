import { memo, useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { EMOJI_CATEGORIES, getFrequentEmojis, addFrequentEmoji, searchEmojis } from '../../../utils/emojiData';

interface EmojiPickerProps {
    onEmojiSelect: (emoji: string) => void;
    onClose: () => void;
}

export const EmojiPicker = memo(function EmojiPicker({ onEmojiSelect, onClose }: EmojiPickerProps) {
    const [selectedCategoryId, setSelectedCategoryId] = useState('smileys');
    const [searchQuery, setSearchQuery] = useState('');
    const [frequentEmojis, setFrequentEmojis] = useState<string[]>([]);
    const pickerRef = useRef<HTMLDivElement>(null);

    // Load frequent emojis on mount
    useEffect(() => {
        setFrequentEmojis(getFrequentEmojis());
    }, []);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    // Get current category data
    const selectedCategory = EMOJI_CATEGORIES.find((cat) => cat.id === selectedCategoryId);
    
    // Memoize emojis to display - tối ưu hiệu năng
    const emojisToShow = useMemo(() => {
        if (searchQuery.trim()) {
            return searchEmojis(searchQuery);
        } else if (selectedCategoryId === 'frequent') {
            return frequentEmojis;
        } else {
            return selectedCategory?.emojis || [];
        }
    }, [searchQuery, selectedCategoryId, frequentEmojis, selectedCategory]);

    const handleEmojiClick = useCallback((emoji: string) => {
        onEmojiSelect(emoji);
        addFrequentEmoji(emoji);
        setFrequentEmojis(getFrequentEmojis());
        onClose();
    }, [onEmojiSelect, onClose]);

    return (
        <div
            ref={pickerRef}
            className="absolute bottom-full left-0 mb-2 w-[350px] bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden z-50"
        >
            {/* Header with Search */}
            <div className="p-3 border-b border-gray-200 bg-gray-50">
                <input
                    type="text"
                    placeholder="Tìm kiếm biểu tượng cảm xúc"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    autoFocus
                />
            </div>

            {/* Category Tabs */}
            <div className="flex items-center gap-1 px-3 py-2 bg-white border-b border-gray-100 overflow-x-auto scrollbar-hide">
                {/* Frequent category */}
                <button
                    onClick={() => {
                        setSelectedCategoryId('frequent');
                        setSearchQuery('');
                    }}
                    className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg text-xl transition-all ${
                        selectedCategoryId === 'frequent'
                            ? 'bg-blue-100 shadow-sm scale-110'
                            : 'hover:bg-gray-100'
                    }`}
                    title="Thường dùng"
                >
                    🕐
                </button>

                {/* Category buttons */}
                {EMOJI_CATEGORIES.map((category) => (
                    <button
                        key={category.id}
                        onClick={() => {
                            setSelectedCategoryId(category.id);
                            setSearchQuery('');
                        }}
                        className={`flex-shrink-0 w-10 h-10 flex items-center justify-center rounded-lg text-xl transition-all ${
                            selectedCategoryId === category.id
                                ? 'bg-blue-100 shadow-sm scale-110'
                                : 'hover:bg-gray-100'
                        }`}
                        title={category.name}
                    >
                        {category.icon}
                    </button>
                ))}
            </div>

            {/* Emoji Grid - Tối ưu với will-change và transform */}
            <div className="p-2 bg-white">
                <div className="grid grid-cols-10 gap-0.5 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                    {emojisToShow.length > 0 ? (
                        emojisToShow.map((emoji, index) => (
                            <button
                                key={`${emoji}-${index}`}
                                onClick={() => handleEmojiClick(emoji)}
                                className="text-xl p-1.5 hover:bg-blue-50 rounded-md transition-transform active:scale-95 will-change-transform"
                                title={emoji}
                            >
                                {emoji}
                            </button>
                        ))
                    ) : (
                        <div className="col-span-10 text-center text-gray-400 py-12 text-sm">
                            {searchQuery ? 'Không tìm thấy emoji' : 'Chưa có emoji thường dùng'}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
