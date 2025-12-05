// App-wide constants

export const ROUTES = {
    LOGIN: '/login',
    REGISTER: '/register',
    CHAT: '/chat',
    PROFILE: '/profile',
} as const;

export const API_ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/register',
        REFRESH: '/auth/refresh',
        LOGOUT: '/auth/logout',
    },
    USERS: {
        PROFILE: (userId: string) => `/users/profile/${userId}`,
        UPDATE_PROFILE: '/users/profile',
        SEARCH: '/users/search',
    },
    CHAT: {
        CONVERSATIONS: '/chat/conversations',
        CONVERSATION: (id: string) => `/chat/conversations/${id}`,
        MESSAGES: (conversationId: string) => `/chat/conversations/${conversationId}/messages`,
        SEND_MESSAGE: '/chat/messages',
        DELETE_MESSAGE: (messageId: string) => `/chat/messages/${messageId}`,
    },
} as const;

export const WS_EVENTS = {
    // Client -> Server
    AUTHENTICATE: 'authenticate',
    JOIN_CONVERSATION: 'join_conversation',
    LEAVE_CONVERSATION: 'leave_conversation',
    SEND_MESSAGE: 'send_message',
    TYPING_START: 'typing_start',
    TYPING_STOP: 'typing_stop',

    // Server -> Client
    AUTHENTICATED: 'authenticated',
    MESSAGE_NEW: 'message_new',
    MESSAGE_UPDATED: 'message_updated',
    MESSAGE_DELETED: 'message_deleted',
    USER_TYPING: 'user_typing',
    USER_ONLINE: 'user_online',
    USER_OFFLINE: 'user_offline',
} as const;

export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    REFRESH_TOKEN: 'refresh_token',
    USER: 'user',
} as const;
