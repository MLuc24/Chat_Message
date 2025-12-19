// useWebSocket Hook - WebSocket lifecycle management

import { useEffect, useRef } from 'react';
import { socketManager } from '@/services/websocket/socketManager';
import { useAuthStore } from '@/stores/authStore';

export function useWebSocket() {
    const token = useAuthStore((state) => state.token);
    const hasConnected = useRef(false);

    useEffect(() => {
        // Only connect once per token
        if (token && !hasConnected.current && !socketManager.isConnected) {
            socketManager.connect(token);
            hasConnected.current = true;
        }

        // Reset flag when token changes (logout/login)
        if (!token) {
            hasConnected.current = false;
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
