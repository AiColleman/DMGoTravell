import { createFileRoute } from '@tanstack/react-router';
import { BookingPage } from '@/features/reservations/booking-pages';
import { pageHead } from '@/app/routes';
export const Route=createFileRoute('/booking/$tourId')({validateSearch:(s:Record<string,unknown>)=>({date:typeof s.date==='string'?s.date:'',travelers:Number(s.travelers)||2,hotelId:typeof s.hotelId==='string'?s.hotelId:'',roomId:typeof s.roomId==='string'?s.roomId:'',checkOut:typeof s.checkOut==='string'?s.checkOut:''}),head:()=>pageHead('Personaliza tu reserva','Elige salida, viajeros y alojamiento opcional para tu experiencia.'),component:Page});
function Page(){const s=Route.useSearch();return <BookingPage tourId={Route.useParams().tourId} initialDate={s.date} initialTravelers={s.travelers} initialHotel={s.hotelId} initialRoom={s.roomId} initialCheckOut={s.checkOut}/>}
