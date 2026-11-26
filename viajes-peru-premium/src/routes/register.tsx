import { createFileRoute } from '@tanstack/react-router';
import { AuthPage } from '@/features/auth/auth-page';
import { pageHead } from '@/app/routes';
export const Route=createFileRoute('/register')({head:()=>pageHead('Crear cuenta','Únete a la comunidad de viajeros de DMGOTRAVEL.'),component:()=> <AuthPage mode="register"/>});
