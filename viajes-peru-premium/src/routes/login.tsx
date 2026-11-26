import { createFileRoute } from '@tanstack/react-router';
import { AuthPage } from '@/features/auth/auth-page';
import { pageHead } from '@/app/routes';
export const Route=createFileRoute('/login')({head:()=>pageHead('Iniciar sesión','Accede a tu cuenta de demostración.'),component:()=> <AuthPage mode="login"/>});
