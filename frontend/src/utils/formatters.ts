// Utility functions for formatting

export function formatTimestamp(date: string | Date | null | undefined): string {
    // Handle null/undefined
    if (!date) {
        return 'N/A';
    }
    
    const messageDate = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(messageDate.getTime())) {
        return 'N/A';
    }
    
    const now = new Date();
    const diffMs = now.getTime() - messageDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
    }).format(messageDate);
}

export function formatDate(date: string | Date | null | undefined): string {
    // Handle null/undefined
    if (!date) {
        return 'N/A';
    }
    
    const d = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(d.getTime())) {
        return 'N/A';
    }
    
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(d);
}

export function formatTime(date: string | Date | null | undefined): string {
    // Handle null/undefined
    if (!date) {
        return 'N/A';
    }
    
    const d = typeof date === 'string' ? new Date(date) : date;
    
    // Check if date is valid
    if (isNaN(d.getTime())) {
        return 'N/A';
    }
    
    return new Intl.DateTimeFormat('en-US', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(d);
}
