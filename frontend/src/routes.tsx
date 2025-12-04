// Routes configuration

import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ChatPage } from '@/pages/ChatPage';
import { ROUTES } from '@/utils/constants';

export function AppRoutes() {
    return (
        <Routes>
            {/* Public routes */}
            <Route path={ROUTES.LOGIN} element={<LoginPage />} />
            <Route path={ROUTES.REGISTER} element={<RegisterPage />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
                <Route path={ROUTES.CHAT} element={<ChatPage />} />
            </Route>

            {/* Redirect unknown routes to chat */}
            <Route path="*" element={<Navigate to={ROUTES.CHAT} replace />} />
        </Routes>
    );
}
