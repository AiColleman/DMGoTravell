import { createFileRoute } from '@tanstack/react-router';
import { ReservationDetail } from '@/features/account/account-pages';
import { pageHead } from '@/app/routes';
export const Route=createFileRoute('/account/reservations/$id')({head:({params})=>pageHead(`Reserva ${params.id}`,'Detalle y seguimiento de tu reserva de demostración.'),component:Page});
function Page(){return <ReservationDetail id={Route.useParams().id}/>}
