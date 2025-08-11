
'use client';

import * as React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Separator } from './ui/separator';

const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1Z"
      />
    </svg>
  );
  
const AppleIcon = () => (
<svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
    <path
    fill="currentColor"
    d="M17.2,2.48C15.86,2.5 14.54,3.2 13.56,4.35C12.5,5.58 11.9,7.23 12.16,8.85C12.16,8.85 12.2,8.88 12.2,8.88C12.18,8.88 12.16,8.87 12.16,8.87C13.62,8.68 15,7.9 16.14,6.7C17.2,5.58 17.8,4 17.5,2.48C17.47,2.48 17.3,2.48 17.2,2.48M10.5,9.2C9,9.2 7.1,10.2 6,11.75C3.8,14.6 5.1,18.6 6.8,20.5C7.8,21.5 8.9,22.1 10.2,22C11.5,21.9 12,21.2 13.6,21.2C15.3,21.2 15.8,21.9 17.1,22C18.4,22.1 19.5,21.5 20.5,20.5C21.5,19.5 22,18.3 22,17.1C22,14.16 20.3,12.66 18.5,11.6C17.1,10.8 15.6,10.2 15.6,10.2C15.6,10.2 16.1,9.8 17.4,9C18.6,8.1 19.5,6.8 19.8,5.4C19.8,5.4 19.8,5.4 19.8,5.4C19.8,5.4 19.8,5.4 19.8,5.4C17.1,5.2 14.8,6.8 13.7,8.2C13,8.9 12.2,9.3 11,9.2C10.9,9.2 10.7,9.2 10.5,9.2Z"
    />
</svg>
);


export default function ClientLoginForm() {
    const { signInWithGoogle, signInWithApple } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = React.useState<string | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    const handleSocialLogin = async (provider: 'google' | 'apple') => {
        setIsLoading(provider);
        setError(null);
        try {
            const signInMethod = provider === 'google' ? signInWithGoogle : signInWithApple;
            await signInMethod();
            const redirectedFrom = searchParams.get('redirectedFrom');
            router.push(redirectedFrom || '/client-dashboard');
            router.refresh();
        } catch (error: any) {
            let errorMessage = "An unexpected error occurred during sign-in.";
            if (error.code === 'auth/popup-closed-by-user') {
                errorMessage = "The sign-in window was closed. Please try again.";
            } else if (error.code === 'auth/cancelled-popup-request') {
                // Do nothing, user cancelled.
                return;
            } else {
                 console.error(`${provider} sign-in error:`, error);
            }
            setError(errorMessage);
        } finally {
            setIsLoading(null);
        }
    };

    return (
        <div className="space-y-4">
             {error && (
                <Alert variant="destructive">
                    <AlertTitle>Error de Autenticación</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}
            <Button 
                variant="outline" 
                className="w-full h-12 text-base"
                onClick={() => handleSocialLogin('google')}
                disabled={!!isLoading}
            >
                {isLoading === 'google' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <GoogleIcon />}
                Continuar con Google
            </Button>
            <Button 
                variant="default" 
                className="w-full h-12 text-base bg-black hover:bg-gray-800 text-white"
                onClick={() => handleSocialLogin('apple')}
                disabled={!!isLoading}
            >
                 {isLoading === 'apple' ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <AppleIcon />}
                Continuar con Apple
            </Button>

            <div className="relative my-4">
                <Separator />
                <span className="absolute left-1/2 -translate-x-1/2 top-[-10px] bg-card px-2 text-xs text-muted-foreground">O</span>
            </div>

            <p className="px-8 text-center text-sm text-muted-foreground">
                Al continuar, aceptas nuestros{" "}
                <a href="/terms" className="underline underline-offset-4 hover:text-primary">
                    Términos de Servicio
                </a>{" "}
                y{" "}
                <a href="/privacy" className="underline underline-offset-4 hover:text-primary">
                    Política de Privacidad
                </a>
                .
            </p>
            
        </div>
    );
}

