// RegisterPage - Public registration page

import { RegisterForm } from '@/components/features/auth/RegisterForm';
import { Card } from '@/components/common/Card';

export function RegisterPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <RegisterForm />
            </Card>
        </div>
    );
}
