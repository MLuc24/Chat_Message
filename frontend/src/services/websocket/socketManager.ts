// WebSocket Manager for real-time communication

import { io, Socket } from 'socket.io-client';
import { config } from '@/config/env';

type EventHandler = (...args: any[]) => void;

class SocketManager {
    private socket: Socket | null = null;
    private eventHandlers = new Map<string, Set<EventHandler>>();

    connect(token: string): void {
        if (this.socket?.connected) {
            console.warn('Socket already connected');
            return;
        }

        this.socket = io(config.wsUrl, {
            auth: { token },
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });

        this.socket.on('connect', () => {
            console.log('[WebSocket] Connected');
        });

        this.socket.on('disconnect', (reason) => {
            console.log('[WebSocket] Disconnected:', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('[WebSocket] Connection error:', error);
        });

        // Re-register all event handlers on reconnect
        this.socket.on('connect', () => {
            this.eventHandlers.forEach((handlers, event) => {
                handlers.forEach((handler) => {
                    this.socket?.on(event, handler);
                });
            });
        });
    }

    disconnect(): void {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.eventHandlers.clear();
            console.log('[WebSocket] Disconnected and cleaned up');
        }
    }

    on(event: string, handler: EventHandler): void {
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
