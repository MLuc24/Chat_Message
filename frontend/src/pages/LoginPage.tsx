// LoginPage - Public authentication page

import { LoginForm } from '@/components/features/auth/LoginForm';
import { Card } from '@/components/common/Card';

export function LoginPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <LoginForm />
            </Card>
        </div>
    );
}
