// Routes configuration

import { Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ChatPage } from '@/pages/ChatPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { NotFoundPage } from '@/pages/NotFoundPage';
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
                <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* 404 - Not Found */}
            <Route path="/404" element={<NotFoundPage />} />

            {/* Redirect unknown routes to 404 */}
            <Route path="*" element={<NotFoundPage />} />
        </Routes>
    );
}
