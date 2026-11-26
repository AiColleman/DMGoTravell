import { createFileRoute } from '@tanstack/react-router';
import { BookingSuccess } from '@/features/reservations/booking-pages';
import { pageHead } from '@/app/routes';
export const Route=createFileRoute('/booking/success')({validateSearch:(s:Record<string,unknown>)=>({reservationId:typeof s.reservationId==='string'?s.reservationId:''}),head:()=>pageHead('Reserva confirmada','Tu experiencia de demostración está confirmada.'),component:Page});
function Page(){return <BookingSuccess id={Route.useSearch().reservationId}/>}
