import { createFileRoute } from '@tanstack/react-router';
import { CheckoutPage } from '@/features/reservations/booking-pages';
import { pageHead } from '@/app/routes';
export const Route=createFileRoute('/checkout/$reservationId')({head:()=>pageHead('Pago seguro de demostración','Revisa el total y simula el pago de tu reserva.'),component:Page});
function Page(){return <CheckoutPage id={Route.useParams().reservationId}/>}
