// RegisterPage - Public registration page

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { RegisterForm } from '../components/features/auth/RegisterForm';
import { AuthLayout } from '../components/layout/AuthLayout';
import { useAuth } from '../hooks/useAuth';

export function RegisterPage() {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();

    useEffect(() => {
        if (isAuthenticated) {
            navigate('/chat');
        }
    }, [isAuthenticated, navigate]);

    return (
        <AuthLayout
            title="Create Account"
            subtitle="Join us and start chatting"
        >
            <RegisterForm />
        </AuthLayout>
    );
}
