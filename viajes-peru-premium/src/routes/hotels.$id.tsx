import { createFileRoute } from '@tanstack/react-router';
import { HotelDetail } from '@/features/catalog/catalog-pages';
import { hotels } from '@/mocks/data';
import { pageHead } from '@/app/routes';
export const Route=createFileRoute('/hotels/$id')({head:({params})=>pageHead(hotels.find(t=>t.id===params.id)?.name??'Hotel no disponible','Explora servicios y habitaciones.'),component:Page});
function Page(){return <HotelDetail id={Route.useParams().id}/>}
