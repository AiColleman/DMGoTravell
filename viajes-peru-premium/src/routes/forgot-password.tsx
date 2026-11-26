import { createFileRoute } from '@tanstack/react-router';
import { AuthPage } from '@/features/auth/auth-page';
import { pageHead } from '@/app/routes';
export const Route=createFileRoute('/forgot-password')({head:()=>pageHead('Recuperar contraseña','Solicita la recuperación visual de tu cuenta de demostración.'),component:()=> <AuthPage mode="forgot"/>});
