# Frontend Development Guidelines

## 📋 Mục Lục
- [Tổng Quan](#tổng-quan)
- [Kiến Trúc Ứng Dụng](#kiến-trúc-ứng-dụng)
- [Cấu Trúc Thư Mục](#cấu-trúc-thư-mục)
- [Nguyên Tắc Code](#nguyên-tắc-code)
- [Quản Lý State](#quản-lý-state)
- [Component Guidelines](#component-guidelines)
- [API Integration](#api-integration)
- [Styling Standards](#styling-standards)
- [Testing Standards](#testing-standards)

---

## Tổng Quan

### Mục Tiêu
- ✅ **Maintainable**: Dễ bảo trì, mở rộng
- ✅ **Scalable**: Có thể scale khi tăng features
- ✅ **Reusable**: Tái sử dụng components, logic
- ✅ **Testable**: Dễ viết unit tests
- ✅ **Clean Code**: Code rõ ràng, dễ đọc

### Công Nghệ Stack
- **Framework**: React 18+ với TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand (lightweight, scalable)
- **HTTP Client**: Axios
- **WebSocket**: Socket.io-client
- **Routing**: React Router v6
- **Form Handling**: React Hook Form + Zod
- **Styling**: TailwindCSS + CSS Modules cho custom components
- **UI Components**: Headless UI (accessible, customizable)

---

## Kiến Trúc Ứng Dụng

### 1. Layered Architecture (Phân Lớp)

```
┌─────────────────────────────────────┐
│   Presentation Layer (UI)           │  ← Components, Pages
├─────────────────────────────────────┤
│   Application Layer (Logic)         │  ← Hooks, Stores, Utils
├─────────────────────────────────────┤
│   Infrastructure Layer (External)   │  ← API Services, WebSocket
└─────────────────────────────────────┘
```

#### **Presentation Layer**
- Components: Chỉ quan tâm đến hiển thị UI
- Pages: Kết hợp components thành các trang hoàn chỉnh
- **Nguyên tắc**: Không chứa business logic, chỉ gọi hooks/stores

#### **Application Layer**
- Custom Hooks: Chứa logic tái sử dụng
- Stores (Zustand): Quản lý global state
- Utils/Helpers: Pure functions, không side effects
- **Nguyên tắc**: Tách biệt logic khỏi UI, có thể test độc lập

#### **Infrastructure Layer**
- API Services: Tất cả HTTP requests
- WebSocket Manager: Quản lý real-time connections
- **Nguyên tắc**: Single source of truth cho external communication

### 2. Dependency Flow

```
Components → Hooks → Stores → Services → Backend API
     ↑                            ↓
     └────────── Events ──────────┘
```

**Quy tắc vàng**: 
- Components **không bao giờ** gọi trực tiếp Services
- Services **chỉ** được gọi từ Stores hoặc Hooks
- State flow **một chiều** từ Stores xuống Components

---

## Cấu Trúc Thư Mục

```
frontend/
├── public/                    # Static assets
├── src/
│   ├── assets/               # Images, fonts, icons
│   ├── components/           # Reusable components
│   │   ├── common/          # Buttons, Inputs, Cards
│   │   ├── layout/          # Header, Sidebar, Layout
│   │   └── features/        # Feature-specific components
│   │       ├── auth/        # Login, Register forms
│   │       ├── chat/        # ChatWindow, MessageList
│   │       └── user/        # UserProfile, UserList
│   ├── pages/               # Page components (routes)
│   │   ├── LoginPage.tsx
│   │   ├── ChatPage.tsx
│   │   └── ProfilePage.tsx
│   ├── hooks/               # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useChat.ts
│   │   └── useWebSocket.ts
│   ├── stores/              # Zustand stores
│   │   ├── authStore.ts
│   │   ├── chatStore.ts
│   │   └── userStore.ts
│   ├── services/            # API & External services
│   │   ├── api/
│   │   │   ├── authService.ts
│   │   │   ├── chatService.ts
│   │   │   └── userService.ts
│   │   ├── websocket/
│   │   │   └── socketManager.ts
│   │   └── http.ts          # Axios instance với interceptors
│   ├── types/               # TypeScript type definitions
│   │   ├── api.types.ts
│   │   ├── chat.types.ts
│   │   └── user.types.ts
│   ├── utils/               # Utility functions
│   │   ├── formatters.ts    # Date, number formatting
│   │   ├── validators.ts    # Input validation
│   │   └── constants.ts     # App constants
│   ├── config/              # Configuration files
│   │   └── env.ts           # Environment variables
│   ├── App.tsx
│   ├── main.tsx
│   └── routes.tsx
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── tsconfig.json
├── vite.config.ts
└── package.json
```

### Quy Tắc Đặt Tên File
- **Components**: PascalCase (`ChatWindow.tsx`)
- **Hooks**: camelCase với prefix `use` (`useAuth.ts`)
- **Stores**: camelCase với suffix `Store` (`authStore.ts`)
- **Services**: camelCase với suffix `Service` (`chatService.ts`)
- **Types**: camelCase với suffix `.types` (`chat.types.ts`)
- **Utils**: camelCase (`formatters.ts`)

---

## Nguyên Tắc Code

### 1. SOLID Principles

#### **S - Single Responsibility**
Mỗi component/function chỉ làm một việc.

```typescript
// ❌ BAD: Component làm quá nhiều việc
function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  
  useEffect(() => {
    // Fetch messages
    axios.get('/api/messages').then(setMessages);
    // Fetch users
    axios.get('/api/users').then(setUsers);
    // Setup WebSocket
    const socket = io();
    socket.on('message', handleMessage);
  }, []);
  
  return (/* complex JSX */);
}

// ✅ GOOD: Tách biệt responsibilities
function ChatPage() {
  const messages = useMessages();
  const users = useUsers();
  const { isConnected } = useWebSocket();
  
  return <ChatLayout messages={messages} users={users} />;
}
```

#### **O - Open/Closed**
Mở cho mở rộng, đóng cho sửa đổi.

```typescript
// ✅ GOOD: Dùng composition pattern
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger';
  children: ReactNode;
}

function Button({ variant = 'primary', children, ...props }: ButtonProps) {
  const variantStyles = {
    primary: 'bg-blue-500',
    secondary: 'bg-gray-500',
    danger: 'bg-red-500',
  };
  
  return (
    <button className={variantStyles[variant]} {...props}>
      {children}
    </button>
  );
}
```

#### **L - Liskov Substitution**
Derived types phải thay thế được base types.

```typescript
// ✅ GOOD: Interface cho input types
interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
}

function TextInput({ value, onChange }: TextInputProps) {
  return <input value={value} onChange={e => onChange(e.target.value)} />;
}

function PasswordInput({ value, onChange }: TextInputProps) {
  return <input type="password" value={value} onChange={e => onChange(e.target.value)} />;
}
```

#### **I - Interface Segregation**
Chia nhỏ interfaces, không ép client implement những gì không cần.

```typescript
// ✅ GOOD: Chia nhỏ interface
interface Authenticatable {
  login(credentials: LoginCredentials): Promise<User>;
  logout(): void;
}

interface Registerable {
  register(data: RegisterData): Promise<User>;
}

interface AuthService extends Authenticatable, Registerable {
  refreshToken(): Promise<string>;
}
```

#### **D - Dependency Inversion**
Phụ thuộc vào abstractions, không phụ thuộc vào implementations.

```typescript
// ✅ GOOD: Inject dependencies
interface StorageAdapter {
  get(key: string): string | null;
  set(key: string, value: string): void;
}

class LocalStorageAdapter implements StorageAdapter {
  get(key: string) { return localStorage.getItem(key); }
  set(key: string, value: string) { localStorage.setItem(key, value); }
}

class AuthStore {
  constructor(private storage: StorageAdapter) {}
  
  saveToken(token: string) {
    this.storage.set('token', token);
  }
}
```

### 2. DRY (Don't Repeat Yourself)

```typescript
// ❌ BAD: Lặp code
function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  return (
    <>
      <input value={email} onChange={e => setEmail(e.target.value)} />
      <input value={password} onChange={e => setPassword(e.target.value)} />
    </>
  );
}

// ✅ GOOD: Tạo reusable hook
function useFormField(initialValue = '') {
  const [value, setValue] = useState(initialValue);
  const onChange = (e: ChangeEvent<HTMLInputElement>) => setValue(e.target.value);
  return { value, onChange };
}

function LoginForm() {
  const email = useFormField();
  const password = useFormField();
  
  return (
    <>
      <input {...email} />
      <input {...password} type="password" />
    </>
  );
}
```

### 3. Clean Code Principles

#### Đặt Tên Rõ Ràng
```typescript
// ❌ BAD
const d = new Date();
const u = fetchU();
function calc(x, y) { return x + y; }

// ✅ GOOD
const currentDate = new Date();
const currentUser = fetchCurrentUser();
function calculateTotal(price: number, quantity: number): number {
  return price * quantity;
}
```

#### Functions Nhỏ Gọn
```typescript
// ❌ BAD: Function quá dài
function processUserData(user) {
  // 50 lines of code...
}

// ✅ GOOD: Chia nhỏ
function processUserData(user: User) {
  const validated = validateUser(user);
  const normalized = normalizeUserData(validated);
  return transformForDisplay(normalized);
}
```

#### Comments Cần Thiết
```typescript
// ❌ BAD: Comment self-evident code
// Set name to John
const name = 'John';

// ✅ GOOD: Explain WHY, not WHAT
// Using debounce to prevent excessive API calls during typing
const debouncedSearch = debounce(searchUsers, 300);
```

---

## Quản Lý State

### 1. Zustand Store Pattern

```typescript
// stores/authStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { authService } from '@/services/api/authService';
import type { User, LoginCredentials } from '@/types/user.types';

interface AuthState {
  // State
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  setUser: (user: User) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        user: null,
        token: null,
        isLoading: false,
        error: null,
        
        // Actions
        login: async (credentials) => {
          set({ isLoading: true, error: null });
          try {
            const response = await authService.login(credentials);
            set({ 
              user: response.user, 
              token: response.accessToken,
              isLoading: false 
            });
          } catch (error) {
            set({ 
              error: error.message, 
              isLoading: false 
            });
            throw error;
          }
        },
        
        logout: () => {
          set({ user: null, token: null });
          authService.logout();
        },
        
        refreshToken: async () => {
          try {
            const token = await authService.refreshToken();
            set({ token });
          } catch (error) {
            get().logout();
          }
        },
        
        setUser: (user) => set({ user }),
        clearError: () => set({ error: null }),
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({ 
          user: state.user, 
          token: state.token 
        }),
      }
    )
  )
);
```

### 2. Custom Hook Pattern

```typescript
// hooks/useAuth.ts
import { useAuthStore } from '@/stores/authStore';
import { useCallback } from 'react';

export function useAuth() {
  const { user, token, isLoading, error, login, logout, clearError } = useAuthStore();
  
  const isAuthenticated = !!token;
  
  const handleLogin = useCallback(async (credentials: LoginCredentials) => {
    try {
      await login(credentials);
      return true;
    } catch (error) {
      return false;
    }
  }, [login]);
  
  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login: handleLogin,
    logout,
    clearError,
  };
}
```

### 3. State Guidelines

**Quy tắc chọn Local vs Global State:**

- ✅ **Local State** (useState): UI state, form inputs, toggles
- ✅ **Global State** (Zustand): User auth, chat messages, shared data
- ✅ **Server State** (React Query): API data, caching

```typescript
// ✅ GOOD: Local state cho UI
function Dropdown() {
  const [isOpen, setIsOpen] = useState(false);
  return (/* ... */);
}

// ✅ GOOD: Global state cho shared data
function ChatWindow() {
  const messages = useChatStore(state => state.messages);
  return (/* ... */);
}
```

---

## Component Guidelines

### 1. Component Structure

```typescript
// components/features/chat/ChatMessage.tsx
import { memo } from 'react';
import { formatTimestamp } from '@/utils/formatters';
import type { Message } from '@/types/chat.types';

// 1. Type definitions
interface ChatMessageProps {
  message: Message;
  isOwn: boolean;
  onDelete?: (messageId: string) => void;
}

// 2. Component
export const ChatMessage = memo(function ChatMessage({ 
  message, 
  isOwn,
  onDelete 
}: ChatMessageProps) {
  // 3. Hooks (nếu có)
  const formattedTime = formatTimestamp(message.createdAt);
  
  // 4. Event handlers
  const handleDelete = () => {
    onDelete?.(message.id);
  };
  
  // 5. Render
  return (
    <div className={`message ${isOwn ? 'message-own' : 'message-other'}`}>
      <div className="message-content">{message.content}</div>
      <div className="message-meta">
        <span>{formattedTime}</span>
        {isOwn && <button onClick={handleDelete}>Delete</button>}
      </div>
    </div>
  );
});
```

### 2. Component Types

#### **Presentational Components**
- Chỉ nhận props, không có logic phức tạp
- Dễ test, dễ reuse

```typescript
// ✅ GOOD: Pure presentational
interface ButtonProps {
  children: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

export function Button({ children, onClick, variant = 'primary', disabled }: ButtonProps) {
  return (
    <button 
      className={`btn btn-${variant}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

#### **Container Components**
- Chứa logic, gọi hooks/stores
- Connect data với presentational components

```typescript
// ✅ GOOD: Container with logic
export function ChatContainer() {
  const { messages, sendMessage } = useChat();
  const [inputValue, setInputValue] = useState('');
  
  const handleSend = () => {
    sendMessage(inputValue);
    setInputValue('');
  };
  
  return (
    <ChatWindow 
      messages={messages}
      inputValue={inputValue}
      onInputChange={setInputValue}
      onSend={handleSend}
    />
  );
}
```

### 3. Component Optimization

```typescript
// ✅ GOOD: Use memo for expensive renders
export const MessageList = memo(function MessageList({ messages }: Props) {
  return (
    <div>
      {messages.map(msg => (
        <ChatMessage key={msg.id} message={msg} />
      ))}
    </div>
  );
});

// ✅ GOOD: Use callback to prevent re-renders
function ChatInput({ onSend }: Props) {
  const handleSend = useCallback((text: string) => {
    onSend(text);
  }, [onSend]);
  
  return <input onSubmit={handleSend} />;
}
```

---

## API Integration

### 1. HTTP Service Setup

```typescript
// services/http.ts
import axios from 'axios';
import { useAuthStore } from '@/stores/authStore';

const http = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Add auth token
http.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle errors
http.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired, try refresh
      try {
        await useAuthStore.getState().refreshToken();
        return http.request(error.config);
      } catch {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

export { http };
```

### 2. Service Layer Pattern

```typescript
// services/api/chatService.ts
import { http } from '../http';
import type { Message, SendMessageDto, Conversation } from '@/types/chat.types';

class ChatService {
  private readonly basePath = '/chat';
  
  async getConversations(): Promise<Conversation[]> {
    const { data } = await http.get(`${this.basePath}/conversations`);
    return data;
  }
  
  async getMessages(conversationId: string): Promise<Message[]> {
    const { data } = await http.get(`${this.basePath}/conversations/${conversationId}/messages`);
    return data;
  }
  
  async sendMessage(dto: SendMessageDto): Promise<Message> {
    const { data } = await http.post(`${this.basePath}/messages`, dto);
    return data;
  }
  
  async deleteMessage(messageId: string): Promise<void> {
    await http.delete(`${this.basePath}/messages/${messageId}`);
  }
}

export const chatService = new ChatService();
```

### 3. WebSocket Manager

```typescript
// services/websocket/socketManager.ts
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/stores/authStore';
import type { Message } from '@/types/chat.types';

class SocketManager {
  private socket: Socket | null = null;
  private eventHandlers = new Map<string, Set<Function>>();
  
  connect(): void {
    const token = useAuthStore.getState().token;
    
    this.socket = io(import.meta.env.VITE_WS_URL || 'http://localhost:9000', {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
    });
    
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });
    
    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });
  }
  
  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.eventHandlers.clear();
  }
  
  on(event: string, handler: Function): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
      this.socket?.on(event, (...args) => {
        this.eventHandlers.get(event)?.forEach(h => h(...args));
      });
    }
    this.eventHandlers.get(event)?.add(handler);
  }
  
  off(event: string, handler: Function): void {
    this.eventHandlers.get(event)?.delete(handler);
  }
  
  emit(event: string, data: any): void {
    this.socket?.emit(event, data);
  }
}

export const socketManager = new SocketManager();
```

---

## Styling Standards

### 1. TailwindCSS Convention

```typescript
// ✅ GOOD: Organized class names
<div className="
  flex items-center justify-between
  px-4 py-2
  bg-white dark:bg-gray-800
  rounded-lg shadow-md
  hover:shadow-lg transition-shadow
">
  Content
</div>
```

### 2. CSS Modules for Complex Components

```typescript
// ChatMessage.module.css
.message {
  display: flex;
  padding: 1rem;
  border-radius: 0.5rem;
}

.messageOwn {
  justify-content: flex-end;
  background-color: #3b82f6;
}

// ChatMessage.tsx
import styles from './ChatMessage.module.css';

export function ChatMessage({ isOwn }: Props) {
  return (
    <div className={`${styles.message} ${isOwn ? styles.messageOwn : ''}`}>
      Content
    </div>
  );
}
```

---

## Testing Standards

### 1. Unit Tests for Utils

```typescript
// utils/formatters.test.ts
import { describe, it, expect } from 'vitest';
import { formatTimestamp } from './formatters';

describe('formatTimestamp', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-01T12:00:00');
    expect(formatTimestamp(date)).toBe('12:00 PM');
  });
});
```

### 2. Component Tests

```typescript
// components/common/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('should render children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });
  
  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```

---

## Best Practices Summary

### ✅ DO
- Luôn dùng TypeScript
- Tách logic ra khỏi components (custom hooks, stores)
- Tạo reusable components
- Validate inputs ở client side
- Handle errors gracefully
- Use semantic HTML
- Optimize re-renders với memo/callback
- Write tests cho critical logic

### ❌ DON'T
- Đừng prop drilling (dùng context/store thay vì)
- Đừng hardcode values (dùng constants/config)
- Đừng ignore TypeScript errors
- Đừng fetch data trong components (dùng stores/hooks)
- Đừng inline styles (dùng Tailwind/CSS modules)
- Đừng commit commented code
- Đừng skip error handling

---

## Code Review Checklist

Trước khi commit code, check:
- [ ] TypeScript không có errors
- [ ] ESLint không có warnings
- [ ] Components có proper types
- [ ] Logic được tách ra khỏi UI
- [ ] Không có duplicate code
- [ ] Error handling đầy đủ
- [ ] Có tests cho critical logic
- [ ] Code dễ đọc, dễ hiểu

---

**📌 Remember**: Code được đọc nhiều hơn là viết. Hãy viết code cho người khác đọc, không chỉ cho máy chạy.
