// useWebSocket Hook - WebSocket lifecycle management

import { useEffect } from 'react';
import { socketManager } from '@/services/websocket/socketManager';
import { useAuthStore } from '@/stores/authStore';

export function useWebSocket() {
    const token = useAuthStore((state) => state.token);

    useEffect(() => {
        if (token && !socketManager.isConnected) {
            socketManager.connect(token);
        }

        return () => {
            // Don't disconnect on unmount, let logout handle it
        };
    }, [token]);

    return {
        isConnected: socketManager.isConnected,
        emit: socketManager.emit.bind(socketManager),
        on: socketManager.on.bind(socketManager),
        off: socketManager.off.bind(socketManager),
    };
}
