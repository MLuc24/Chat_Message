// WebSocket Manager for real-time communication

import { io, Socket } from 'socket.io-client';
import { config } from '@/config/env';

type EventHandler = (...args: any[]) => void;

class SocketManager {
    private socket: Socket | null = null;
    private eventHandlers = new Map<string, Set<EventHandler>>();
    private isConnecting = false;

    connect(token: string): void {
        // Prevent multiple simultaneous connection attempts
        if (this.isConnecting) {
            console.warn('[WebSocket] Connection already in progress');
            return;
        }

        if (this.socket?.connected) {
            console.warn('[WebSocket] Socket already connected');
            return;
        }

        // Disconnect existing socket if any
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
        }

        this.isConnecting = true;
        this.socket = io(config.wsUrl, {
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            transports: ['websocket', 'polling'],
        });

        this.socket.on('connect', () => {
            this.isConnecting = false;
            // Authenticate after connection
            this.socket?.emit('authenticate', { token });
        });

        this.socket.on('authenticated', (data) => {
            // Authenticated successfully
        });

        this.socket.on('unauthorized', (data) => {
            console.error('[WebSocket] Authentication failed:', data);
            this.disconnect();
        });

        this.socket.on('disconnect', (reason) => {
            this.isConnecting = false;
        });

        this.socket.on('connect_error', (error) => {
            this.isConnecting = false;
            console.error('[WebSocket] Connection error:', error);
        });

        // Re-authenticate on reconnect (handlers are already registered)
        this.socket.on('reconnect', () => {
            this.socket?.emit('authenticate', { token });
        });
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.removeAllListeners();
            this.socket.disconnect();
            this.socket = null;
            this.eventHandlers.clear();
            this.isConnecting = false;
        }
    }

    on(event: string, handler: EventHandler): void {
        // Remove existing handler first to prevent duplicates
        this.off(event, handler);

        if (!this.eventHandlers.has(event)) {
            this.eventHandlers.set(event, new Set());
        }

        this.eventHandlers.get(event)?.add(handler);

        if (this.socket) {
            this.socket.on(event, handler);
        }
    }

    off(event: string, handler: EventHandler): void {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
            handlers.delete(handler);
            if (handlers.size === 0) {
                this.eventHandlers.delete(event);
            }
        }

        if (this.socket) {
            this.socket.off(event, handler);
        }
    }

    emit(event: string, data?: any): void {
        if (!this.socket?.connected) {
            console.warn('[WebSocket] Cannot emit, socket not connected');
            return;
        }

        this.socket.emit(event, data);
    }

    get isConnected(): boolean {
        return this.socket?.connected ?? false;
    }
}

export const socketManager = new SocketManager();
