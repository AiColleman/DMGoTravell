import { createFileRoute } from '@tanstack/react-router';
import { ProfilePage } from '@/features/account/account-pages';
import { pageHead } from '@/app/routes';
export const Route=createFileRoute('/account/profile')({head:()=>pageHead('Mi perfil','Gestiona visualmente tus datos personales y seguridad.'),component:()=> <ProfilePage/>});
