import { createFileRoute } from '@tanstack/react-router';
import { TourDetail } from '@/features/catalog/catalog-pages';
import { tours } from '@/mocks/data';
import { pageHead } from '@/app/routes';
export const Route=createFileRoute('/tours/$id')({head:({params})=>pageHead(tours.find(t=>t.id===params.id)?.title??'Experiencia no disponible','Descubre el itinerario y detalles.'),component:Page});
function Page(){const {id}=Route.useParams();return <TourDetail id={id}/>}
