import { createFileRoute } from '@tanstack/react-router';
import { ReservationsPage } from '@/features/account/account-pages';
import { pageHead } from '@/app/routes';
export const Route=createFileRoute('/account/reservations/')({head:()=>pageHead('Mis reservas','Consulta tus reservas de demostración y sus estados.'),component:()=> <ReservationsPage/>});
