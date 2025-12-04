// LoginPage - Public authentication page

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginForm } from '../components/features/auth/LoginForm';
import { AuthLayout } from '../components/layout/AuthLayout';
import { useAuth } from '../hooks/useAuth';

export function LoginPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/chat');
        }
    }, [isAuthenticated, navigate]);

    return (
        <AuthLayout
            title="Welcome Back"
            subtitle="Sign in to continue chatting"
        >
            <LoginForm />
        </AuthLayout>
    );
}
