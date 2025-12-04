// LoginForm Component - Authentication form

import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { validateLoginForm } from '@/utils/validators';
import { ROUTES } from '@/utils/constants';

export function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [validationError, setValidationError] = useState<string | null>(null);

    const { login, isLoading, error, clearError } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setValidationError(null);
        clearError();

        // Validate
        const error = validateLoginForm(email, password);
        if (error) {
            setValidationError(error);
            return;
        }

        // Login
        const success = await login({ email, password });
        if (success) {
            navigate(ROUTES.CHAT);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-6">
                Login to MessApp
            </h2>

            {(error || validationError) && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                    {error || validationError}
                </div>
            )}

            <Input
                type="email"
                label="Email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
            />

            <Input
                type="password"
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
            />

            <Button type="submit" className="w-full" isLoading={isLoading}>
                Login
            </Button>

            <p className="text-center text-sm text-gray-600 mt-4">
                Don't have an account?{' '}
                <a href={ROUTES.REGISTER} className="text-primary-600 hover:underline">
                    Register
                </a>
            </p>
        </form>
    );
}
