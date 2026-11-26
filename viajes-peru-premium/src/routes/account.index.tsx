import { createFileRoute } from '@tanstack/react-router';
import { AccountHome } from '@/features/account/account-pages';
import { pageHead } from '@/app/routes';
export const Route=createFileRoute('/account/')({head:()=>pageHead('Mi cuenta','Tu próxima reserva, actividad y resumen de viajes.'),component:()=> <AccountHome/>});
