import { createFileRoute } from '@tanstack/react-router';
import { CatalogPage } from '@/features/catalog/catalog-pages';
import { pageHead } from '@/app/routes';
export const Route=createFileRoute('/tours/')({validateSearch:(s:Record<string,unknown>)=>({destination:typeof s.destination==='string'?s.destination:'',category:typeof s.category==='string'?s.category:'',date:typeof s.date==='string'?s.date:'',travelers:Number(s.travelers)||2}),head:()=>pageHead('Tours y experiencias','Encuentra tours en Perú.'),component:Page});
function Page(){const s=Route.useSearch();return <CatalogPage initialDestination={s.destination} initialCategory={s.category} initialDate={s.date}/>}
