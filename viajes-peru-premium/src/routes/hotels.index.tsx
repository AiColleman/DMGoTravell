import { createFileRoute } from '@tanstack/react-router';
import { CatalogPage } from '@/features/catalog/catalog-pages';
import { pageHead } from '@/app/routes';
export const Route=createFileRoute('/hotels/')({validateSearch:(s:Record<string,unknown>)=>({destination:typeof s.destination==='string'?s.destination:''}),head:()=>pageHead('Hoteles con encanto','Alojamientos seleccionados en Cusco, Ayacucho, Arequipa y Lima.'),component:Page});
function Page(){return <CatalogPage hotel initialDestination={Route.useSearch().destination}/>}
