import { useState, useEffect } from 'react';
import { useWebSocket } from './useWebSocket';

interface OnlineUser {
    userId: string;
    status: 'online' | 'offline' | 'away' | 'busy';
    lastSeen?: Date;
}

interface UseOnlineStatusReturn {
    onlineUsers: Map<string, OnlineUser>;
    isUserOnline: (userId: string) => boolean;
    getUserStatus: (userId: string) => OnlineUser | null;
}

export function useOnlineStatus(): UseOnlineStatusReturn {
    const [onlineUsers, setOnlineUsers] = useState<Map<string, OnlineUser>>(new Map());
    const { on, off, emit, isConnected } = useWebSocket();

    useEffect(() => {
        if (!isConnected) return;

        // Listen for user online status changes
        const handleUserOnline = (data: { userId: string; status: string }) => {
            setOnlineUsers((prev) => {
                const newMap = new Map(prev);
                newMap.set(data.userId, {
                    userId: data.userId,
                    status: data.status as OnlineUser['status'],
                    lastSeen: new Date(),
                });
                return newMap;
            });
        };

        const handleUserOffline = (data: { userId: string }) => {
            setOnlineUsers((prev) => {
                const newMap = new Map(prev);
                const user = newMap.get(data.userId);
                if (user) {
                    newMap.set(data.userId, {
                        ...user,
                        status: 'offline',
                        lastSeen: new Date(),
                    });
                }
                return newMap;
            });
        };

        const handleOnlineUsersList = (data: { users: Array<{ userId: string; status: string }> }) => {
            const newMap = new Map<string, OnlineUser>();
            data.users.forEach((user) => {
                newMap.set(user.userId, {
                    userId: user.userId,
                    status: user.status as OnlineUser['status'],
                    lastSeen: new Date(),
                });
            });
            setOnlineUsers(newMap);
        };

        // Register event listeners
        on('user:online', handleUserOnline);
        on('user:offline', handleUserOffline);
        on('user:status_change', handleUserOnline);
        on('online_users', handleOnlineUsersList);

        // Request initial online users list
        emit('get_online_users');

        // Cleanup
        return () => {
            off('user:online', handleUserOnline);
            off('user:offline', handleUserOffline);
            off('user:status_change', handleUserOnline);
            off('online_users', handleOnlineUsersList);
        };
    }, [on, off, emit, isConnected]);

    const isUserOnline = (userId: string): boolean => {
        const user = onlineUsers.get(userId);
        return user?.status === 'online';
    };

    const getUserStatus = (userId: string): OnlineUser | null => {
        return onlineUsers.get(userId) || null;
    };

    return {
        onlineUsers,
        isUserOnline,
        getUserStatus,
    };
}
