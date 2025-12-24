// DefaultEmojiPicker - Modal to select default emoji for quick reactions
import { memo, useState, useCallback, useMemo, useEffect } from 'react';
import { Modal } from '../../common/Modal';
import { EMOJI_CATEGORIES, getFrequentEmojis, searchEmojis } from '../../../utils/emojiData';

interface DefaultEmojiPickerProps {
    isOpen: boolean;
    currentEmoji: string;
    onSelect: (emoji: string) => Promise<void>;
    onClose: () => void;
}

// Popular emojis for quick reactions (shown first)
const POPULAR_REACTIONS = [
    '👍', '❤️', '😂', '😮', '😢', '🙏',
    '👏', '🔥', '💯', '🎉', '😍', '🤔',
    '😊', '👌', '✨', '💪', '🤝', '🙌',
    '😎', '💙', '💚', '💛', '💜', '🖤',
];

export const DefaultEmojiPicker = memo(function DefaultEmojiPicker({
    isOpen,
    currentEmoji,
    onSelect,
    onClose,
}: DefaultEmojiPickerProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [selectedEmoji, setSelectedEmoji] = useState(currentEmoji);
    const [selectedCategoryId, setSelectedCategoryId] = useState('popular');
    const [searchQuery, setSearchQuery] = useState('');
    const [frequentEmojis, setFrequentEmojis] = useState<string[]>([]);

    // Load frequent emojis when modal opens
    useEffect(() => {
        if (isOpen) {
            setFrequentEmojis(getFrequentEmojis());
            setSelectedEmoji(currentEmoji);
            setSearchQuery('');
            setSelectedCategoryId('popular');
        }
    }, [isOpen, currentEmoji]);

    // Get current category data
    const selectedCategory = EMOJI_CATEGORIES.find((cat) => cat.id === selectedCategoryId);

    // Memoize emojis to display
    const emojisToShow = useMemo(() => {
        if (searchQuery.trim()) {
            return searchEmojis(searchQuery);
        } else if (selectedCategoryId === 'popular') {
            return POPULAR_REACTIONS;
        } else if (selectedCategoryId === 'frequent') {
            return frequentEmojis.length > 0 ? frequentEmojis : POPULAR_REACTIONS;
        } else {
            return selectedCategory?.emojis || [];
        }
    }, [searchQuery, selectedCategoryId, frequentEmojis, selectedCategory]);

    const handleEmojiClick = useCallback((emoji: string) => {
        setSelectedEmoji(emoji);
    }, []);

    const handleSave = useCallback(async () => {
        if (selectedEmoji === currentEmoji) {
            onClose();
            return;
        }

        setIsLoading(true);
        try {
            await onSelect(selectedEmoji);
            onClose();
        } catch (error) {
            console.error('Failed to update emoji:', error);
        } finally {
            setIsLoading(false);
        }
    }, [selectedEmoji, currentEmoji, onSelect, onClose]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Chọn biểu tượng cảm xúc">
            <div className="space-y-4">
                {/* Description */}
                <p className="text-sm text-gray-600">
                    Chọn emoji mặc định để gửi nhanh khi không nhập tin nhắn
                </p>

                {/* Search Bar */}
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Tìm kiếm emoji..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Category Tabs */}
                {!searchQuery && (
                    <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-2">
                        {/* Popular category */}
                        <button
                            onClick={() => setSelectedCategoryId('popular')}
                            className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                                selectedCategoryId === 'popular'
                                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            ⭐ Phổ biến
                        </button>

                        {/* Frequent category */}
                        <button
                            onClick={() => setSelectedCategoryId('frequent')}
                            className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                                selectedCategoryId === 'frequent'
                                    ? 'bg-blue-100 text-blue-700 shadow-sm'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            🕐 Thường dùng
                        </button>

                        {/* Category buttons */}
                        {EMOJI_CATEGORIES.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setSelectedCategoryId(category.id)}
                                className={`flex-shrink-0 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                                    selectedCategoryId === category.id
                                        ? 'bg-blue-100 text-blue-700 shadow-sm'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                                title={category.name}
                            >
                                {category.icon} {category.name}
                            </button>
                        ))}
                    </div>
                )}

                {/* Emoji Grid */}
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="grid grid-cols-8 gap-1 max-h-[280px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
                        {emojisToShow.length > 0 ? (
                            emojisToShow.map((emoji, index) => (
                                <button
                                    key={`${emoji}-${index}`}
                                    onClick={() => handleEmojiClick(emoji)}
                                    className={`
                                        text-2xl p-2 rounded-lg transition-all
                                        hover:bg-blue-50 hover:scale-125
                                        active:scale-95
                                        ${selectedEmoji === emoji
                                            ? 'bg-blue-100 ring-2 ring-blue-500 scale-125'
                                            : 'bg-white hover:shadow-sm'
                                        }
                                    `}
                                    title={emoji}
                                >
                                    {emoji}
                                </button>
                            ))
                        ) : (
                            <div className="col-span-8 text-center text-gray-400 py-8 text-sm">
                                {searchQuery ? 'Không tìm thấy emoji' : 'Chưa có emoji thường dùng'}
                            </div>
                        )}
                    </div>
                </div>

                {/* Preview */}
                <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
                    <span className="text-sm font-medium text-gray-700">Emoji đã chọn:</span>
                    <span className="text-4xl">{selectedEmoji}</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isLoading}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                    >
                        {isLoading && (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        )}
                        Lưu
                    </button>
                </div>
            </div>
        </Modal>
    );
});
