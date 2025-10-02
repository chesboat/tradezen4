import { useState } from 'react';
import { LoginForm } from './LoginForm';
import { SignupForm } from './SignupForm';
import { ArrowLeft } from 'lucide-react';

interface AuthPageProps {
  initialMode?: 'login' | 'signup';
  onBack?: () => void;
}

export function AuthPage({ initialMode = 'login', onBack }: AuthPageProps) {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');

  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>
        )}
        {isLogin ? <LoginForm /> : <SignupForm />}
        <div className="text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-primary hover:text-primary/80 transition-colors"
          >
            {isLogin
              ? "Don't have an account? Sign up"
              : 'Already have an account? Log in'}
          </button>
        </div>
      </div>
    </div>
  );
}